import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationDeliveryStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListNotificationDeliveriesQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({ enum: NotificationDeliveryStatus })
  @IsOptional()
  @IsEnum(NotificationDeliveryStatus)
  status?: NotificationDeliveryStatus;

  @ApiPropertyOptional({
    example: 'citizen@example.com',
    description: 'Filter by recipient email.',
  })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({
    example: 'complaint_submitted_ack',
    description: 'Filter by template key.',
  })
  @IsOptional()
  @IsString()
  templateKey?: string;
}
