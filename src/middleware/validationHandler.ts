import {z} from "zod";
import type {Request, Response, NextFunction} from "express";

export function validationHandler(schema: z.ZodObject<any, any>) {
    return (req: Request, res: Response, next: NextFunction) => {
            schema.parse(req.body);
            next();
    };
}