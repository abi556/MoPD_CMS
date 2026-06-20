import { ApiProperty } from '@nestjs/swagger';

export class SlaAtRiskCountDto {
  @ApiProperty({
    description:
      'Count of open complaints with SLA warned or breached, scoped to the caller',
    example: 3,
  })
  count!: number;
}
