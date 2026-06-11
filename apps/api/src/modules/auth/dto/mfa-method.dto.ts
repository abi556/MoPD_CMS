import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class MfaMethodDto {
  @ApiProperty({
    example: 'totp',
    enum: ['totp', 'email'],
    description: 'Preferred MFA method.',
  })
  @IsString()
  @IsIn(['totp', 'email'])
  method!: 'totp' | 'email';
}
