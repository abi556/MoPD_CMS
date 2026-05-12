import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisHealthService } from './queue/redis-health.service';

describe('AppController', () => {
  let appController: AppController;
  const redisHealthMock = {
    ping: jest.fn(),
  };

  beforeEach(async () => {
    redisHealthMock.ping.mockReset();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: RedisHealthService, useValue: redisHealthMock },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return health payload', () => {
      expect(appController.getHealth()).toEqual({
        data: {
          status: 'ok',
          service: 'mopd-cms-api',
        },
      });
    });
  });

  describe('redis health', () => {
    const mockRes = (): Pick<Response, 'status'> & { _status: number } => {
      const res = { _status: 200, status: jest.fn() } as unknown as Pick<
        Response,
        'status'
      > & { _status: number; status: jest.Mock };
      res.status.mockImplementation((code: number) => {
        res._status = code;
        return res;
      });
      return res;
    };

    it('returns ok when redis is up', async () => {
      redisHealthMock.ping.mockResolvedValueOnce({
        status: 'ok',
        latencyMs: 3,
      });
      const res = mockRes();
      const result = await appController.getRedisHealth(res as Response);
      expect(result).toEqual({ data: { status: 'ok', latencyMs: 3 } });
      expect(res._status).toBe(200);
    });

    it('returns 503 when redis is down', async () => {
      redisHealthMock.ping.mockResolvedValueOnce({
        status: 'down',
        latencyMs: null,
        error: 'ECONNREFUSED',
      });
      const res = mockRes();
      const result = await appController.getRedisHealth(res as Response);
      expect(res._status).toBe(503);
      expect(result.data.status).toBe('down');
    });
  });

  describe('readiness', () => {
    it('returns ready when all deps are ok', async () => {
      redisHealthMock.ping.mockResolvedValueOnce({
        status: 'ok',
        latencyMs: 2,
      });
      const res = { status: jest.fn() } as unknown as Response;
      const result = await appController.getReadiness(res);
      expect(result.data.status).toBe('ready');
    });

    it('returns 503 not_ready when redis is down', async () => {
      redisHealthMock.ping.mockResolvedValueOnce({
        status: 'down',
        latencyMs: null,
      });
      const statusFn = jest.fn();
      const res = { status: statusFn } as unknown as Response;
      const result = await appController.getReadiness(res);
      expect(result.data.status).toBe('not_ready');
      expect(statusFn).toHaveBeenCalledWith(503);
    });
  });
});
