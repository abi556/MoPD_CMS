import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({
    example: 'user-admin-0001',
    description: 'Authenticated user id.',
  })
  id!: string;

  @ApiProperty({
    example: 'admin@mopd.local',
    description: 'Authenticated user email.',
  })
  email!: string;

  @ApiProperty({
    example: ['SuperAdmin'],
    description: 'Effective user roles.',
    type: [String],
  })
  roles!: string[];

  @ApiProperty({
    example: ['admin:ping', 'complaints:list'],
    description: 'Effective user permissions.',
    type: [String],
  })
  permissions!: string[];
}

export class TokenPairDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWFkbWluLTAwMDEiLCJlbWFpbCI6ImFkbWluQG1vcGQubG9jYWwiLCJyb2xlcyI6WyJTdXBlckFkbWluIl0sImlhdCI6MTc3NzM5MDMxOSwiZXhwIjoxNzc3MzkxMjE5fQ.E5dVEvTX0qojmytMn29ULz4qRMVxv34z2oJ8UA_UhFI',
    description: 'JWT access token.',
  })
  accessToken!: string;

  @ApiProperty({
    example: 'Bearer',
    description: 'Token type.',
  })
  tokenType!: 'Bearer';

  @ApiProperty({
    example: 900,
    description: 'Access token TTL in seconds.',
  })
  expiresIn!: number;
}

export class LoginDataDto {
  @ApiProperty({
    description: 'Whether the user must change password before full access.',
    example: false,
  })
  mustChangePassword!: boolean;

  @ApiProperty({
    description:
      'When true, no access token is issued; use mfaToken with POST /auth/mfa/verify.',
    example: false,
  })
  mfaRequired!: boolean;

  @ApiPropertyOptional({
    type: AuthUserDto,
    description: 'Present when mfaRequired is false.',
  })
  user?: AuthUserDto;

  @ApiPropertyOptional({
    description: 'Present when mfaRequired is false.',
  })
  accessToken?: string;

  @ApiPropertyOptional({
    enum: ['Bearer'],
    description: 'Present when mfaRequired is false.',
  })
  tokenType?: 'Bearer';

  @ApiPropertyOptional({
    description:
      'Access token TTL in seconds. Present when mfaRequired is false.',
  })
  expiresIn?: number;

  @ApiPropertyOptional({
    description:
      'Short-lived JWT for MFA challenge. Present when mfaRequired is true; send as Bearer on POST /auth/mfa/verify.',
  })
  mfaToken?: string;
}

export class LoginResponseDto {
  @ApiProperty({
    type: LoginDataDto,
    description:
      'Login without MFA: user + accessToken + mustChangePassword + mfaRequired false. With MFA: mustChangePassword + mfaRequired true + mfaToken only.',
  })
  data!: LoginDataDto;
}

export class RefreshResponseDto {
  @ApiProperty({
    type: TokenPairDto,
  })
  data!: TokenPairDto;
}

class LogoutDataDto {
  @ApiProperty({
    example: 'Logged out successfully',
    description: 'Logout result message.',
  })
  message!: string;
}

export class LogoutResponseDto {
  @ApiProperty({
    type: LogoutDataDto,
  })
  data!: LogoutDataDto;
}

export class MeProfileDto extends AuthUserDto {
  @ApiProperty({ description: 'Whether the user must change password first.' })
  mustChangePassword!: boolean;

  @ApiProperty({
    description:
      'Soft prompt flag: user should be offered MFA setup (e.g. after first login).',
  })
  mustEnrollMfa!: boolean;

  @ApiProperty({
    description:
      'Hard requirement: elevated roles must enroll before using the console.',
  })
  requireMfaEnrollment!: boolean;

  @ApiProperty({ description: 'Whether MFA is active for this account.' })
  mfaEnrolled!: boolean;

  @ApiProperty({
    enum: ['totp', 'email'],
    nullable: true,
    description: 'Current MFA method when enrolled.',
  })
  mfaMethod!: 'totp' | 'email' | null;

  @ApiProperty({
    description:
      'Whether MFA enrollment can be deferred (optional policy only).',
  })
  canSkipMfaEnroll!: boolean;
}

export class MeResponseDto {
  @ApiProperty({
    type: MeProfileDto,
  })
  data!: MeProfileDto;
}
