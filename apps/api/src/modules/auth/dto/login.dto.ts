import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@mopd.local',
    description: 'User email for authentication.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'AdminPass123!',
    minLength: 8,
    description: 'User password.',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
