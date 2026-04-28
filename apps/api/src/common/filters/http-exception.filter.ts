import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RequestWithCorrelationId } from '../middleware/correlation-id.middleware';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithCorrelationId>();

    const { statusCode, code, message } = this.mapException(exception);
    const correlationId = request.correlationId;

    response.status(statusCode).json({
      error: {
        code,
        message,
        correlationId,
      },
    });
  }

  private mapException(exception: unknown): {
    statusCode: number;
    code: string;
    message: string;
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (statusCode === HttpStatus.NOT_FOUND) {
        return {
          statusCode,
          code: 'not_found',
          message: 'Resource not found',
        };
      }

      if (statusCode === HttpStatus.BAD_REQUEST) {
        return {
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          code: 'validation_error',
          message: this.extractValidationMessage(exceptionResponse),
        };
      }

      return {
        statusCode,
        code: this.mapStatusToCode(statusCode),
        message: this.extractMessage(exceptionResponse, 'Request failed'),
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'internal_error',
      message: 'Something went wrong',
    };
  }

  private extractValidationMessage(exceptionResponse: string | object): string {
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse &&
      'message' in exceptionResponse &&
      Array.isArray(exceptionResponse.message) &&
      exceptionResponse.message.length > 0
    ) {
      return String(exceptionResponse.message[0]);
    }

    return this.extractMessage(exceptionResponse, 'Request validation failed');
  }

  private extractMessage(
    exceptionResponse: string | object,
    fallbackMessage: string,
  ): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse &&
      'message' in exceptionResponse
    ) {
      const message = exceptionResponse.message;
      if (Array.isArray(message) && message.length > 0) {
        return String(message[0]);
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return fallbackMessage;
  }

  private mapStatusToCode(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.UNAUTHORIZED:
        return 'unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'forbidden';
      case HttpStatus.CONFLICT:
        return 'conflict';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'rate_limit_exceeded';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'validation_error';
      default:
        return 'request_failed';
    }
  }
}
