import { ApiProperty } from '@nestjs/swagger';

export class RecoveredReferenceDto {
  @ApiProperty({ example: 'CMS-2026-ABCD1234WXYZ' })
  referenceNo!: string;

  @ApiProperty({ example: '2026-04-28T18:58:00.000Z' })
  submittedAt!: string;
}

export class RecoveryVerifyDataDto {
  @ApiProperty({ type: [RecoveredReferenceDto] })
  references!: RecoveredReferenceDto[];
}

export class RecoveryVerifyEnvelopeDto {
  @ApiProperty({ type: RecoveryVerifyDataDto })
  data!: RecoveryVerifyDataDto;
}

export class RecoveryRequestAcceptedDto {
  @ApiProperty({
    example:
      'If we have complaints for this contact, you will receive a verification code shortly.',
  })
  message!: string;
}
