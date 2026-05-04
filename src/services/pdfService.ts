import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { PDFDocument } from 'pdf-lib';
import { pdfConfig } from '../lib/pdfConfig.js';

export const PdfService = {
    generateVisualPdf: async (templateHtml: string, data: any): Promise<Buffer> => {
        // Handlebars replaces {{variable}} with actual data
        const template = Handlebars.compile(templateHtml);
        const htmlContent = template(data);

        const browser = await puppeteer.launch({
            headless: pdfConfig.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // networkidle0 ensures that fonts or images are properly loaded
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfUint8Array = await page.pdf({
            format: pdfConfig.format,
            printBackground: pdfConfig.printBackground, // Crucial to keep your CSS colors and backgrounds
            scale: pdfConfig.scale,
            margin: {
                top: pdfConfig.marginTop,
                right: pdfConfig.marginRight,
                bottom: pdfConfig.marginBottom,
                left: pdfConfig.marginLeft
            }
        });

        await browser.close();
        return Buffer.from(pdfUint8Array);
    },

    attachFacturX: async (pdfBuffer: Buffer, xmlContent: string): Promise<Buffer> => {
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        // Factur-X requires the file to be named exactly "factur-x.xml"
        await pdfDoc.attach(Buffer.from(xmlContent).toString('base64'), 'factur-x.xml', {
            mimeType: 'application/xml',
            description: 'Factur-X Invoice',
            creationDate: new Date(),
            modificationDate: new Date(),
        });

        // XMP metadata (Mandatory for compliance)
        const xmpMetadata = `
            <?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
            <x:xmpmeta xmlns:x="adobe:ns:meta/">
                <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
                    <rdf:Description rdf:about="" xmlns:fx="urn:factur-x:pdfa:CrossIndustryInvoice:zf:1.0#">
                        <fx:DocumentType>INVOICE</fx:DocumentType>
                        <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
                        <fx:Version>1.0</fx:Version>
                        <fx:ConformanceLevel>BASIC</fx:ConformanceLevel>
                    </rdf:Description>
                </rdf:RDF>
            </x:xmpmeta>
            <?xpacket end="w"?>`;

        pdfDoc.setKeywords(['Factur-X', 'Invoice']);
        pdfDoc.setProducer('Factur-Xray Engine');

        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    }
};