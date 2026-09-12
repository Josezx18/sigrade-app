import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from '../../src/modules/export/export.service';
import { Readable } from 'stream';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportService],
    }).compile();
    service = module.get<ExportService>(ExportService);
  });

  describe('toCsv', () => {
    it('returns empty buffer for empty data', () => {
      const result = service.toCsv([]);
      expect(result.filename).toBe('export.csv');
    });

    it('generates CSV with headers and data', async () => {
      const data = [{ name: 'Juan', score: 95 }, { name: 'Ana', score: 88 }];
      const result = service.toCsv(data);
      const chunks: Buffer[] = [];
      for await (const chunk of result.stream.getStream() as Readable) {
        chunks.push(Buffer.from(chunk));
      }
      const content = Buffer.concat(chunks).toString('utf-8');
      expect(content).toContain('name,score');
      expect(content).toContain('Juan,95');
      expect(content).toContain('Ana,88');
    });

    it('escapes commas and quotes', async () => {
      const data = [{ name: 'Doe, John', note: 'He said "hello"' }];
      const result = service.toCsv(data);
      const chunks: Buffer[] = [];
      for await (const chunk of result.stream.getStream() as Readable) {
        chunks.push(Buffer.from(chunk));
      }
      const content = Buffer.concat(chunks).toString('utf-8');
      expect(content).toContain('"Doe, John"');
      expect(content).toContain('"He said ""hello"""');
    });

    it('includes BOM for Excel compatibility', async () => {
      const data = [{ a: 1 }];
      const result = service.toCsv(data);
      const chunks: Buffer[] = [];
      for await (const chunk of result.stream.getStream() as Readable) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      expect(buffer[0]).toBe(0xEF);
      expect(buffer[1]).toBe(0xBB);
      expect(buffer[2]).toBe(0xBF);
    });
  });

  describe('toXlsx', () => {
    it('returns placeholder buffer with warning', async () => {
      const result = await service.toXlsx([{ a: 1 }]);
      expect(result.filename).toBe('export.xlsx');
    });
  });

  describe('toPdf', () => {
    it('returns placeholder buffer with warning', async () => {
      const result = await service.toPdf([{ a: 1 }]);
      expect(result.filename).toBe('export.pdf');
    });
  });
});
