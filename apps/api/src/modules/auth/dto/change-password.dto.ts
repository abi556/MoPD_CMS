import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/is-strong-password.decorator';
import { PASSWORD_MIN_LENGTH } from '../../../common/validators/password-policy';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPass123!',
    minLength: 8,
    description: 'Current password for verification.',
  })
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @ApiProperty({
    example: 'NewStrongPass456!',
    minLength: PASSWORD_MIN_LENGTH,
    description:
      'New password: min 12 chars with uppercase, lowercase, number, and special character.',
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @IsStrongPassword()
  newPassword!: string;
}
