# FacturX-JS-api

> **DISCLAIMER**: This is a **Proof of Concept** project. It demonstrates core functionality but is not production-ready. Use at your own risk.

## Overview

**FacturX-JS-api** is a RESTful API for generating and managing electronic invoices in **Factur-X format** (CII - Cross Industry Invoice). This standardized XML format enables seamless invoice exchange between businesses, particularly important in the European market.

### What is Factur-X/CII?

Factur-X is a joint French-German e-invoicing standard that combines:
- **UBL** (Universal Business Language) format for clarity
- **CII** (Cross Industry Invoice) format for compliance
- Support for multiple VAT rates and complex invoice structures

This POC focuses on **CII format generation** following the **Factur-X 1.0 Basic profile**.

## Project Goals

This POC demonstrates:
-  Invoice data management with Prisma ORM
-  Factur-X/CII XML generation from invoice data
-  PDF invoice generation with embedded XML
-  RESTful API for CRUD operations on Companies, Customers, and Invoices
-  Comprehensive error handling and validation
-  Type-safe TypeScript implementation

## Architecture

### Core Components

```
src/
├── app.ts                # Express app configuration
├── index.ts              # Server entry point
├── routes/               # API route handlers
│   ├── companyRoutes.ts
│   ├── customerRoutes.ts
│   └── invoiceRoutes.ts
├── services/             # Business logic
│   ├── companyService.ts
│   ├── customerService.ts
│   ├── invoiceService.ts
│   ├── pdfService.ts     # PDF generation
│   └── xmlService.ts     # Factur-X/CII XML generation
├── schemas/              # Zod validation schemas
├── middleware/           # Express middleware
├── errors/               # Custom error handling
└── lib/                  # Utilities (logger, Prisma client)
```

### Database Schema

- **Company**: Supplier information (SIRET, VAT, address)
- **Customer**: Client information (SIRET, VAT, contact)
- **Invoice**: Invoice records with totals (totalHT, totalVAT, totalTTC)
- **Item**: Invoice line items with pricing and VAT rates

## Getting Started

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd FacturX-JS-api

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database URL

# Setup database
npm run prisma:migrate

# Seed test data (optional)
npm run seed
```

### Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production build
npm run build
npm start

# Run tests
npm test

# Run specific test suite
npm test -- xmlService.test.ts
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Companies
- `GET /api/companies` - List all companies
- `POST /api/companies` - Create new company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Customers
- `GET /api/companies/:companyId/customers` - List customers for a company
- `POST /api/companies/:companyId/customers` - Create new customer
- `PUT /api/companies/:companyId/customers/:customerId` - Update customer
- `DELETE /api/companies/:companyId/customers/:customerId` - Delete customer

### Invoices
- `GET /api/companies/:companyId/invoices` - List invoices for a company
- `GET /api/companies/:companyId/invoices/:invoiceId` - Get invoice details
- `POST /api/companies/:companyId/invoices` - Create new invoice
- `PUT /api/companies/:companyId/invoices/:invoiceId` - Update invoice
- `GET /api/companies/:companyId/invoices/:invoiceId/download` - Export PDF with embedded XML

## 🔧 Technology Stack

### Core Framework
- **Express.js** - HTTP server framework
- **TypeScript** - Type-safe language
- **Node.js** - Runtime

### Database
- **Prisma ORM** - Database abstraction and migrations
- **PostgreSQL** - Primary database

### API & Validation
- **Zod** - TypeScript-first schema validation
- **Express middleware** - Request/response handling

### Document Generation
- **Puppeteer** - Headless browser for PDF generation
- **Handlebars** - HTML template engine
- **he** - HTML entity encoding/decoding

### Testing & Development
- **Vitest** - Fast unit test framework
- **TypeScript Compiler** - Type checking

### Utilities
- **Dotenv** - Environment configuration

## Environment Configuration
Create a `.env` file with:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/facturx

# Environment
NODE_ENV=development
PORT=5000

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Optional: PDF generation settings
PDF_HEADLESS=true
PDF_SCALE=1.2
```

## Testing
The project includes unit tests for core services:

```bash
# Run all tests
npm test
```

Test suites:
- `xmlService.test.ts` - Factur-X XML generation validation
- `pdfService.test.ts` - PDF generation with XML embedding
- Route tests - API endpoint validation

## Features
### Implemented
- Company and Customer CRUD operations
- Invoice management with line items
- Factur-X/CII XML generation (Basic profile)
- PDF invoice generation with embedded XML
- Input validation with Zod schemas
- Centralized error handling
- Structured logging with Winston
- Environment-based configuration
- Database migrations with Prisma


## License
This project is provided as-is for demonstration purposes.

