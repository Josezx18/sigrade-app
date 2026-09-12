/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/no-explicit-any */
declare module 'pdfkit' {
  interface PDFDocumentOptions {
    size?: string | [number, number];
    margin?: number;
    info?: Record<string, string>;
  }

  interface PDFDocument {
    fontSize(size: number): this;
    font(font: string): this;
    text(text: string, options?: { align?: string; width?: number; link?: string }): this;
    text(text: string, x?: number, y?: number, options?: { align?: string; width?: number }): this;
    moveDown(lines?: number): this;
    rect(x: number, y: number, width: number, height: number): this;
    fill(color: string): this;
    fillColor(color: string): this;
    x: number;
    y: number;
    page: { width: number; height: number };
    addPage(): this;
    end(): void;
    on(event: string, callback: (...args: any[]) => void): this;
  }

  export default class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    fontSize(size: number): this;
    font(font: string): this;
    text(text: string, options?: { align?: string; width?: number }): this;
    text(text: string, x?: number, y?: number, options?: { align?: string; width?: number }): this;
    moveDown(lines?: number): this;
    rect(x: number, y: number, width: number, height: number): this;
    fill(color: string): this;
    fillColor(color: string): this;
    x: number;
    y: number;
    page: { width: number; height: number };
    addPage(): this;
    end(): void;
    on(event: string, callback: (...args: any[]) => void): this;
  }
}
