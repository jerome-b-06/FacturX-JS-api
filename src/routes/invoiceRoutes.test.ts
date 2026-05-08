import {describe, it, expect, vi, beforeEach} from 'vitest';
import request from 'supertest';
import app from '../app.js';
import {prisma} from '../lib/prisma.js';
import {Prisma} from "../generated/prisma/client.js";

vi.mock('../lib/prisma.js', () => ({
    prisma: {
        invoice: {
            findFirstOrThrow: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        company: {
            findUnique: vi.fn(),
        }
    },
}));

describe('Invoice Routes', () => {
    const companyId = '123e4567-e89b-12d3-a456-426614174000';
    const invoices_url = `/api/v1/companies/${companyId}/invoices`;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /companies/:companyId/invoices', () => {
        it('should return a list of invoices', async () => {
            const mockInvoices = [
                {id: '1', invoiceNumber: 'INV-001', totalTTC: 120},
            ];

            vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices as any);

            const response = await request(app).get(invoices_url);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockInvoices);
            expect(prisma.invoice.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {companyId: companyId},
                })
            );
        });
    });

    describe('GET /companies/:companyId/invoices/:id', () => {
        const invoiceId = '999e4567-e89b-12d3-a456-426614174999'; // Fake invoice ID

        it('should return a single invoice', async () => {
            const mockInvoice = {id: invoiceId, invoiceNumber: 'INV-001', totalTTC: 120};

            vi.mocked(prisma.invoice.findFirstOrThrow).mockResolvedValue(mockInvoice as any);

            const response = await request(app).get(`${invoices_url}/${invoiceId}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockInvoice);
            expect(prisma.invoice.findFirstOrThrow).toHaveBeenCalledWith({
                where: {id: invoiceId, companyId},
                include: {
                    items: true
                }
            });
        });

        it('should return 404 if invoice not found', async () => {
            const prismaError = new Prisma.PrismaClientKnownRequestError(
                'Record not found',
                {
                    code: 'P2025',
                    clientVersion: '7.7.0'
                }
            );

            vi.mocked(prisma.invoice.findFirstOrThrow).mockRejectedValue(prismaError);

            const response = await request(app)
                .get(`${invoices_url}/${invoiceId}`);

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("RESOURCE_NOT_FOUND");
        });
    });


    describe('POST /companies/:companyId/invoices', () => {
        it('should create a new invoice with valid data', async () => {
            const newInvoiceData = {
                invoiceNumber: 'INV-2026-001',
                date: new Date().toISOString(),
                dueDate: new Date().toISOString(),
                items: [
                    {description: 'Dev', quantity: 1, unitPrice: 500, vatRate: 20}
                ]
            };

            vi.mocked(prisma.invoice.create).mockResolvedValue({
                id: '99',
                ...newInvoiceData,
                totalHT: 500,
                totalVAT: 100,
                totalTTC: 600,
            } as any);

            const response = await request(app)
                .post(invoices_url)
                .send(newInvoiceData);

            expect(response.status).toBe(201);
            expect(response.body.invoiceNumber).toBe('INV-2026-001');
            expect(prisma.invoice.create).toHaveBeenCalled();
        });

        it('should return status 400 when invalid (Zod)', async () => {
            const response = await request(app)
                .post(invoices_url)
                .send({date: new Date().toISOString()});

            expect(response.status).toBe(400);
            expect(prisma.invoice.create).not.toHaveBeenCalled();
        });
    });

    describe('PUT /companies/:companyId/invoices/:id', () => {
        const invoiceId = '999e4567-e89b-12d3-a456-426614174999'; // Fake invoice ID

        it('should update an existing invoice with valid data', async () => {
            const updatePayload = {
                dueDate: '2026-06-10',
                items: [
                    {description: 'Something', quantity: 1, unitPrice: 10, vatRate: 20}
                ]
            };

            const updatedInvoice = {
                id: invoiceId,
                companyId: companyId,
                customerId: '999d4567-e89b-12d3-a456-426614174999',
                ...updatePayload,
                totalHT: 10,
                totalVAT: 2,
                totalTTC: 12,
                items: updatePayload.items
            };
            vi.mocked(prisma.invoice.update).mockResolvedValue(updatedInvoice as any);

            const response = await request(app)
                .put(`${invoices_url}/${invoiceId}`)
                .send(updatePayload);

            expect(response.status).toBe(200);
            expect(response.body.dueDate).toBe('2026-06-10');
            expect(prisma.invoice.update).toHaveBeenCalled()
        });

        it('should return status 400 when invalid (zod)', async () => {
            const badUpdateData = {
                invoiceNumber: '',
                items: [
                    {quantity: 5} // ERROR: Description and price are missing
                ]
            };

            const response = await request(app)
                .put(`${invoices_url}/${invoiceId}`)
                .send(badUpdateData);

            expect(response.status).toBe(400);
            expect(prisma.invoice.update).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /companies/:companyId/invoices/:id', () => {
        const invoiceId = '999e4567-e89b-12d3-a456-426614174999';

        it('should delete an invoice', async () => {
            vi.mocked(prisma.invoice.delete).mockResolvedValue({id: invoiceId} as any);

            const response = await request(app)
                .delete(`${invoices_url}/${invoiceId}`);

            expect(response.status).toBe(204);
            expect(prisma.invoice.delete).toHaveBeenCalledWith({
                where: {id: invoiceId, companyId}
            });
        });

        it('should return 404 error if already deleted', async () => {
            const prismaError = new Prisma.PrismaClientKnownRequestError(
                'Record to delete does not exist',
                {
                    code: 'P2025',
                    clientVersion: '7.7.0'
                }
            );

            vi.mocked(prisma.invoice.delete).mockRejectedValue(prismaError);

            const response = await request(app)
                .delete(`${invoices_url}/${invoiceId}`);

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("RESOURCE_NOT_FOUND");
        });
    });

});