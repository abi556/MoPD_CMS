import { ApiProperty } from '@nestjs/swagger';

export class ComplaintFormOptionItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  @ApiProperty({ nullable: true, type: String }) nameAm!: string | null;
}

export class ComplaintFormOptionsDataDto {
  @ApiProperty({ type: [ComplaintFormOptionItemDto] })
  categories!: ComplaintFormOptionItemDto[];

  @ApiProperty({ type: [ComplaintFormOptionItemDto] })
  orgUnits!: ComplaintFormOptionItemDto[];
}

export class ComplaintFormOptionsEnvelopeDto {
  @ApiProperty({ type: ComplaintFormOptionsDataDto })
  data!: ComplaintFormOptionsDataDto;
}
