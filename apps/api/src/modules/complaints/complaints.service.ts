import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Complaint as ComplaintEntity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ComplaintChannel,
  ComplaintLocale,
  CreateComplaintDto,
} from './dto/create-complaint.dto';

export interface ComplaintRecord {
  id: string;
  referenceNo: string;
  status: 'SUBMITTED';
  channel: ComplaintChannel;
  subject: string;
  description: string;
  submittedAt: string;
  locale: ComplaintLocale;
  consentGiven: boolean;
  complainantName?: string;
  complainantEmail?: string;
  complainantPhone?: string;
}

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: CreateComplaintDto): Promise<ComplaintRecord> {
    const created = await this.prisma.$transaction(async (tx) => {
      const inserted = await tx.complaint.create({
        data: {
          referenceNo: `TMP-${randomUUID()}`,
          status: 'SUBMITTED',
          channel: payload.channel,
          subject: payload.subject,
          description: payload.description,
          locale: payload.locale,
          consentGiven: payload.consentGiven,
          complainantName: payload.complainantName,
          complainantEmail: payload.complainantEmail,
          complainantPhone: payload.complainantPhone,
        },
      });

      const referenceNo = this.buildReferenceNo(
        inserted.submittedAt,
        inserted.sequenceNo,
      );

      return tx.complaint.update({
        where: { id: inserted.id },
        data: { referenceNo },
      });
    });

    return this.toComplaintRecord(created);
  }

  async getByReference(referenceNo: string): Promise<ComplaintRecord> {
    const found = await this.prisma.complaint.findUnique({
      where: { referenceNo },
    });

    if (!found) {
      throw new NotFoundException('Complaint not found');
    }

    return this.toComplaintRecord(found);
  }

  private buildReferenceNo(submittedAt: Date, sequenceNo: number): string {
    const year = submittedAt.getUTCFullYear();
    const serial = String(sequenceNo).padStart(6, '0');
    return `CMS-${year}-${serial}`;
  }

  private toComplaintRecord(complaint: ComplaintEntity): ComplaintRecord {
    return {
      id: complaint.id,
      referenceNo: complaint.referenceNo,
      status: complaint.status,
      channel: complaint.channel as ComplaintChannel,
      subject: complaint.subject,
      description: complaint.description,
      submittedAt: complaint.submittedAt.toISOString(),
      locale: complaint.locale as ComplaintLocale,
      consentGiven: complaint.consentGiven,
      complainantName: complaint.complainantName ?? undefined,
      complainantEmail: complaint.complainantEmail ?? undefined,
      complainantPhone: complaint.complainantPhone ?? undefined,
    };
  }
}
