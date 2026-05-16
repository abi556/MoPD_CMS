import { ApiProperty } from '@nestjs/swagger';
import { CaseNoteVisibilityValue } from './case-note-visibility.enum';
import { CaseTaskStatusValue } from './case-task-status.enum';

export class CaseNoteDto {
  @ApiProperty({ example: 'cmnote_abc123' })
  id!: string;

  @ApiProperty({ example: 'cmojzpoy200006o9mjdpyn6w4' })
  complaintId!: string;

  @ApiProperty({ example: 'user-officer-0001' })
  authorUserId!: string;

  @ApiProperty({ example: 'Called complainant; awaiting documents.' })
  body!: string;

  @ApiProperty({ enum: CaseNoteVisibilityValue, example: 'INTERNAL' })
  visibility!: CaseNoteVisibilityValue;

  @ApiProperty({ example: '2026-05-16T10:30:00.000Z' })
  createdAt!: string;
}

export class CaseNoteListEnvelopeDto {
  @ApiProperty({ type: [CaseNoteDto] })
  data!: CaseNoteDto[];
}

export class CaseNoteEnvelopeDto {
  @ApiProperty({ type: CaseNoteDto })
  data!: CaseNoteDto;
}

export class CaseTaskDto {
  @ApiProperty({ example: 'cmtask_abc123' })
  id!: string;

  @ApiProperty({ example: 'cmojzpoy200006o9mjdpyn6w4' })
  complaintId!: string;

  @ApiProperty({ example: 'user-officer-0001' })
  assigneeUserId!: string;

  @ApiProperty({ example: 'user-officer-0001' })
  createdByUserId!: string;

  @ApiProperty({ example: 'Request land registry extract' })
  title!: string;

  @ApiProperty({ enum: CaseTaskStatusValue, example: 'OPEN' })
  status!: CaseTaskStatusValue;

  @ApiProperty({ example: '2026-05-20T12:00:00.000Z', nullable: true })
  dueAt!: string | null;

  @ApiProperty({ example: '2026-05-16T10:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-05-16T10:35:00.000Z' })
  updatedAt!: string;
}

export class CaseTaskListEnvelopeDto {
  @ApiProperty({ type: [CaseTaskDto] })
  data!: CaseTaskDto[];
}

export class CaseTaskEnvelopeDto {
  @ApiProperty({ type: CaseTaskDto })
  data!: CaseTaskDto;
}
