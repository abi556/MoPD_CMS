import { KnowledgeChunkerService } from './knowledge-chunker.service';

describe('KnowledgeChunkerService', () => {
  const service = new KnowledgeChunkerService();

  it('returns empty array for blank markdown', () => {
    expect(service.chunkMarkdown('   ')).toEqual([]);
  });

  it('keeps short content in a single chunk', () => {
    const chunks = service.chunkMarkdown('## Hello\n\nShort answer.');
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.chunkIndex).toBe(0);
    expect(chunks[0]?.content).toContain('Short answer');
  });

  it('splits long content into multiple chunks with overlap', () => {
    const paragraph = 'word '.repeat(500).trim();
    const body = `${paragraph}\n\n${paragraph}`;
    const chunks = service.chunkMarkdown(body);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.tokenCount).toBeGreaterThan(0);
    }
  });
});
