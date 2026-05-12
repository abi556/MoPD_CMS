import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class EscalateComplaintDto {
  @ApiProperty({
    description: 'Reason for escalation',
    example: 'No response after 48 hours',
  })
  @IsString()
  @MinLength(3)
  reason!: string;
}
