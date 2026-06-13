import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto, TokenPairDto } from './auth-response.dto';

export class MfaEnrollmentDataDto {
  @ApiProperty({
    description: 'QR code as a data URL for scanning in an authenticator app.',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  qrCodeDataUrl!: string;

  @ApiProperty({
    description: 'Base32 TOTP secret (also encoded in the QR code).',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret!: string;

  @ApiProperty({
    description: 'One-time backup codes (shown once at enrollment).',
    example: ['A1B2C3D4', 'E5F6G7H8'],
    type: [String],
  })
  backupCodes!: string[];
}

export class MfaEnrollmentResponseDto {
  @ApiProperty({ type: MfaEnrollmentDataDto })
  data!: MfaEnrollmentDataDto;
}

export class MfaVerifyDataDto extends TokenPairDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty({
    description: 'Whether the user must change password on next action.',
    example: false,
  })
  mustChangePassword!: boolean;
}

export class MfaVerifyResponseDto {
  @ApiProperty({ type: MfaVerifyDataDto })
  data!: MfaVerifyDataDto;
}

export class MfaStatusDataDto {
  @ApiProperty({ description: 'Whether TOTP MFA is enrolled for this user.' })
  enrolled!: boolean;

  @ApiProperty({
    enum: ['totp', 'email'],
    nullable: true,
    description: 'Active MFA method when enrolled.',
  })
  method!: 'totp' | 'email' | null;

  @ApiProperty({ enum: ['totp'], example: 'totp' })
  provider!: 'totp';

  @ApiProperty({
    enum: ['optional', 'required'],
    description:
      'Org policy from AUTH_MFA_REQUIRED; elevated roles always require MFA.',
  })
  policy!: 'optional' | 'required';

  @ApiProperty({
    description:
      'User must complete TOTP enrollment before accessing the staff console.',
  })
  mustEnroll!: boolean;

  @ApiProperty({
    description: 'When true, switching to email OTP is not allowed.',
  })
  totpOnly!: boolean;

  @ApiProperty({
    description:
      'Whether the user may defer enrollment and use the console now.',
  })
  canSkipEnroll!: boolean;
}

export class MfaStatusResponseDto {
  @ApiProperty({ type: MfaStatusDataDto })
  data!: MfaStatusDataDto;
}
