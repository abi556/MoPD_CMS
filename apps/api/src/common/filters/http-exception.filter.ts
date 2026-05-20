import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
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

      if (statusCode === 404) {
        return {
          statusCode,
          code: 'NOT_FOUND',
          message: 'Resource not found',
        };
      }

      if (statusCode === 400) {
        return {
          statusCode: 422,
          code: 'VALIDATION_ERROR',
          message: this.extractValidationMessage(exceptionResponse),
        };
      }

      const customCode = this.extractErrorCode(exceptionResponse);
      return {
        statusCode,
        code: customCode ?? this.mapStatusToCode(statusCode),
        message: this.extractMessage(exceptionResponse, 'Request failed'),
      };
    }

    return {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
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

  private extractErrorCode(
    exceptionResponse: string | object,
  ): string | undefined {
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse &&
      'code' in exceptionResponse &&
      typeof exceptionResponse.code === 'string'
    ) {
      return exceptionResponse.code;
    }
    return undefined;
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
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 409:
        return 'CONFLICT';
      case 429:
        return 'RATE_LIMIT_EXCEEDED';
      case 422:
        return 'VALIDATION_ERROR';
      default:
        return 'REQUEST_FAILED';
    }
  }
}
