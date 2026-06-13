import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBooleanString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IsStrongPassword } from '../../../common/validators/is-strong-password.decorator';
import { PASSWORD_MIN_LENGTH } from '../../../common/validators/password-policy';

export class ListUsersQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ example: 'admin@mopd.local' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'new.user@mopd.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'StrongPass123!',
    minLength: PASSWORD_MIN_LENGTH,
    description:
      'Initial password: min 8 chars with uppercase, lowercase, number, and special character (12+ recommended).',
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @IsStrongPassword()
  password!: string;

  @ApiProperty({ example: ['role-case-officer'], type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roleIds!: string[];
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'updated.user@mopd.local' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: ['role-super-admin'], type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roleIds?: string[];
}

export class UpdateOwnProfileDto {
  @ApiProperty({ example: 'my.updated.email@mopd.local' })
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;
}

export class UserItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ type: [String] })
  roles!: string[];

  @ApiProperty()
  isActive!: boolean;
}

export class ListUsersResponseDto {
  @ApiProperty({ type: [UserItemDto] })
  data!: UserItemDto[];

  @ApiProperty({
    example: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  })
  meta!: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export class UserDetailResponseDto {
  @ApiProperty({ type: UserItemDto })
  data!: UserItemDto;
}
