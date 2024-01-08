import { Prisma, PrismaClient } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { formatCurrency } from "../utils";

const prisma = new PrismaClient();

type InvoiceFilter = {
    date?: string,
    status?: "paid" | "pending", 
    amount?: number,
    customer?: {
        name?: string,
        email?: string,
    },
};

export async function fetchLatestInvoices(count: number = 5) {
    noStore();

    if (count <= 0) {
        throw new Error("Fetched last invoice count can't be under 1.");
    }

    try {
        const invoices = await prisma.invoice.findMany({
            select: {
                id: true,
                amount: true,
                date: true,
                status: true,
                customer: {
                    select: {
                        name: true,
                        email: true,
                        image_url: true,
                    }
                },
            },
            orderBy: {
                date: "desc"
            },
            take: count,
        });
        return invoices.map((invoice) => ({
            ...invoice,
            amount: formatCurrency(invoice.amount)
        }));
    }
    catch (error) {
        console.error("Database error: ", error);
        throw new Error("Failed to fetch invoice data");
    }
}

export async function fetchFilteredInvoices(filter: InvoiceFilter, take?: number, skip?: number) {
    noStore();
    try {
        const invoices = await prisma.invoice.findMany({
            select: {
                id: true,
                amount: true,
                date: true,
                status: true,
                customer: {
                    select: {
                        name: true,
                        email: true,
                        image_url: true,
                    }
                }
            },
            where: {
                AND: [
                    {
                        date: filter.date,
                    },
                    {
                        amount: filter.amount,
                    },
                    {
                        status: filter.status,
                    },
                    {
                        customer: {
                            name: {
                                contains: filter.customer?.name,
                            },
                        },
                    },
                    {
                        customer: {
                            email: {
                                contains: filter.customer?.email,
                            },
                        },
                    },
                ],
            },
            take: take,
            skip: skip,
        });
        return invoices;
    }
    catch (error) {

    }
}

export async function fetchInvoiceById(id: string) {
    noStore();
    try {
        let data = await prisma.invoice.findUnique({
            select: {
                id: true,
                customer_id: true,
                amount: true,
                status: true,
            },
            where: {
                id: id
            }
        });
        if (data == undefined) {
            throw new Error(`Invoice id ${id} does not exists`);
        }
        return {
            ... data,
            amount: data.amount / 100,
        };
    }
    catch (error) {
        console.error("Database Error:", error);
        throw new Error('Failed to fetch invoices');
    }
}
