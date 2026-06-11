import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class MfaConfirmDto {
  @ApiProperty({
    example: '123456',
    description: 'TOTP 6-digit code from authenticator app.',
  })
  @IsString()
  @Length(6, 6)
  code!: string;
}
