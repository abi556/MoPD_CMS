import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AppService } from './app.service';
import { RedisHealthService } from './queue/redis-health.service';

@ApiTags('health')
@Controller('health')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly redisHealth: RedisHealthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('redis')
  @ApiOperation({ summary: 'Redis connectivity probe (PING)' })
  async getRedisHealth(@Res({ passthrough: true }) res: Response) {
    const status = await this.redisHealth.ping();
    if (status.status !== 'ok') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { data: status };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness probe (all critical deps)' })
  async getReadiness(@Res({ passthrough: true }) res: Response) {
    const redis = await this.redisHealth.ping();
    const ready = redis.status === 'ok';
    if (!ready) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return {
      data: {
        status: ready ? 'ready' : 'not_ready',
        dependencies: { redis },
      },
    };
  }
}
