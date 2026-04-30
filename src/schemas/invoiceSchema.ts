import {z} from 'zod';

export const createInvoiceSchema = z.object({
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    date: z.string().datetime().or(z.string()), // Accepte ISO ou string date
    dueDate: z.string().datetime().or(z.string()),
    items: z.array(
        z.object({
            description: z.string().min(1),
            quantity: z.number().positive(),
            unitPrice: z.number().nonnegative(),
            vatRate: z.number().default(20),
        })
    ).min(1, "Invoice must have at least one item"),
});

export const updateInvoiceSchema = createInvoiceSchema
    .omit({
        invoiceNumber: true // No possible update of the invoice number
    })
    .partial()  // partial adds .optional() to all ohter fields
    .extend({   // items array is also optional but if a line is given, this line must be complete
        items: z.array(
            z.object({
                description: z.string().min(1),
                quantity: z.number().positive(),
                unitPrice: z.number().nonnegative(),
                vatRate: z.number().default(20),
            })
        ).optional()
    });
