import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PdfService } from './pdfService.js';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

// Mocking dependencies
vi.mock('puppeteer', () => ({
    default: {
        launch: vi.fn().mockResolvedValue({
            newPage: vi.fn().mockResolvedValue({
                setContent: vi.fn().mockResolvedValue(undefined),
                pdf: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])), // Mocked PDF bytes
            }),
            close: vi.fn().mockResolvedValue(undefined),
        })
    }
}));

vi.mock('pdf-lib', () => ({
    PDFDocument: {
        load: vi.fn().mockResolvedValue({
            attach: vi.fn().mockResolvedValue(undefined),
            setKeywords: vi.fn(),
            setProducer: vi.fn(),
            save: vi.fn().mockResolvedValue(new Uint8Array([4, 5, 6])), // Mocked Factur-X bytes
        })
    }
}));

describe('PdfService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generateVisualPdf', () => {
        it('should compile HTML and return a PDF buffer', async () => {
            const templateHtml = '<h1>Hello {{name}}</h1>';
            const data = { name: 'World' };

            const pdfBuffer = await PdfService.generateVisualPdf(templateHtml, data);

            expect(puppeteer.launch).toHaveBeenCalledTimes(1);
            expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
            expect(pdfBuffer.length).toBeGreaterThan(0);
        });
    });

    describe('attachFacturX', () => {
        it('should attach XML to PDF and set metadata', async () => {
            const dummyPdfBuffer = Buffer.from([1, 2, 3]);
            const xmlContent = '<xml>fake-factur-x</xml>';

            const facturXBuffer = await PdfService.attachFacturX(dummyPdfBuffer, xmlContent);

            expect(PDFDocument.load).toHaveBeenCalledWith(dummyPdfBuffer);
            expect(Buffer.isBuffer(facturXBuffer)).toBe(true);
        });
    });
});