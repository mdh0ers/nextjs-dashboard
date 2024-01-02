import { expect, test } from "vitest";
import { PrismaClient } from "@prisma/client";
import * as dataAPI from "../../app/lib/data";

import * as placeholder from "../../app/lib/placeholder-data";


const prisma = new PrismaClient();

test('fetchRevenue', async () => {
    const revenues = await dataAPI.fetchRevenue(prisma);
    const revenueCount = await prisma.revenue.count();
    expect(revenues.length).toBe(placeholder.revenue.length);
});

test('fetchLatestInvoices', async () => {
    const invoices = await dataAPI.fetchLatestInvoices(prisma);
    expect(invoices.length).toBe(5);
});

test('fetchCardData', async () => {
    const cardData = await dataAPI.fetchCardData(prisma);
    expect(cardData);
}); 

test('fetchFilteredInvoices_noFilter', async () => {
    const invoices = await dataAPI.fetchFilteredInvoices(prisma, {});
    const invoiceCount = await prisma.invoice.count();
    expect(invoices.length).toBe(invoiceCount);
});

test('fetchFilteredInvoices_filter01', async () => {
    const invoices = await dataAPI.fetchFilteredInvoices(prisma, {
        status: "paid",
    });
    expect(invoices.length).toBe(10);
});

test('fetchFilteredInvoices_filter02', async () => {
    const invoices = await dataAPI.fetchFilteredInvoices(prisma, {
        status: "pending",
    });
    expect(invoices.length).toBe(5);
});

test('fetchFilteredInvoices_filter03', async () => {
    const invoices = await dataAPI.fetchFilteredInvoices(prisma, {
        customerEmailLike: "dietz"
    });
    
    let pCustomer = placeholder.customers.filter((customer) => customer.email.includes("dietz"));
    let pInvoices = placeholder.invoices.filter((invoice) => {
        for (let i = 0; i < pCustomer.length; i++) {
            if (pCustomer[i].id == invoice.customer_id) {
                return true;
            }
        }
        return false;
    }); 

    expect(pInvoices.length).toBe(invoices.length);
});

test('fetchInvoiceById', async () => {
    const invoice = await dataAPI.fetchInvoiceById(prisma, "20c3a03e-0fd1-4d66-9f23-703e491c14cf");
    expect(invoice.id).toBe("20c3a03e-0fd1-4d66-9f23-703e491c14cf");
});

test("fetchCustomers", async () => {
    const customer = await dataAPI.fetchCustomers(prisma);
    expect(customer.length).toBe(placeholder.customers.length);
});

test("filteredCustomers", async () => {
    const customers = await dataAPI.fetchFilteredCustomers(prisma, {
        emailLike: "dietz"
    });
    expect(customers.length).toBe(1);
});

test("getUser", async () => {
    const user = await dataAPI.getUser(prisma, "user@nextmail.com");
    expect(user);
});