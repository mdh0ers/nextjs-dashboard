import { PrismaClient } from "@prisma/client"
import bcrypt from 'bcrypt';

const {
    invoices,
    customers,
    revenue,
    users,
} = require('../app/lib/placeholder-data.js');

const prisma = new PrismaClient();

async function seedUsers(client: PrismaClient) {
    users.forEach(async (user: any)  => {
        let password = await bcrypt.hash(user.password, 10);
        await prisma.user.upsert({
            where: {
                id: user.id
            },
            update: {},
            create: {
                id: user.id,
                name: user.name,
                email: user.email,
                password: user.password
            }
        });
    });
}

async function seedCustomers(client: PrismaClient) {
    customers.forEach(async (customer: any)  => {
        await prisma.customer.upsert({
            where: {
                id: customer.id
            },
            update: {},
            create: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                image_url: customer.image_url
            }
        });
    });
}

async function seedInvoices(client: PrismaClient) {
    invoices.forEach(async (invoice: any)  => {
        await prisma.invoice.create({
            data: {
                amount: invoice.amount,
                status: invoice.status,
                date: new Date(invoice.date).toISOString(),
                customer_id: invoice.customer_id
            }
        });
    });
}

async function seedRevenues(client: PrismaClient) {
    revenue.forEach(async (revenue: any)  => {
        await prisma.revenue.upsert({
            where: {
                month: revenue.month
            },
            update: {},
            create: {
                month: revenue.month,
                revenue: revenue.revenue,
            }
        });
    });
}

async function main() {
    await seedUsers(prisma);
    await seedCustomers(prisma);
    await seedInvoices(prisma);
    await seedRevenues(prisma);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

