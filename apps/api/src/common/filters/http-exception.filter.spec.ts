import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GlobalHttpExceptionFilter } from './http-exception.filter';

function createHostMocks(correlationId = 'corr-test-id') {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: jest.fn(() => ({
      getResponse: jest.fn(() => ({ status })),
      getRequest: jest.fn(() => ({ correlationId })),
    })),
  };

  return { host, status, json };
}

describe('GlobalHttpExceptionFilter', () => {
  let filter: GlobalHttpExceptionFilter;

  beforeEach(() => {
    filter = new GlobalHttpExceptionFilter();
  });

  it('maps not found exceptions to standardized envelope', () => {
    const { host, status, json } = createHostMocks();

    filter.catch(new NotFoundException('missing'), host as never);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        correlationId: 'corr-test-id',
      },
    });
  });

  it('maps validation exceptions to 422 envelope', () => {
    const { host, status, json } = createHostMocks();
    const exception = new BadRequestException({
      message: ['subject must be longer than or equal to 5 characters'],
    });

    filter.catch(exception, host as never);

    expect(status).toHaveBeenCalledWith(422);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'subject must be longer than or equal to 5 characters',
        correlationId: 'corr-test-id',
      },
    });
  });

  it('maps unauthorized exceptions to unauthorized code', () => {
    const { host, status, json } = createHostMocks();

    filter.catch(new UnauthorizedException('Invalid token'), host as never);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
        correlationId: 'corr-test-id',
      },
    });
  });

  it('maps unknown errors to INTERNAL_ERROR envelope', () => {
    const { host, status, json } = createHostMocks();

    filter.catch(new Error('boom'), host as never);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
        correlationId: 'corr-test-id',
      },
    });
  });
});
