import {describe, it, expect, vi, beforeEach} from 'vitest';
import request from 'supertest';
import app from '../app.js';
import {prisma} from '../lib/prisma.js';
import {Prisma} from "../generated/prisma/client.js";

vi.mock('../lib/prisma.js', () => ({
    prisma: {
        company: {
            findUniqueOrThrow: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        }
    }
}));

describe('Company Routes', () => {
    const companies_url = "/api/v1/companies"

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /companies', () => {
        it('should return a list of companies', async () => {
            const mockCompanies = [{id: '1', name: 'Test Corp'}];
            vi.mocked(prisma.company.findMany).mockResolvedValue(mockCompanies as any);

            // fake HTTP request with Supertest
            const response = await request(app).get(companies_url);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockCompanies);
            expect(prisma.company.findMany).toHaveBeenCalledOnce();
        });
    })

    describe('GET /companies/:id', () => {
        const id = '999e4567-e89b-12d3-a456-426614174999';

        it('should return a single company', async () => {
            const mockCompany = {id, name: 'Test Corp'};

            vi.mocked(prisma.company.findUniqueOrThrow).mockResolvedValue(mockCompany as any);

            const response = await request(app).get(`${companies_url}/${id}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockCompany);
            expect(prisma.company.findUniqueOrThrow).toHaveBeenCalledWith({
                where: {id}
            });
        });

        it('should return 404 if company not found', async () => {
            const prismaError = new Prisma.PrismaClientKnownRequestError(
                'Record not found',
                {
                    code: 'P2025',
                    clientVersion: '7.7.0'
                }
            );

            vi.mocked(prisma.company.findUniqueOrThrow).mockRejectedValue(prismaError);

            const response = await request(app)
                .get(`${companies_url}/${id}`);

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("RESOURCE_NOT_FOUND");
        });
    });

    describe('POST /companies', () => {
        it('should create a new company', async () => {
            const newCompanyData = {
                name: 'Nouvelle Boite',
                address: 'Address 123',
                zipCode: '06000',
                city: 'NICE',
                countryCode: 'FR',
                siret: '123456789',
                vatNumber: 'FR123456789',
                email: 'email@company.fr'
            };
            const createdCompany = {id: '2', ...newCompanyData};

            vi.mocked(prisma.company.create).mockResolvedValue(createdCompany as any);

            const response = await request(app)
                .post(companies_url)
                .send(newCompanyData);

            expect(response.status).toBe(201);
            expect(response.body.id).toBe('2');
            expect(response.body.name).toBe('Nouvelle Boite');

            expect(prisma.company.create).toHaveBeenCalledWith({
                data: newCompanyData
            });
        });

        it('should return status 400 when invalid (zod)', async () => {
            const newCompanyData = {
                name: ''
            };
            const createdCompany = {id: '2', ...newCompanyData};

            vi.mocked(prisma.company.create).mockResolvedValue(createdCompany as any);

            const response = await request(app)
                .post(companies_url)
                .send(newCompanyData);

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("INVALID_INPUT");
            expect(prisma.company.create).not.toHaveBeenCalled();
        })
    })

    describe('PUT /companies/:id', () => {
        it('should update an existing company', async () => {
            const updatePayload = {name: 'Nom Modifié'};

            const updatedCompany = {id: '123', name: 'Nom Modifié', email: 'test@test.fr'};
            vi.mocked(prisma.company.update).mockResolvedValue(updatedCompany as any);

            const response = await request(app)
                .put(`${companies_url}/123`)
                .send(updatePayload);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Nom Modifié');

            expect(prisma.company.update).toHaveBeenCalledWith({
                where: {id: '123'},
                data: updatePayload
            });
        });

        it('should return status 400 when invalid (zod)', async () => {
            const badUpdateData = {name: '', email: 'bad-email'};

            const response = await request(app)
                .put(`${companies_url}/123`)
                .send(badUpdateData);

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("INVALID_INPUT");
            expect(prisma.company.update).not.toHaveBeenCalled();
        })
    })

    describe('DELETE /companies/:id', () => {
        it('should delete a company', async () => {
            vi.mocked(prisma.company.delete).mockResolvedValue({id: '123', name: 'A Supprimer'} as any);

            const response = await request(app).delete(`${companies_url}/123`);

            expect(response.status).toBe(204);
            expect(response.body).toEqual({});
            expect(prisma.company.delete).toHaveBeenCalledWith({
                where: {id: '123'}
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

            vi.mocked(prisma.company.delete).mockRejectedValue(prismaError);

            const response = await request(app)
                .delete(`${companies_url}/123`);

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("RESOURCE_NOT_FOUND");
        });
    })

});