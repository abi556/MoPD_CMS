export interface EmailSendInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
}

export interface EmailSendResult {
  messageId?: string;
}

export interface EmailProvider {
  send(input: EmailSendInput): Promise<EmailSendResult>;
}
