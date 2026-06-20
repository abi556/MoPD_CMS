import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopCategoryItemDto {
  @ApiProperty()
  categoryId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiPropertyOptional({ nullable: true })
  nameAm!: string | null;

  @ApiProperty()
  count!: number;
}

export class TopCategoriesDataDto {
  @ApiProperty({ type: [TopCategoryItemDto] })
  categories!: TopCategoryItemDto[];

  @ApiProperty()
  days!: number;
}

export class TopCategoriesEnvelopeDto {
  @ApiProperty({ type: TopCategoriesDataDto })
  data!: TopCategoriesDataDto;
}

export class QueueActivityItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  complaintId!: string;

  @ApiProperty()
  referenceNo!: string;

  @ApiProperty()
  subject!: string;

  @ApiProperty({ enum: ['ASSIGNED', 'TRANSITIONED'] })
  action!: 'ASSIGNED' | 'TRANSITIONED';

  @ApiPropertyOptional({ nullable: true })
  fromStatus!: string | null;

  @ApiProperty()
  toStatus!: string;

  @ApiProperty()
  createdAt!: string;
}

export class QueueActivityDataDto {
  @ApiProperty({ type: [QueueActivityItemDto] })
  events!: QueueActivityItemDto[];
}

export class QueueActivityEnvelopeDto {
  @ApiProperty({ type: QueueActivityDataDto })
  data!: QueueActivityDataDto;
}
