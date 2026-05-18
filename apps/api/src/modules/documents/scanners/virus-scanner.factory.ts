import { Injectable } from '@nestjs/common';
import type { VirusScanner } from '../interfaces/virus-scanner.interface';
import { ClamAvScanner } from './clamav-virus.scanner';
import { NoOpVirusScanner } from './noop-virus.scanner';

export type VirusScannerKind = 'noop' | 'clamav';

@Injectable()
export class VirusScannerFactory {
  constructor(
    private readonly noopScanner: NoOpVirusScanner,
    private readonly clamAvScanner: ClamAvScanner,
  ) {}

  getScanner(): VirusScanner {
    const kind = this.resolveKind();
    switch (kind) {
      case 'clamav':
        return this.clamAvScanner;
      case 'noop':
      default:
        return this.noopScanner;
    }
  }

  private resolveKind(): VirusScannerKind {
    const explicit = process.env.VIRUS_SCANNER?.toLowerCase();
    if (explicit === 'clamav' || explicit === 'noop') {
      return explicit;
    }
    if (
      process.env.NODE_ENV === 'test' ||
      Boolean(process.env.JEST_WORKER_ID)
    ) {
      return 'noop';
    }
    return 'clamav';
  }
}
