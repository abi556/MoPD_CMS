import { ApiProperty } from '@nestjs/swagger';

class AuthUserDto {
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

class TokenPairDto {
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

class LoginDataDto extends TokenPairDto {
  @ApiProperty({
    type: AuthUserDto,
    description: 'Authenticated user details.',
  })
  user!: AuthUserDto;
}

export class LoginResponseDto {
  @ApiProperty({
    type: LoginDataDto,
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

export class MeResponseDto {
  @ApiProperty({
    type: AuthUserDto,
  })
  data!: AuthUserDto;
}
