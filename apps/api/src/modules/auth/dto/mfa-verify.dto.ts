import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class MfaVerifyDto {
  @ApiProperty({ example: '123456', description: 'TOTP 6-digit code.', required: false })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  code?: string;

  @ApiProperty({ example: 'A1B2C3D4', description: 'One-time backup code.', required: false })
  @IsOptional()
  @IsString()
  backupCode?: string;
}
