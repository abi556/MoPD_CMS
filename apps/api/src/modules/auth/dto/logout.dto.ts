import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    example: 'f2CKSZXV32B2phYIwnopgoaIlE8MOu9j_INBQvjtVyPeX6ZS3SEDwoSam58_e0C9',
    minLength: 16,
    description: 'Current refresh token to invalidate during logout.',
  })
  @IsString()
  @MinLength(16)
  refreshToken!: string;
}
