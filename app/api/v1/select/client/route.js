import { createClient } from "@supabase/supabase-js";

const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, SERVICE_ROLE_KEY);

export async function GET(req) {
    const { searchBy, searchValue } = req.nextUrl.searchParams;

    // Extract the authorization header
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: { code: 401, message: "Authentication required. Please enter an API key" } }), { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];

    const { data: apiUser, error: apiUserError } = await adminClient.from('panel_settings').select('id, api_uses_left').eq('api_key', token).eq('license_active', true).single();

    if (apiUserError) {
        console.log(apiUserError);
        return new Response(JSON.stringify({ error: { code: 500, message: "A server error occurred! Please try again later or contact support." } }), { status: 500 });
    }

    if (!apiUser) {
        return new Response(JSON.stringify({ user: null, error: { code: 403, message: "Invalid API key." } }), { status: 403 });
    }

    if (apiUser.api_uses_left < 1) {
        return new Response(JSON.stringify({ user: null, error: { code: 403, message: "You have no API uses left." } }), { status: 403 });
    }

    const { error: updateUsesError } = await adminClient.from('panel_settings').update({ api_uses_left: apiUser.api_uses_left - 1 }).eq('id', apiUser.id);
    if (updateUsesError) {
        console.log(updateUsesError);
        return new Response(JSON.stringify({ error: { code: 500, message: updateUsesError.message } }), { status: 500 });
    }

    const { data, error: selectError } = await adminClient.from('panel_clients').select('*').eq(searchBy, searchValue).eq('panel_id', apiUser.id);

    if (selectError) {
        console.log(selectError);
        return new Response(JSON.stringify({ error: { code: 500, message: selectError.message } }), { status: 500 });
    }

    return new Response(JSON.stringify({ error: null, data }), { status: 200 });
}