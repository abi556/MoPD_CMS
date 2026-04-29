import { ApiProperty } from '@nestjs/swagger';

class ErrorDetailsDto {
  @ApiProperty({
    example: 'VALIDATION_ERROR',
    description: 'Machine-readable error code.',
  })
  code!: string;

  @ApiProperty({
    example: 'Request validation failed',
    description: 'Human-readable message.',
  })
  message!: string;

  @ApiProperty({
    example: '4c43e7c5-e0da-4a17-ad85-bf077c099982',
    description: 'Correlation id for tracing logs.',
  })
  correlationId!: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    type: ErrorDetailsDto,
  })
  error!: ErrorDetailsDto;
}
