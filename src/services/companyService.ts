import {prisma} from '../lib/prisma.js';
import type {Request, Response, NextFunction} from "express"
import type {Company} from "../generated/prisma/client.js";
import {AppError, APP_ERROR_CODES} from '../errors/AppError.js';

export const getAllCompanies = async (_req: Request, res: Response, next: NextFunction) => {
    const companies: Company[] = await prisma.company.findMany();
    res.status(200).json(companies);
}

export const createCompany = async (req: Request, res: Response, next: NextFunction) => {
    const newCompany: Company = await prisma.company.create({
        data: req.body
    });
    res.status(201).json(newCompany);
}

export const updateCompany = async (req: Request, res: Response, next: NextFunction) => {
    const {id} = req.params;
    if (typeof id !== 'string') {
       throw new AppError(
            APP_ERROR_CODES.INVALID_INPUT,
            "Invalid ID.",
            400
        );
    }

    const updatedCompany: Company = await prisma.company.update({
        where: {id},
        data: req.body
    });
    res.status(200).json(updatedCompany);
}

export const deleteCompany = async (req: Request, res: Response, next: NextFunction) => {
    const {id} = req.params;
    if (typeof id !== 'string') {
        throw new AppError(
            APP_ERROR_CODES.INVALID_INPUT,
            "Invalid ID.",
            400
        );
    }

    await prisma.company.delete({
        where: {id}
    });
    res.status(204).send();
}
