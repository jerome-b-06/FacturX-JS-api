import {describe, it, expect} from 'vitest';
import {XmlService} from './xmlService.js';
import type {Company, Customer, Invoice, Item} from '../generated/prisma/client.js';

describe('XmlService', () => {
    // Mock data conforming to Prisma types
    const mockCompany: Company = {
        id: 'company-1',
        name: 'Tech Corp',
        address: '123 Tech Street',
        zipCode: '75001',
        city: 'Paris',
        countryCode: 'FR',
        siret: '12345678900012',
        vatNumber: 'FR12345678900012',
        email: 'contact@techcorp.com',
        pdfTemplate: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    };

    const mockCustomer: Customer = {
        id: 'customer-1',
        name: 'Client Corp',
        address: '456 Client Avenue',
        zipCode: '69000',
        city: 'Lyon',
        countryCode: 'FR',
        siret: '98765432100098',
        vatNumber: 'FR98765432100098',
        email: 'billing@clientcorp.com',
        companyId: 'company-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    };

    const mockInvoice: Invoice = {
        id: 'invoice-1',
        invoiceNumber: 'INV-2026-001',
        date: new Date('2026-04-20T10:00:00Z'),
        dueDate: new Date('2026-05-20T10:00:00Z'),
        status: 'DRAFT',
        companyId: 'company-1',
        customerId: 'customer-1',
        totalHT: 1000,
        totalVAT: 200,
        totalTTC: 1200,
        createdAt: new Date('2026-04-20'),
        updatedAt: new Date('2026-04-20'),
    };

    const mockItems: Item[] = [
        {
            id: 'item-1',
            description: 'Web Development',
            quantity: 2,
            unitPrice: 500,
            vatRate: 20,
            totalHT: 1000,
            invoiceId: 'invoice-1',
        }
    ];

    describe('generateCIIXml', () => {
        it('should generate a valid CII XML string with correct values', () => {
            const xmlString = XmlService.generateCIIXml(mockCustomer, mockCompany, mockInvoice, mockItems);

            expect(typeof xmlString).toBe('string');
            expect(xmlString).toContain('<?xml version="1.0" encoding="UTF-8"?>');
            expect(xmlString).toContain('<rsm:CrossIndustryInvoice');
            expect(xmlString).toContain('xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"');

            // Verify mandatory Factur-X/CII tags
            expect(xmlString).toContain('<ram:TypeCode>380</ram:TypeCode>');
            expect(xmlString).toContain('<ram:ID>urn:factur-x.eu:1p0:basic</ram:ID>');

            // Verify injected data
            expect(xmlString).toContain('<ram:ID>INV-2026-001</ram:ID>');
            expect(xmlString).toContain('<ram:Name>Tech Corp</ram:Name>');
            expect(xmlString).toContain('<ram:Name>Client Corp</ram:Name>');
            expect(xmlString).toContain('<ram:Name>Web Development</ram:Name>');
            expect(xmlString).toContain('20260420'); // Verify date formatting (should be YYYYMMDD)
        });

        it('should format dates correctly in YYYYMMDD format', () => {
            const xmlString = XmlService.generateCIIXml(mockCustomer, mockCompany, mockInvoice, mockItems);

            expect(xmlString).toContain('20260420'); // Invoice date
            expect(xmlString).toContain('<udt:DateTimeString format="102">20260420</udt:DateTimeString>');
        });

        it('should include correct monetary values with proper formatting', () => {
            const xmlString = XmlService.generateCIIXml(mockCustomer, mockCompany, mockInvoice, mockItems);

            // Check totals
            expect(xmlString).toContain('<ram:LineTotalAmount>1000.00</ram:LineTotalAmount>');
            expect(xmlString).toContain('<ram:CalculatedAmount>200.00</ram:CalculatedAmount>');
            expect(xmlString).toContain('<ram:LineTotalAmount>1000.00</ram:LineTotalAmount>');
            expect(xmlString).toContain('<ram:TaxTotalAmount currencyID="EUR">200.00</ram:TaxTotalAmount>');
            expect(xmlString).toContain('<ram:GrandTotalAmount>1200.00</ram:GrandTotalAmount>');
            expect(xmlString).toContain('<ram:DuePayableAmount>1200.00</ram:DuePayableAmount>');
        });

        it('should include item details correctly', () => {
            const xmlString = XmlService.generateCIIXml(mockCustomer, mockCompany, mockInvoice, mockItems);

            expect(xmlString).toContain('<ram:LineID>1</ram:LineID>');
            expect(xmlString).toContain('<ram:Name>Web Development</ram:Name>');
            expect(xmlString).toContain('<ram:ChargeAmount>500.00</ram:ChargeAmount>');
            expect(xmlString).toContain('<ram:BilledQuantity unitCode="C62">2</ram:BilledQuantity>');
            expect(xmlString).toContain('<ram:RateApplicablePercent>20</ram:RateApplicablePercent>');
        });

        it('should include company and customer information', () => {
            const xmlString = XmlService.generateCIIXml(mockCustomer, mockCompany, mockInvoice, mockItems);

            // Seller (Company) information
            expect(xmlString).toContain('<ram:Name>Tech Corp</ram:Name>');
            expect(xmlString).toContain('<ram:ID schemeID="0002">12345678900012</ram:ID>');
            expect(xmlString).toContain('<ram:PostcodeCode>75001</ram:PostcodeCode>');
            expect(xmlString).toContain('<ram:LineOne>123 Tech Street</ram:LineOne>');
            expect(xmlString).toContain('<ram:CityName>Paris</ram:CityName>');
            expect(xmlString).toContain('<ram:CountryID>FR</ram:CountryID>');

            // Buyer (Customer) information
            expect(xmlString).toContain('<ram:Name>Client Corp</ram:Name>');
            expect(xmlString).toContain('<ram:ID schemeID="0002">98765432100098</ram:ID>');
            expect(xmlString).toContain('<ram:PostcodeCode>69000</ram:PostcodeCode>');
            expect(xmlString).toContain('<ram:LineOne>456 Client Avenue</ram:LineOne>');
            expect(xmlString).toContain('<ram:CityName>Lyon</ram:CityName>');
        });

        it('should handle multiple items correctly', () => {
            const multipleItems: Item[] = [
                {
                    id: 'item-1',
                    description: 'Web Development',
                    quantity: 2,
                    unitPrice: 500,
                    vatRate: 20,
                    totalHT: 1000,
                    invoiceId: 'invoice-1',
                },
                {
                    id: 'item-2',
                    description: 'Consulting',
                    quantity: 1,
                    unitPrice: 300,
                    vatRate: 20,
                    totalHT: 300,
                    invoiceId: 'invoice-1',
                }
            ];

            const xmlString = XmlService.generateCIIXml(mockCustomer, mockCompany, mockInvoice, multipleItems);

            expect(xmlString).toContain('<ram:LineID>1</ram:LineID>');
            expect(xmlString).toContain('<ram:Name>Web Development</ram:Name>');
            expect(xmlString).toContain('<ram:LineID>2</ram:LineID>');
            expect(xmlString).toContain('<ram:Name>Consulting</ram:Name>');
        });

        it('should escape special characters in text fields', () => {
            const companyWithSpecialChars = {...mockCompany, name: 'Tech & Co <Ltd>'};
            const customerWithSpecialChars = {...mockCustomer, name: 'Client "Corp" & Sons'};
            const itemWithSpecialChars = mockItems.map(item => ({
                ...item,
                description: 'Web & Mobile Development <Full Stack>'
            }))

            const xmlString = XmlService.generateCIIXml(
                customerWithSpecialChars,
                companyWithSpecialChars,
                mockInvoice,
                itemWithSpecialChars
            );

            // Check that special characters are escaped using decimal entities
            expect(xmlString).toContain('<ram:Name>Tech &#x26; Co &#x3C;Ltd&#x3E;</ram:Name>');
            expect(xmlString).toContain('<ram:Name>Client &#x22;Corp&#x22; &#x26; Sons</ram:Name>');
            expect(xmlString).toContain('<ram:Name>Web &#x26; Mobile Development &#x3C;Full Stack&#x3E;</ram:Name>');

            // Ensure unescaped versions are not present
            expect(xmlString).not.toContain('Tech & Co <Ltd>');
            expect(xmlString).not.toContain('Client "Corp" & Sons');
            expect(xmlString).not.toContain('Web & Mobile Development <Full Stack>');
        });

        it('should handle null/undefined optional fields gracefully', () => {
            const companyWithoutVat = {...mockCompany, vatNumber: null};
            const customerWithoutSiret = {...mockCustomer, siret: null, vatNumber: null};

            const xmlString = XmlService.generateCIIXml(
                customerWithoutSiret,
                companyWithoutVat,
                mockInvoice,
                mockItems
            );

            expect(xmlString).toContain('<ram:ID schemeID="VA">FR</ram:ID>'); // Empty VAT for company (simplified VAT logic)
            expect(xmlString).toContain('<ram:ID schemeID="0002"></ram:ID>'); // Empty SIRET for customer
            expect(xmlString).toContain('<ram:ID schemeID="VA">FR</ram:ID>'); // Empty VAT for customer (simplified VAT logic)
        });

        it('should generate valid XML structure', () => {
            const xmlString = XmlService.generateCIIXml(mockCustomer, mockCompany, mockInvoice, mockItems);

            // Check XML structure
            expect(xmlString).toContain('<rsm:ExchangedDocumentContext>');
            expect(xmlString).toContain('<rsm:ExchangedDocument>');
            expect(xmlString).toContain('<rsm:SupplyChainTradeTransaction>');
            expect(xmlString).toContain('<ram:ApplicableHeaderTradeAgreement>');
            expect(xmlString).toContain('<ram:ApplicableHeaderTradeSettlement>');
            expect(xmlString).toContain('</rsm:CrossIndustryInvoice>');
        });

        it('should include correct VAT rate in header trade settlement', () => {
            const xmlString = XmlService.generateCIIXml(mockCustomer, mockCompany, mockInvoice, mockItems);

            expect(xmlString).toContain('<ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>');
            expect(xmlString).toContain('<ram:BasisAmount>1000.00</ram:BasisAmount>');
        });
    });
});