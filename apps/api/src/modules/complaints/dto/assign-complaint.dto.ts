import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AssignComplaintDto {
  @ApiProperty({
    example: 'user-officer-0001',
    description: 'Target assignee user id.',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  assigneeUserId!: string;

  @ApiPropertyOptional({
    example: 'Routing based on transport infrastructure expertise.',
    description: 'Optional assignment rationale.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
