import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UploadEvidenceDto {
  @ApiProperty({
    description:
      'Short-lived upload token issued by complaint creation when requestUploadSession=true.',
    minLength: 20,
  })
  @IsString()
  @MinLength(20)
  uploadToken!: string;
}
