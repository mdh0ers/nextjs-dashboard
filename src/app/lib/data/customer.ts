import { Prisma, PrismaClient } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { formatCurrency } from "../utils";

const prisma = new PrismaClient();

export async function fetchCustomers() {
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

export async function fetchFilteredCustomers(query: CustomerQuery) {
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
