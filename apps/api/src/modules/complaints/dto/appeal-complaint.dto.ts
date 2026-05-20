import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AppealComplaintDto {
  @ApiProperty({
    description: 'Reason for escalating the complaint to appeal status.',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  reason!: string;
}
