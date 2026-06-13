import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/is-strong-password.decorator';
import { PASSWORD_MIN_LENGTH } from '../../../common/validators/password-policy';

export class ResetPasswordDto {
  @ApiProperty({
    description:
      'Plain reset token from the password reset flow (email or dev channel).',
  })
  @IsString()
  token!: string;

  @ApiProperty({
    example: 'NewSecurePass123!',
    minLength: PASSWORD_MIN_LENGTH,
    description:
      'New password: min 8 chars with uppercase, lowercase, number, and special character (12+ recommended).',
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @IsStrongPassword()
  newPassword!: string;
}
