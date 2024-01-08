import { Prisma, PrismaClient } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { formatCurrency } from "../utils";

const prisma = new PrismaClient();

async function sumInvoiceAmount(status: "paid" | "pending") {
    noStore();
    let sum = await prisma.invoice.aggregate({
        _sum: {
            amount: true
        },
        where: {
            status: status
        }
    });
    if (sum._sum.amount === null) {
        return "";
    }
    return formatCurrency(sum._sum.amount);
}

export async function fetchCardData() {
    noStore();
    try {
        const numberOfInvoicesPromise = prisma.invoice.count();
        const numberOfCustomersPromise = prisma.customer.count();
        const totalPaidInvoicesPromise = (sumInvoiceAmount("paid"));
        const totalPendingInvoicesPromise = (sumInvoiceAmount("pending"));

        const data = await Promise.all([
            numberOfCustomersPromise,
            numberOfInvoicesPromise,
            totalPaidInvoicesPromise,
            totalPendingInvoicesPromise,
        ]);
        
        return {
            numberOfCustomers: data[0],
            numberOfInvoices: data[1],
            totalPaidInvoices: data[2],
            totalPendingInvoices: data[3]
        };
    }
    catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch card data.");
    }
}
