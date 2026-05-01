import {prisma} from '../lib/prisma.js';
import type {Request, Response, NextFunction} from "express"
import type {Customer} from "../generated/prisma/client.js";
import {AppError, APP_ERROR_CODES} from '../errors/AppError.js';

export const getAllCompanyCustomers = async (req: Request, res: Response, _next: NextFunction) => {
    const {companyId} = req.params;
    if (typeof companyId !== 'string') {
        throw new AppError(
            APP_ERROR_CODES.INVALID_INPUT,
            "Invalid ID.",
            400
        );
    }
    await prisma.company.findUniqueOrThrow({
        where: {id: companyId},
    });
    const customers: Customer[] = await prisma.customer.findMany({
        where: {
            companyId: companyId
        }
    });
    res.status(200).json(customers);
}

export const createCustomer = async (req: Request, res: Response, _next: NextFunction) => {
    const {companyId} = req.params;
    if (typeof companyId !== 'string') {
        throw new AppError(
            APP_ERROR_CODES.INVALID_INPUT,
            "Invalid ID.",
            400
        );
    }
    const newCustomer: Customer = await prisma.customer.create({
        data: {...req.body, companyId: companyId}
    });
    res.status(201).json(newCustomer);
}

export const updateCustomer = async (req: Request, res: Response, _next: NextFunction) => {
    const {id, companyId} = req.params;
    if (typeof id !== 'string' || typeof companyId !== 'string') {
        throw new AppError(
            APP_ERROR_CODES.INVALID_INPUT,
            "Invalid ID.",
            400
        );
    }

    const updatedCustomer: Customer = await prisma.customer.update({
        where: {id, companyId},
        data: req.body
    });
    res.status(200).json(updatedCustomer);
}

export const deleteCustomer = async (req: Request, res: Response, _next: NextFunction) => {
    const {id, companyId} = req.params;
    if (typeof id !== 'string' || typeof companyId !== 'string') {
        throw new AppError(
            APP_ERROR_CODES.INVALID_INPUT,
            "Invalid ID.",
            400
        );
    }

    await prisma.customer.delete({
        where: {id, companyId}
    });
    res.status(204).send();
}
