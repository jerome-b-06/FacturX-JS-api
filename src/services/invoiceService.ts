import {prisma} from '../lib/prisma.js';
import type {Request, Response, NextFunction} from "express"
import type {Invoice, Item} from "../generated/prisma/client.js";
import {AppError, APP_ERROR_CODES} from '../errors/AppError.js';

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
                : {create: customer}
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
            "L'identifiant est invalide.",
            400
        );
    }

    await prisma.invoice.delete({
        where: {id, companyId},
    });
    res.status(204).send();
}
