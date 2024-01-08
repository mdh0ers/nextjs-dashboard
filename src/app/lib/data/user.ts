import { Prisma, PrismaClient } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { formatCurrency } from "../utils";

const prisma = new PrismaClient();

export async function getUser(email: string) {
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