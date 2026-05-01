import {describe, it, expect, vi, beforeEach} from 'vitest';
import request from 'supertest';
import app from '../app.js';
import {prisma} from '../lib/prisma.js';
import {Prisma} from "../generated/prisma/client.js";

vi.mock('../lib/prisma.js', () => ({
    prisma: {
        company: {
            findUniqueOrThrow: vi.fn()
        },
        customer: {
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        }
    }
}));

describe('Customer Routes', () => {
    const companyId = '123e4567-e89b-12d3-a456-426614174000';
    const customers_url = `/api/v1/companies/${companyId}/customers`;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /customers', () => {
        it('should return a list of a company customers', async () => {
            const mockCustomers = [{id: '1', name: 'Customer Name'}];
            const mockCompany = {id: '1', name: 'Company N°1'};
            vi.mocked(prisma.company.findUniqueOrThrow).mockResolvedValue(mockCompany as any);
            vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as any);

            // fake HTTP request with Supertest
            const response = await request(app).get(customers_url);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockCustomers);
            expect(prisma.customer.findMany).toHaveBeenCalledOnce();
        });

        it('should return error not found if company does not exist', async () => {
            const prismaError = new Prisma.PrismaClientKnownRequestError(
                'Record does not exist',
                {
                    code: 'P2025',
                    clientVersion: '7.7.0'
                }
            );

            vi.mocked(prisma.company.findUniqueOrThrow).mockRejectedValue(prismaError);
            vi.mocked(prisma.customer.findMany).mockResolvedValue([]);
            const response = await request(app).get(customers_url);

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("RESOURCE_NOT_FOUND");
            expect(prisma.customer.findMany).not.toHaveBeenCalled();
        });
    });

    describe('POST /customers', () => {
        it('should create a new customer', async () => {
            const newCustomerData = {
                name: 'New customer',
                address: 'Address 123',
                zipCode: '06000',
                city: 'NICE',
                countryCode: 'FR',
                siret: '123456789',
                vatNumber: 'FR123456789',
                email: 'email@customer.fr'
            };

            const createdCustomer = {id: '2', companyId, ...newCustomerData};
            vi.mocked(prisma.customer.create).mockResolvedValue(createdCustomer as any);

            const response = await request(app)
                .post(customers_url)
                .send(newCustomerData);

            expect(response.status).toBe(201);
            expect(response.body.id).toBe('2');
            expect(response.body.name).toBe('New customer');
            expect(response.body.companyId).toBe(companyId);

            expect(prisma.customer.create).toHaveBeenCalledWith({
                data: {companyId, ...newCustomerData}
            });
        });

        it('should return status 400 when invalid (zod)', async () => {
            const newCustomerData = {
                name: ''
            };
            const response = await request(app)
                .post(customers_url)
                .send(newCustomerData);

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("INVALID_INPUT");
            expect(prisma.customer.create).not.toHaveBeenCalled();
        })
    })

    describe('PUT /customers/:id', () => {
        it('should update an existing customer', async () => {
            const updatePayload = {name: 'Nom Modifié'};

            const updatedCustomer = {id: '123', name: 'Nom Modifié', email: 'test@test.fr'};
            vi.mocked(prisma.customer.update).mockResolvedValue(updatedCustomer as any);

            const response = await request(app)
                .put(`${customers_url}/123`)
                .send(updatePayload);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Nom Modifié');

            expect(prisma.customer.update).toHaveBeenCalledWith({
                where: {id: '123', companyId},
                data: updatePayload
            });
        });

        it('should return status 400 when invalid (zod)', async () => {
            const badUpdateData = {name: '', email: 'bad-email'};

            const response = await request(app)
                .put(`${customers_url}/123`)
                .send(badUpdateData);

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("INVALID_INPUT");
            expect(prisma.customer.update).not.toHaveBeenCalled();
        })
    })

    describe('DELETE /customers/:id', () => {
        it('should delete a customer', async () => {
            vi.mocked(prisma.customer.delete).mockResolvedValue({id: '123', name: 'A Supprimer'} as any);

            const response = await request(app).delete(`${customers_url}/123`);

            expect(response.status).toBe(204);
            expect(response.body).toEqual({});
            expect(prisma.customer.delete).toHaveBeenCalledWith({
                where: {id: '123', companyId}
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

            vi.mocked(prisma.customer.delete).mockRejectedValue(prismaError);

            const response = await request(app)
                .delete(`${customers_url}/123`);

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("RESOURCE_NOT_FOUND");
        });
    })

});