import {z} from 'zod';

export const createCompanySchema = z.object({
    name: z.string().min(1, "Company name is required"),
    address: z.string().min(1, "Company address is required"),
    zipCode: z.string().min(1, "Company zip code is required"),
    city: z.string().min(1, "Company city is required"),
    countryCode: z.string().min(1, "Company country is required"),
    siret: z.string().min(1, "Company SIRET number is required"),
    vatNumber: z.string().optional(),
    email: z.email(),
    pdfTemplate: z.string().optional()
});
export const updateCompanySchema = createCompanySchema.partial()
