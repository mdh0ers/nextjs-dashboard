import { expect, test } from "vitest";
import { PrismaClient } from "@prisma/client";
import * as invoicesAPI from "../../app/lib/data/invoice";
import * as revenueAPI from "../../app/lib/data/revenue";
import * as customerAPI from "../../app/lib/data/customer";
import * as cardAPI from "../../app/lib/data/card";
import * as userAPI from "../../app/lib/data/user";

import * as placeholder from "../../app/lib/placeholder-data";

const prisma = new PrismaClient();

test('fetchRevenue', async () => {
    const revenues = await revenueAPI.fetchRevenue();
    const revenueCount = await prisma.revenue.count();
    expect(revenues.length).toBe(placeholder.revenue.length);
});

test('fetchLatestInvoices', async () => {
    const invoices = await invoicesAPI.fetchLatestInvoices();
    expect(invoices.length).toBe(5);
});

test('fetchCardData', async () => {
    const cardData = await cardAPI.fetchCardData();
    expect(cardData);
}); 

test('fetchFilteredInvoices_noFilter', async () => {
    const invoices = await invoicesAPI.fetchFilteredInvoices({});
    if (invoices === undefined) {
        throw Error("no invoices");
    }
    const invoiceCount = await prisma.invoice.count();
    expect(invoices.length).toBe(invoiceCount);
});

test('fetchFilteredInvoices_filter01', async () => {
    const invoices = await invoicesAPI.fetchFilteredInvoices({
        status: "paid",
    });
    if (invoices === undefined) {
        throw Error("no invoices");
    }

    expect(invoices.length).toBe(10);
});

test('fetchFilteredInvoices_filter02', async () => {
    const invoices = await invoicesAPI.fetchFilteredInvoices({
        status: "pending",
    });
    if (invoices === undefined) {
        throw Error("no invoices");
    }
    expect(invoices.length).toBe(5);
});

test('fetchFilteredInvoices_filter03', async () => {
    const invoices = await invoicesAPI.fetchFilteredInvoices({
        customer: {
            email: "dietz"
        }
    });

    if (invoices === undefined) {
        throw Error("no invoices");
    }
    
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

test('fetchFilteredInvoices_filter04', async () => {
    const invoices = await invoicesAPI.fetchFilteredInvoices({
        customer: {
            email: "dietz"
        },
        status: "pending"
    });

    console.log(invoices);


    if (invoices === undefined) {
        throw Error("no invoices");
    }
    
    let pCustomer = placeholder.customers.filter((customer) => customer.email.includes("dietz"));
    let pInvoices = placeholder.invoices.filter((invoice) => {
        for (let i = 0; i < pCustomer.length; i++) {
            if (pCustomer[i].id == invoice.customer_id) {
                return true;
            }
        }
        return false;
    }); 
    pInvoices = pInvoices.filter((invoice) => invoice.status == "pending");


    expect(pInvoices.length).toBe(invoices.length);
    expect(invoices.length).toBe(0);
});


test('fetchInvoiceById', async () => {
    const invoice = await invoicesAPI.fetchInvoiceById("20c3a03e-0fd1-4d66-9f23-703e491c14cf");
    expect(invoice.id).toBe("20c3a03e-0fd1-4d66-9f23-703e491c14cf");
});

test("fetchCustomers", async () => {
    const customer = await customerAPI.fetchCustomers();
    expect(customer.length).toBe(placeholder.customers.length);
});

test("filteredCustomers", async () => {
    const customers = await customerAPI.fetchFilteredCustomers({
        emailLike: "dietz"
    });
    expect(customers.length).toBe(1);
});

test("getUser", async () => {
    const user = await userAPI.getUser("user@nextmail.com");
    expect(user);
});