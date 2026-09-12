import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { Readable } from 'stream';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

type ExportData = Record<string, unknown>[];

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  toCsv(data: ExportData, filename = 'export.csv'): { stream: StreamableFile; filename: string } {
    if (!data.length) {
      return { stream: new StreamableFile(Buffer.from('')), filename };
    }

    const headers = Object.keys(data[0]);
    const csvLines = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((h) => {
        const val = row[h];
        if (val == null) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      });
      csvLines.push(values.join(','));
    }

    const buffer = Buffer.from('\uFEFF' + csvLines.join('\r\n'), 'utf-8');
    const stream = new StreamableFile(Readable.from(buffer));
    return { stream, filename };
  }

  async toXlsx(data: ExportData, filename = 'export.xlsx'): Promise<{ stream: StreamableFile; filename: string }> {
    if (!data.length) {
      return { stream: new StreamableFile(Buffer.from('')), filename };
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SIGRADE';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Exportación');

    const headers = Object.keys(data[0]);
    const headerRow = worksheet.addRow(headers);

    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 30;

    for (const row of data) {
      const values = headers.map((h) => row[h] ?? '');
      const excelRow = worksheet.addRow(values);
      excelRow.alignment = { vertical: 'middle' };
      excelRow.height = 22;
    }

    worksheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: Math.max(header.length * 2, 15),
    }));

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const stream = new StreamableFile(Readable.from(Buffer.from(buffer)));
    return { stream, filename };
  }

  async toPdf(data: ExportData, filename = 'export.pdf'): Promise<{ stream: StreamableFile; filename: string }> {
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 50,
      info: {
        Title: filename.replace('.pdf', ''),
        Creator: 'SIGRADE',
        Producer: 'SIGRADE Export Service',
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    const title = filename.replace('.pdf', '').replace(/_/g, ' ');
    doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Generado el ${new Date().toLocaleDateString('es-DO')}`, { align: 'center' });
    doc.moveDown(1.5);

    if (data.length === 0) {
      doc.fontSize(12).text('No hay datos para exportar.', { align: 'center' });
    } else {
      const headers = Object.keys(data[0]);
      const columnWidth = Math.min(500 / headers.length, 120);
      const usableWidth = headers.length * columnWidth;
      const startX = (doc.page.width - 100 - usableWidth) / 2 + 50;

      doc.fontSize(9).font('Helvetica-Bold');
      let y = doc.y;

      for (const [i, header] of headers.entries()) {
        doc.rect(startX + i * columnWidth, y, columnWidth, 20).fill('#2563EB');
        doc.fillColor('#FFFFFF').text(header, startX + i * columnWidth + 4, y + 5, {
          width: columnWidth - 8,
          align: 'center',
        });
      }

      y += 20;
      doc.fillColor('#000000').font('Helvetica').fontSize(8);

      for (const [rowIdx, row] of data.entries()) {
        if (y > doc.page.height - 70) {
          doc.addPage();
          y = 50;
        }

        const bgColor = rowIdx % 2 === 0 ? '#F8FAFC' : '#FFFFFF';

        for (const [i, header] of headers.entries()) {
          doc.rect(startX + i * columnWidth, y, columnWidth, 18).fill(bgColor);
          doc.fillColor('#1E293B').text(
            String(row[header] ?? ''),
            startX + i * columnWidth + 4,
            y + 4,
            { width: columnWidth - 8, align: 'center' },
          );
        }

        y += 18;
      }
    }

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        const buffer = Buffer.concat(buffers);
        const stream = new StreamableFile(Readable.from(buffer));
        resolve({ stream, filename });
      });
    });
  }
}
