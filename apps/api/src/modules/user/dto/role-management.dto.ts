import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'role-reviewer' })
  @IsString()
  @MinLength(3)
  id!: string;

  @ApiProperty({ example: 'Reviewer' })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty({ type: [String], example: ['perm-complaints-detail'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionIds!: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Senior Reviewer' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({ type: [String], example: ['perm-complaints-list'] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionIds?: string[];
}

export class RoleItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: [String] })
  permissionCodes!: string[];
}

export class RoleListResponseDto {
  @ApiProperty({ type: [RoleItemDto] })
  data!: RoleItemDto[];
}

export class PermissionItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiPropertyOptional()
  description?: string | null;
}

export class PermissionListResponseDto {
  @ApiProperty({ type: [PermissionItemDto] })
  data!: PermissionItemDto[];
}
