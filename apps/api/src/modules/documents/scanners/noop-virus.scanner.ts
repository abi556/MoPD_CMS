import { Injectable } from '@nestjs/common';
import type {
  VirusScanResult,
  VirusScanner,
} from '../interfaces/virus-scanner.interface';

/** EICAR test pattern — used when VIRUS_SCANNER=test-infected */
const EICAR =
  'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

@Injectable()
export class NoOpVirusScanner implements VirusScanner {
  async scan(buffer: Buffer): Promise<VirusScanResult> {
    const text = buffer.toString('utf8');
    if (text.includes('EICAR-STANDARD-ANTIVIRUS-TEST-FILE') || text === EICAR) {
      return { clean: false, signature: 'Eicar-Test-Signature' };
    }
    return { clean: true };
  }
}
