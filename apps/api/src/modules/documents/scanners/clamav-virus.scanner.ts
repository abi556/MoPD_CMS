import { Injectable, Logger } from '@nestjs/common';
import * as net from 'node:net';
import type {
  VirusScanResult,
  VirusScanner,
} from '../interfaces/virus-scanner.interface';
import { parseClamAvResponse } from './clamav-response';

function getClamAvHost(): string {
  return process.env.CLAMAV_HOST ?? 'localhost';
}

function getClamAvPort(): number {
  return Number.parseInt(process.env.CLAMAV_PORT ?? '3310', 10);
}

@Injectable()
export class ClamAvScanner implements VirusScanner {
  private readonly logger = new Logger(ClamAvScanner.name);

  scan(buffer: Buffer): Promise<VirusScanResult> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const socket = net.createConnection(
        { host: getClamAvHost(), port: getClamAvPort() },
        () => {
          socket.write('zINSTREAM\0');
          const chunkSize = Buffer.alloc(4);
          chunkSize.writeUInt32BE(buffer.length, 0);
          socket.write(chunkSize);
          socket.write(buffer);
          const end = Buffer.alloc(4);
          end.writeUInt32BE(0, 0);
          socket.write(end);
        },
      );

      socket.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      socket.on('error', (err) => {
        this.logger.warn(`ClamAV connection error: ${err.message}`);
        reject(err);
      });
      socket.on('end', () => {
        try {
          resolve(parseClamAvResponse(Buffer.concat(chunks)));
        } catch (err) {
          reject(err);
        }
      });
    });
  }
}
