import {prisma} from '../lib/prisma.js';
import type {Request, Response, NextFunction} from "express"
import type {Invoice, Item} from "../generated/prisma/client.js";
import {AppError, APP_ERROR_CODES} from '../errors/AppError.js';
import {defaultTemplate} from "../templates/defaultInvoice.js";
import {PdfService} from "./pdfService.js";
import {XmlService} from "./xmlService.js";

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

export const getCompanyInvoices = async (req: Request, res: Response, _next: NextFunction) => {
    const {companyId} = req.params;
    if (typeof companyId !== 'string') {
        throw new AppError(
            APP_ERROR_CODES.INVALID_INPUT,
            "Invalid ID.",
            400
        );
    }

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
    const {companyId, id} = req.params;
    if (typeof companyId !== 'string' || typeof id !== 'string') {
        throw new AppError(
            APP_ERROR_CODES.INVALID_INPUT,
            "Invalid ID.",
            400
        );
    }

    const invoice = await prisma.invoice.findFirstOrThrow({
        where: {id, companyId},
        include: {
            items: true
        }
    });
    res.json(invoice);
}

export const createInvoice = async (req: Request, res: Response, _next: NextFunction) => {
    const {companyId} = req.params;

    if (typeof companyId !== 'string') {
        throw new AppError(
            APP_ERROR_CODES.INVALID_INPUT,
            "Invalid ID",
            400
        );
    }

    const {date, dueDate, customerId, customer, ...data} = req.body;
    const {totalHT, totalVAT, totalTTC, items} = calculateInvoiceTotals(data.items);
    const newInvoice: Invoice = await prisma.invoice.create({
        data: {
            ...data,
            totalHT,
            totalVAT,
            totalTTC,
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

export const updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    const {companyId, id} = req.params;

    if (typeof id !== 'string' || typeof companyId !== 'string') {
        throw new AppError(
            APP_ERROR_CODES.INVALID_INPUT,
            "Invalid ID",
            400
        );
    }

    const {date, dueDate, customerId, customer, ...data} = req.body;
    if (data.date) data.date = new Date(date);
    if (data.dueDate) data.dueDate = new Date(dueDate);
    if (data.items) {
        const {totalHT, totalVAT, totalTTC, items} = calculateInvoiceTotals(data.items);
        data.totalHT = totalHT
        data.totalVAT = totalVAT
        data.totalTTC = totalTTC
        data.items = {
            deleteMany: {},
            create: items
        }
    }

    const newInvoice: Invoice = await prisma.invoice.update({
        where: {id, companyId},
        data: data,
        include: {items: true}
    });
    res.status(200).json(newInvoice);
}

export const deleteInvoice = async (req: Request, res: Response, _next: NextFunction) => {
    const {companyId, id} = req.params;
    if (typeof id !== 'string' || typeof companyId !== 'string') {
        throw new AppError(
            APP_ERROR_CODES.INVALID_INPUT,
            "Invalid ID.",
            400
        );
    }

    await prisma.invoice.delete({
        where: {id, companyId},
    });
    res.status(204).send();
}

export const downloadInvoice = async (req: Request, res: Response, _next: NextFunction) => {

    const {id, companyId} = req.params;
    if (typeof id !== 'string' || typeof companyId !== 'string') {
        throw new AppError(
            APP_ERROR_CODES.INVALID_INPUT,
            "Invalid ID.",
            400
        );
    }

    const {customer, company, items, ...invoice} = await prisma.invoice.findFirstOrThrow({
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

    // le PDF (On utilise le template de la DB s'il existe, sinon le défaut)
    const templateToUse = company.pdfTemplate || defaultTemplate;

    // PDF Visuel
    const visualPdfBuffer = await PdfService.generateVisualPdf(templateToUse, templateData);

    // XML (CII Std)
    const xmlContent = XmlService.generateCIIXml(customer, company, invoice, items);

    const finalBuffer = await PdfService.attachFacturX(visualPdfBuffer, xmlContent);

    res.setHeader('Content-Type', 'application/pdf');
    // 'inline' affiche le PDF dans le navigateur, 'attachment' force le téléchargement
    res.setHeader('Content-Disposition', `inline; filename="Facture_${invoice.invoiceNumber}.pdf"`);
    res.send(finalBuffer);

}