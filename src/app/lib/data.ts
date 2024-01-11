import { Prisma, PrismaClient } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { formatCurrency } from './utils';

export async function fetchRevenue() {
    const prisma = new PrismaClient();
    noStore();
    try {
        const data = await prisma.revenue.findMany();
        return data;
    }
    catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch revenue data.");
    }
}

export async function fetchLatestInvoices(prisma: PrismaClient) {
    noStore();
    try {
        const data = await prisma.invoice.findMany({
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
            orderBy: {
                date: "desc"
            },
            take: 5
        })
        const latestInvoices = data.map((invoice) => ({
            ...invoice,
            amount: formatCurrency(invoice.amount),
        }));
        return latestInvoices;
    }
    catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch revenue data.");
    }
}

async function sumInvoiceAmount(prisma: PrismaClient, status: "paid" | "pending") {
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

export async function fetchCardData(prisma: PrismaClient) {
    noStore();
    try {
        const numberOfInvoicesPromise = prisma.invoice.count();
        const numberOfCustomersPromise = prisma.customer.count();
        const totalPaidInvoicesPromise = (sumInvoiceAmount(prisma, "paid"));
        const totalPendingInvoicesPromise = (sumInvoiceAmount(prisma, "pending"));

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

const ITEMS_PER_PAGE = 6;
type InvoiceQuery = {
    date?: string,
    status?: "paid" | "pending", 
    customerNameLike?: string,
    customerEmailLike?: string,
    amount?: number
};

function invoiceQueryToWhere(query: InvoiceQuery) {
    const filters = {
        date: {
            date: {
                equals: query.date
            }
        },
        status: {
            status: {
                equals: query.status
            }
        },
        amount: {
            amount: {
                equals: query.amount
            }
        },
        customerNameLike: {
            customer: {
                name: {
                    contains: query.customerNameLike,
                    mode: "insensitive"
                }
            }
        },
        customerEmailLike: {
            customer: {
                email: {
                    contains: query.customerEmailLike,
                    mode: "insensitive"
                }
            }
        }
    }

    let whereClause: any = {
        OR: []
    };
    Object.entries(filters).forEach(([key, value], index) => {
        const queryKey = key as keyof InvoiceQuery;
        if (query[queryKey] != undefined) {
            whereClause.OR.push(value);
        }
    });
    console.log(whereClause.OR);
    if (whereClause.OR.length == 0) {
        return {};
    }
    return whereClause;
}

export async function fetchFilteredInvoices(prisma: PrismaClient, query: InvoiceQuery, pagination?: { skip: number, take: number }) {
    noStore();
    let take: number | undefined = undefined;
    let skip: number | undefined = undefined;
    if (pagination != undefined) {
        skip = pagination.skip;
        take = pagination.take;
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
                }
            },
            where: invoiceQueryToWhere(query),
            take: take,
            skip: skip,
        });
        return invoices;
    }
    catch (error) {
        console.error("Database Error:", error);
        throw new Error('Failed to fetch invoices');
    }
}

export async function fetchInvoiceById(prisma: PrismaClient, id: string) {
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

export async function fetchCustomers(prisma: PrismaClient) {
    noStore();
    try {
        const data = await prisma.customer.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: "asc"
            }
        });
        return data;
    }
    catch (error) {
        console.error("Database Error:", error);
        throw new Error('Failed to fetch all customers');
    }
}

type CustomerQuery = {
    nameLike?: string,
    emailLike?: string,
};

export async function fetchFilteredCustomers(prisma: PrismaClient, query: CustomerQuery) {
    noStore();
    try {
        let nameLike = query.nameLike || "";
        let emailLike = query.emailLike || "";


        // Had to reuse the original SQL query because 
        //  Prisma does not allow Group By + Aggregate
        let sql = Prisma.sql`
        SELECT
            "Customer".id,
            "Customer".name,
            "Customer".email,
            "Customer".image_url,
            COUNT("Invoice".id) AS total_invoices,
            SUM(CASE WHEN "Invoice".status = 'pending' THEN "Invoice".amount ELSE 0 END) AS total_pending,
            SUM(CASE WHEN "Invoice".status = 'paid' THEN "Invoice".amount ELSE 0 END) AS total_paid
        FROM "Customer"
            LEFT JOIN "Invoice" ON "Customer".id = "Invoice".customer_id
        WHERE
            "Customer".name ILIKE ${`%${query.nameLike}%`} OR
            "Customer".email ILIKE ${`%${query.emailLike}%`}
        GROUP BY "Customer".id, "Customer".name, "Customer".email, "Customer".image_url
        ORDER BY "Customer".name ASC;`;
        const data: [] = await prisma.$queryRaw(sql);
        
        const customers = data.map((customer: any) => ({
            ...customer,
            total_pending: formatCurrency(Number(customer.total_pending)),
            total_paid: formatCurrency(Number(customer.total_paid)),
        }));

        return customers;
    }
    catch (error) {
        console.error("Database Error:", error);
        throw new Error('Failed to fetch customer table');
    }
}

export async function getUser(prisma: PrismaClient, email: string) {
    noStore();
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        return user;
    }
    catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');    
    }
}