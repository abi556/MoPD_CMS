export interface VirusScanResult {
  clean: boolean;
  signature?: string;
}

export interface VirusScanner {
  scan(buffer: Buffer): Promise<VirusScanResult>;
}
