import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class MfaDisableDto {
  @ApiProperty({ example: 'MyPassword123!', description: 'Current password for re-verification.' })
  @IsString()
  @MinLength(8)
  password!: string;
}
