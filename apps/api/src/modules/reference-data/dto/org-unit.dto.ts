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

export class CreateOrgUnitDto {
  @ApiProperty({
    example: 'DIR_ROADS',
    description: 'Unique machine-readable code.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'code must be uppercase letters, digits, and underscores',
  })
  code!: string;

  @ApiProperty({
    example: 'Directorate of Roads',
    description: 'English display name.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  nameEn!: string;

  @ApiPropertyOptional({
    example: 'የመንገድ ዳይሬክቶሬት',
    description: 'Amharic display name.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameAm?: string;

  @ApiPropertyOptional({ description: 'Parent org unit ID for hierarchy.' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateOrgUnitDto extends PartialType(CreateOrgUnitDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class OrgUnitResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  @ApiProperty({ nullable: true, type: String }) nameAm!: string | null;
  @ApiProperty({ nullable: true, type: String }) parentId!: string | null;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() createdAt!: string;
}
