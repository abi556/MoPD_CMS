import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentScanStatus } from '@prisma/client';

export class DocumentDto {
  @ApiProperty({ example: 'doc_abc123' })
  id!: string;

  @ApiProperty({ example: 'cmojzpoy200006o9mjdpyn6w4' })
  complaintId!: string;

  @ApiProperty({ example: 'user-officer-0001' })
  ownerUserId!: string;

  @ApiProperty({ example: 'evidence.pdf' })
  originalName!: string;

  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @ApiProperty({ example: 102400 })
  sizeBytes!: number;

  @ApiProperty({ enum: DocumentScanStatus, example: 'CLEAN' })
  scanStatus!: DocumentScanStatus;

  @ApiProperty({ example: 'complaints/cm.../doc...' })
  storageKey!: string;

  @ApiPropertyOptional({ example: '2026-05-17T12:00:00.000Z' })
  scannedAt?: string | null;

  @ApiProperty({ example: '2026-05-17T11:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-05-17T11:05:00.000Z' })
  updatedAt!: string;
}

export class DocumentListEnvelopeDto {
  @ApiProperty({ type: [DocumentDto] })
  data!: DocumentDto[];
}

export class DocumentEnvelopeDto {
  @ApiProperty({ type: DocumentDto })
  data!: DocumentDto;
}

export class DocumentDownloadDto {
  @ApiProperty({
    example:
      'http://localhost:9000/mopd-live/complaints/...?X-Amz-Signature=...',
  })
  url!: string;

  @ApiProperty({ example: '2026-05-17T12:15:00.000Z' })
  expiresAt!: string;
}

export class DocumentDownloadEnvelopeDto {
  @ApiProperty({ type: DocumentDownloadDto })
  data!: DocumentDownloadDto;
}
