import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { ComplaintStatusValue } from './complaint-status.enum';

export class TransitionComplaintDto {
  @ApiProperty({
    enum: ComplaintStatusValue,
    example: ComplaintStatusValue.IN_INVESTIGATION,
    description: 'Target workflow status for this transition.',
  })
  @IsEnum(ComplaintStatusValue)
  toStatus!: ComplaintStatusValue;

  @ApiProperty({
    example: 'Field verification started by assigned officer.',
    description: 'Required reason for workflow transition.',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}
