import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
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
  private readonly complaintsByReference = new Map<string, ComplaintRecord>();
  private sequence = 0;

  create(payload: CreateComplaintDto): ComplaintRecord {
    const record: ComplaintRecord = {
      id: randomUUID(),
      referenceNo: this.nextReferenceNo(),
      status: 'SUBMITTED',
      channel: payload.channel,
      subject: payload.subject,
      description: payload.description,
      submittedAt: new Date().toISOString(),
      locale: payload.locale,
      consentGiven: payload.consentGiven,
      complainantName: payload.complainantName,
      complainantEmail: payload.complainantEmail,
      complainantPhone: payload.complainantPhone,
    };

    this.complaintsByReference.set(record.referenceNo, record);
    return record;
  }

  getByReference(referenceNo: string): ComplaintRecord {
    const found = this.complaintsByReference.get(referenceNo);
    if (!found) {
      throw new NotFoundException('Complaint not found');
    }

    return found;
  }

  private nextReferenceNo(): string {
    this.sequence += 1;
    const year = new Date().getUTCFullYear();
    const serial = String(this.sequence).padStart(6, '0');
    return `CMS-${year}-${serial}`;
  }
}
