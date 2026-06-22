import { Injectable } from '@nestjs/common';

export interface KnowledgeChunkDraft {
  chunkIndex: number;
  content: string;
  tokenCount: number;
}

const TARGET_TOKENS = 400;
const OVERLAP_TOKENS = 50;

@Injectable()
export class KnowledgeChunkerService {
  chunkMarkdown(bodyMarkdown: string): KnowledgeChunkDraft[] {
    const paragraphs = bodyMarkdown
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (paragraphs.length === 0) {
      return [];
    }

    const chunks: KnowledgeChunkDraft[] = [];
    let buffer = '';
    let bufferTokens = 0;
    let chunkIndex = 0;

    const flush = () => {
      const trimmed = buffer.trim();
      if (!trimmed) return;
      chunks.push({
        chunkIndex,
        content: trimmed,
        tokenCount: this.estimateTokens(trimmed),
      });
      chunkIndex += 1;
      const overlapText = this.takeLastTokens(trimmed, OVERLAP_TOKENS);
      buffer = overlapText;
      bufferTokens = this.estimateTokens(overlapText);
    };

    for (const paragraph of paragraphs) {
      const paragraphTokens = this.estimateTokens(paragraph);
      if (bufferTokens + paragraphTokens > TARGET_TOKENS && bufferTokens > 0) {
        flush();
      }
      buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
      bufferTokens = this.estimateTokens(buffer);
      if (bufferTokens >= TARGET_TOKENS) {
        flush();
      }
    }

    if (buffer.trim()) {
      chunks.push({
        chunkIndex,
        content: buffer.trim(),
        tokenCount: this.estimateTokens(buffer.trim()),
      });
    }

    return chunks;
  }

  estimateTokens(text: string): number {
    return Math.max(
      1,
      Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3),
    );
  }

  private takeLastTokens(text: string, tokenCount: number): string {
    const words = text.split(/\s+/).filter(Boolean);
    const take = Math.max(1, Math.ceil(tokenCount / 1.3));
    return words.slice(-take).join(' ');
  }
}
