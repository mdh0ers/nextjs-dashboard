import { Prisma, PrismaClient } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { formatCurrency } from "../utils";

const prisma = new PrismaClient();

export async function fetchRevenue() {
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
