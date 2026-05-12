import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'ROAD_INFRA', description: 'Unique machine-readable code (uppercase, snake_case).' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'code must be uppercase letters, digits, and underscores (e.g. ROAD_INFRA)',
  })
  code!: string;

  @ApiProperty({ example: 'Road Infrastructure', description: 'English display name.' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  nameEn!: string;

  @ApiPropertyOptional({ example: 'የመንገድ መሠረተ ልማት', description: 'Amharic display name.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameAm?: string;

  @ApiPropertyOptional({ description: 'Parent category ID for hierarchical nesting.' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: 0, description: 'Sort order within siblings.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CategoryResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  @ApiProperty({ nullable: true, type: String }) nameAm!: string | null;
  @ApiProperty({ nullable: true, type: String }) parentId!: string | null;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() createdAt!: string;
}
