import { createClient } from "@supabase/supabase-js";
import { getUser } from "../../../../utils/getUser";
import Stripe from 'stripe';

const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;

const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, SERVICE_ROLE_KEY);

export async function POST(req) {
    const user = await getUser("id");

    const { amount, due_date, title, memo, client } = await req.json();

    let stripeKey = null;

    // Fetch Stripe Key
    const { data: stripeData, error: stripeError } = await adminClient.from('panel_settings').select('sk').eq('id', user.id).single();

    if (!stripeData || stripeError) {
        stripeKey = process.env.STRIPE_SECRET_KEY;
    } else {
        stripeKey = stripeData.sk;
    }

    const stripe = new Stripe(stripeKey);

    if (!stripeKey) {
        console.log("No Stripe key found");
        return new Response(JSON.stringify({ error: { code: 400, message: "No Stripe key found" } }), { status: 400 });
    }

    if (!client) {
        console.log("Please select a client");
        return new Response(JSON.stringify({ error: { code: 400, message: "Please select a client" } }), { status: 400 });
    }

    if (!client.email) {
        console.log("The client you selected must have an email attached to them");
        return new Response(JSON.stringify({ error: { code: 400, message: "The client you selected must have an email attached to them" } }), { status: 400 });
    }

    if (!amount) {
        console.log("Please enter an amount");
        return new Response(JSON.stringify({ error: { code: 400, message: "Please enter an amount" } }), { status: 400 });
    }


    let customer;

    const customers = await stripe.customers.search({
        query: `email:"${client.email}"`
    });

    if (customers.data.length < 1) {
        customer = await stripe.customers.create({
            email: client.email,
            name: client.username,
        });

        await adminClient
            .from('panel_clients')
            .update({ stripe_id: customer.id })
            .eq('panel_id', user.id)
            .eq('id', client.id);
    } else {
        customer = customers.data[0];
    }

    const invoice = await stripe.invoices.create({
        customer: customer.id,
        due_date: Math.floor(new Date(due_date || Date.now() + 30 * 24 * 60 * 60 * 1000).getTime() / 1000),
        currency: 'usd',
        auto_advance: true,
        collection_method: 'send_invoice',
        metadata: {
            ember_client_id: client.id,
        },
        description: memo,
    });

    const invoiceItem = await stripe.invoiceItems.create({
        customer: customer.id,
        amount: amount * 100,
        currency: 'usd',
        description: title,
        invoice: invoice.id,
    });

    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    const sentInvoice = await stripe.invoices.sendInvoice(finalizedInvoice.id);

    const { data, error } = await adminClient
        .from('panel_invoices')
        .insert({
            panel_id: user.id,
            client: client.id,
            amount,
            status: "unpaid",
            due_date,
            title,
            memo,
            link: sentInvoice.hosted_invoice_url,
            stripe_invoice_id: sentInvoice.id,
            type: 'stripe'
        })
        .select("*")
        .single();

    if (error) {
        console.log(error);
        return new Response(JSON.stringify({ error: { code: 400, message: "New invoice could not be made!" } }), { status: 400 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
}
