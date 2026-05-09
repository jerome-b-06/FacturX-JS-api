import {prisma} from '../lib/prisma.js';
import type {Request, Response, NextFunction} from "express"
import type {Company, Customer, Invoice, Item} from "../generated/prisma/client.js";
import {extractAndValidateId, extractAndValidateIds} from '../lib/validationHelpers.js';
import {defaultTemplate} from "../templates/defaultInvoice.js";
import {PdfService} from "./pdfService.js";
import {XmlService} from "./xmlService.js";
import Handlebars from 'handlebars';

interface InvoiceTotals {
    totalHT: number;
    totalVAT: number;
    totalTTC: number;
    items: Item[];
}

const calculateInvoiceTotals = (items: Item[]): InvoiceTotals => {
    let totalHT = 0;
    let totalVAT = 0;
    const processedItems = items.map(item => {
        const itemTotalHT = item.quantity * item.unitPrice;
        const itemVAT = itemTotalHT * (item.vatRate / 100);
        totalHT += itemTotalHT;
        totalVAT += itemVAT;
        return {...item, totalHT: itemTotalHT};
    });
    return {totalHT, totalVAT, totalTTC: totalHT + totalVAT, items: processedItems};
};

const generateInvoiceHtml = (
    invoice: Invoice,
    company: Company,
    customer: Customer,
    items: Item[]
): string => {
    const templateData = {
        customer,
        company,
        invoice: {
            ...invoice,
            date: new Date(invoice.date).toLocaleDateString('fr-FR'),
            dueDate: new Date(invoice.dueDate).toLocaleDateString('fr-FR')
        },
        items
    };

    // Use the PDF template from the company if it exists, otherwise use the default one
    const templateToUse = company.pdfTemplate || defaultTemplate;
    const template = Handlebars.compile(templateToUse);
    return template(templateData);
};

export const getCompanyInvoices = async (req: Request, res: Response, _next: NextFunction) => {
    const companyId = extractAndValidateId(req, 'companyId');

    const invoices: Invoice[] = await prisma.invoice.findMany({
        where: {
            companyId: companyId
        },
        include: {
            items: true
        }
    });
    res.json(invoices);
}

export const getCompanyInvoiceById = async (req: Request, res: Response, _next: NextFunction) => {
    const {companyId, id} = extractAndValidateIds(req, 'companyId', 'id');

    const invoice = await prisma.invoice.findFirstOrThrow({
        where: {id, companyId},
        include: {
            items: true
        }
    });
    res.json(invoice);
}

export const createInvoice = async (req: Request, res: Response, _next: NextFunction) => {
    const companyId = extractAndValidateId(req, 'companyId');

    const {date, dueDate, customerId, customer, ...data} = req.body;
    const {totalHT, totalVAT, totalTTC, items} = calculateInvoiceTotals(data.items);

    // Get company data for HTML generation
    const company = await prisma.company.findUniqueOrThrow({
        where: {id: companyId}
    });

    // Get or create customer data
    const customerData = customerId
        ? await prisma.customer.findUniqueOrThrow({
            where: {id: customerId}
        })
        : {...customer, companyId};

    // Prepare invoice data for HTML generation
    const invoiceData = {
        ...data,
        totalHT,
        totalVAT,
        totalTTC,
        date: new Date(date),
        dueDate: new Date(dueDate)
    };

    // Generate HTML content
    const htmlContent = generateInvoiceHtml(invoiceData, company, customerData, items);

    const newInvoice: Invoice = await prisma.invoice.create({
        data: {
            ...data,
            totalHT,
            totalVAT,
            totalTTC,
            htmlContent,
            date: new Date(date),
            dueDate: new Date(dueDate),
            items: {
                create: items
            },
            company: {
                connect: {id: companyId}
            },
            customer: customerId
                ? {connect: {id: customerId}}
                : {create: {...customer, companyId}}
        },
        include: {items: true}
    });
    res.status(201).json(newInvoice);
}

export const updateInvoice = async (req: Request, res: Response, _next: NextFunction) => {
    const {companyId, id} = extractAndValidateIds(req, 'companyId', 'id');

    const {date, dueDate, customerId, customer, ...data} = req.body;
    if (data.date) data.date = new Date(date);
    if (data.dueDate) data.dueDate = new Date(dueDate);
    let processedItems;
    if (data.items) {
        const {totalHT, totalVAT, totalTTC, items} = calculateInvoiceTotals(data.items);
        data.totalHT = totalHT
        data.totalVAT = totalVAT
        data.totalTTC = totalTTC
        processedItems = items;
        data.items = {
            deleteMany: {},
            create: items
        }
    }

    // Get current invoice data for HTML regeneration
    const currentInvoice = await prisma.invoice.findFirstOrThrow({
        where: {id, companyId},
        include: {
            company: true,
            customer: true,
            items: true
        }
    });

    // Prepare updated data for HTML generation
    const updatedInvoiceData = {...currentInvoice, ...data};

    // Get updated customer data if customerId changed
    let customerData = currentInvoice.customer;
    if (customerId && customerId !== currentInvoice.customerId) {
        customerData = await prisma.customer.findUniqueOrThrow({
            where: {id: customerId}
        });
    } else if (customer) {
        customerData = {...customer, companyId};
    }

    // Get updated items
    const itemsToUse = processedItems || currentInvoice.items;

    // Regenerate HTML content
    data.htmlContent = generateInvoiceHtml(updatedInvoiceData, currentInvoice.company, customerData, itemsToUse);

    const newInvoice: Invoice = await prisma.invoice.update({
        where: {id, companyId},
        data: data,
        include: {items: true}
    });
    res.status(200).json(newInvoice);
}

export const deleteInvoice = async (req: Request, res: Response, _next: NextFunction) => {
    const {companyId, id} = extractAndValidateIds(req, 'companyId', 'id');

    await prisma.invoice.delete({
        where: {id, companyId},
    });
    res.status(204).send();
}

export const downloadInvoice = async (req: Request, res: Response, _next: NextFunction) => {

    const {id, companyId} = extractAndValidateIds(req, 'id', 'companyId');

    const invoiceData = await prisma.invoice.findFirstOrThrow({
        where: {
            id,
            companyId
        },
        include: {
            items: true,
            company: true,
            customer: true
        }
    });

    const {customer, company, items, ...invoice} = invoiceData;

    // Visual PDF using stored HTML content
    if (!invoiceData.htmlContent) {
        throw new Error('HTML content not found for this invoice');
    }
    const visualPdfBuffer = await PdfService.generateVisualPdf(invoiceData.htmlContent);

    // XML (CII Std)
    const xmlContent = XmlService.generateCIIXml(customer, company, invoice, items);

    const finalBuffer = await PdfService.attachFacturX(visualPdfBuffer, xmlContent);

    res.setHeader('Content-Type', 'application/pdf');
    // 'inline' displays the PDF in the browser, 'attachment' forces download
    res.setHeader('Content-Disposition', `inline; filename="Facture_${invoice.invoiceNumber}.pdf"`);
    res.send(finalBuffer);

}