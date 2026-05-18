import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Complaint id to attach this document to.',
    example: 'cmp_1',
  })
  @IsString()
  @MinLength(1)
  complaintId!: string;
}
