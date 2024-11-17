import Stripe from 'stripe';
import { getUser } from '../../../../utils/getUser';
import { createClient } from '@supabase/supabase-js';


const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;

const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, SERVICE_ROLE_KEY);

export async function POST(req) {
    const { invoice_id } = await req.json();

    const user = await getUser("id");

    let stripeKey = null;

    // Fetch Stripe Key
    const { data, error } = await adminClient.from('panel_settings').select('sk').eq('id', user.id).single();

    if (!data || error) {
        stripeKey = process.env.STRIPE_SECRET_KEY;
    } else {
        stripeKey = data.sk;
    }

    const stripe = new Stripe(stripeKey);

    if (!stripeKey) {
        return new Response(JSON.stringify({ message: 'No Stripe key found' }), { status: 500 });
    }

    if (!invoice_id) {
        return new Response(JSON.stringify({ message: 'Invoice ID is required' }), { status: 400 });
    }

    try {
        const invoice = await stripe.invoices.retrieve(invoice_id);
        return new Response(JSON.stringify({ isPaid: invoice.paid, paidAt: new Date(invoice.status_transitions.paid_at * 1000).toISOString() }), { status: 200 });
    } catch (error) {
        console.log(error);
        return new Response(JSON.stringify({ message: 'Error retrieving invoice status' }), { status: 500 });
    }
}