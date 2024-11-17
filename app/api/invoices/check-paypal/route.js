import axios from "axios";
import { adminClient } from "../../../../utils/adminClient";
import { getUser } from "../../../../utils/getUser";

export async function POST(req) {
    const body = await req.json();

    if (req.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { invoice_id } = body;

    const axiosClient = axios.create({
        baseURL: 'https://api-m.paypal.com'
    });

    async function getAccessToken() {
        const user = await getUser("id");

        // Fetch PayPal Keys
        const { data: settings, error: settingsError } = await adminClient.from('panel_settings').select('psk').eq('id', user.id).single();

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

        const response = await axiosClient.post('/v1/oauth2/token', 'grant_type=client_credentials', {
            headers: {
                'Authorization': `Basic ${token}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!response.data.access_token) {
            throw new Error('Failed to get access token');
        }

        return response.data.access_token;
    }

    async function getInvoiceDetails(accessToken, invoiceId) {
        const response = await axiosClient.get(`/v2/invoicing/invoices/${invoiceId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.data) {
            throw new Error('Failed to get invoice details');
        }

        return response.data;
    }

    try {
        const accessToken = await getAccessToken();
        const invoiceDetails = await getInvoiceDetails(accessToken, invoice_id);

        return Response.json({ isPaid: invoiceDetails.status === 'PAID', paidAt: new Date(invoiceDetails?.payments?.transactions[0]?.payment_date || null).toISOString() }, { status: 200 });
    } catch (error) {
        console.error('Error checking invoice status:', error);
        return Response.json({ error: 'Error checking invoice status' }, { status: 500 });
    }
}