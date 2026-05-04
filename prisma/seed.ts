import "dotenv/config";
import {Pool} from "pg";
import {PrismaPg} from "@prisma/adapter-pg";
import {PrismaClient} from "../src/generated/prisma/client.js";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({connectionString});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({adapter});

async function main() {
    const company1 = await prisma.company.upsert({
        where: {siret: "1234567890123"},
        update: {},
        create: {
            name: "Company 1",
            address: "10 rue de la paix",
            zipCode: "75000",
            city: "Paris",
            countryCode: "FR",
            siret: "1234567890123",
            vatNumber: "FR1234567890123",
            email: "commpany1@email.com",
        },
    });
    const customer1 = await prisma.customer.upsert({
        where: {email: "customer1@email.com"},
        update: {},
        create: {
            name: "Customer 1",
            address: "Rue de paris",
            zipCode: "06000",
            city: "Nice",
            countryCode: "FR",
            email: "customer1@email.com",
            company: {
                connect: {
                    id: company1.id
                }
            }
        }
    });

    await prisma.invoice.upsert({
        where: {invoiceNumber: "INV-0001"},
        update: {},
        create: {
            invoiceNumber: "INV-0001",
            date: new Date(),
            dueDate: new Date(),
            company: {
                connect: {
                    id: company1.id
                }
            },
            customer: {
                connect: {
                    id: customer1.id
                }
            },
            items: {
                create: [{
                    description: "Item 1",
                    quantity: 5,
                    unitPrice: 10,
                    vatRate: 20,
                    totalHT: 50
                }, {
                    description: "Item 2",
                    quantity: 1,
                    unitPrice: 15,
                    vatRate: 20,
                    totalHT: 15
                }, {
                    description: "Item 3",
                    quantity: 2,
                    unitPrice: 100,
                    vatRate: 20,
                    totalHT: 200
                }]
            },
            totalHT: 265,
            totalVAT: 53,
            totalTTC: 318
        }
    });
}

main()
    .then(async () => {
        await prisma.$disconnect();
        await pool.end();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        await pool.end();
        process.exit(1);
    });