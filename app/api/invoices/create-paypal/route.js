import axios from 'axios';
import { getUser } from '../../../../utils/getUser';
import { adminClient } from '../../../../utils/adminClient';
import { stripHtml } from 'string-strip-html';
import { NextResponse } from 'next/server';

const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || 'local';

const axiosClient = axios.create({
    baseURL: 'https://api-m.paypal.com'
});

async function createInvoice(token, client, name, title, price, memo, dueDate, terms, logo, display_name) {
    dueDate = new Date(dueDate).toISOString().split('T')[0];
    try {
        const invoice = {
            items: [
                {
                    name: name,
                    description: title,
                    quantity: 1,
                    unit_amount: {
                        value: price + "",
                        currency_code: 'USD'
                    }
                }
            ],
            detail: {
                note: memo,
                terms_and_conditions: stripHtml(terms).result,
                currency_code: 'USD',
                payment_term: {
                    due_date: dueDate
                }
            },
            invoicer: {
                logo_url: logo,
                name: {
                    given_name: display_name,
                    surname: ''
                }
            },
            primary_recipients: [
                {
                    business_name: client.name,
                    billing_info: {
                        email_address: client.email
                    }
                }
            ]
        };

        const response = await axiosClient.post('/v2/invoicing/invoices', invoice, {
            headers: {
                'Authorization': `Basic ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("New invoice created:", response.data);
        return response.data.href.substring(response.data.href.lastIndexOf('/') + 1);
    } catch (error) {
        console.log("Error creating invoice:", error);
        return new NextResponse.json({ error: error }, { status: 500 });
    }
}

async function sendInvoice(token, invoiceId) {
    try {
        const response = await axiosClient.post(`/v2/invoicing/invoices/${invoiceId}/send`, {
            send_to_invoicer: false,
            send_to_recipient: true,
        }, {
            headers: {
                'Authorization': `Basic ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.log("Error sending invoice:", error?.response?.data);
    }
}

export async function POST(req) {
    const body = await req.json();
    const { client, amount, memo, title, due_date } = body;

    const user = await getUser("id");

    // Fetch PayPal Keys
    const { data: settings, error: settingsError } = await adminClient.from('panel_settings').select('psk, terms, logo, display_name').eq('id', user.id).single();

    let clientId, clientSecret;
    if (!settings || settingsError || !settings.psk?.PAYPAL_CLIENT_ID || !settings.psk?.PAYPAL_CLIENT_SECRET) {
        clientId = process.env.PAYPAL_CLIENT_ID;
        clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    } else {
        clientId = settings.psk.PAYPAL_CLIENT_ID;
        clientSecret = settings.psk.PAYPAL_CLIENT_SECRET;
    }

    if (!clientId || !clientSecret) {
        return new Response(JSON.stringify({ error: 'No PayPal keys found' }), { status: 400 });
    }

    const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const { terms, logo, display_name } = settings;

    try {
        const invoiceId = await createInvoice(token, client, "Invoice for commission", title, amount, memo, due_date, terms, logo, display_name);
        if (!invoiceId) throw new Error('Failed to create invoice');

        await new Promise(resolve => setTimeout(resolve, 1000));

        await sendInvoice(token, invoiceId);

        // Add invoice to database
        const { data: invoice, error: invoiceError } = await adminClient.from('panel_invoices').insert({
            panel_id: user.id,
            client: client.id,
            title: title,
            due_date: due_date,
            memo: memo,
            status: 'pending',
            stripe_invoice_id: invoiceId,
            amount: amount,
            type: 'paypal',
            link: `https://www.paypal.com/invoice/p/#${invoiceId.replaceAll("-", "")}`
        }).select().single();

        if (invoiceError) {
            console.error('Error adding invoice to database:', invoiceError);
            throw new Error('Failed to add invoice to database');
        }

        return new Response(JSON.stringify({
            amount: amount,
            created_at: invoice.created_at,
            due_date: due_date,
            memo: memo,
            title: title,
            id: invoice.id,
            link: `https://www.paypal.com/invoice/p/#${invoiceId.replaceAll("-", "")}`,
            type: 'paypal',
            stripe_invoice_id: invoiceId,
            status: 'pending',
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error generating invoice:', error?.response?.data);
        return new Response(JSON.stringify({ error: error?.response?.data }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}