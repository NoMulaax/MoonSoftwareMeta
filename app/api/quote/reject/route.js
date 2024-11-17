import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SERVICE_ROLE_KEY);

export async function POST(req) {
    const { panelId, client, quoteId } = await req.json();

    if (quoteId === undefined) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const { data: quote } = await supabaseAdmin.from('panel_quotes').select('status').eq('id', quoteId).single();
    if (quote.status !== "pending") {
        return new Response(JSON.stringify({ error: 'This quote has already been accepted or rejected!' }), { status: 400 });
    }

    const { error } = await supabaseAdmin.from('panel_quotes').update({ status: "rejected" }).eq('id', quoteId);

    if (error) {
        console.log(error);
        return new Response(JSON.stringify({ error: 'An unexpected error occurred!' }), { status: 500 });
    } else {
        const { error: notificationError } = await supabaseAdmin.from('notifications').insert({
            panel_id: panelId,
            title: "Quote rejected",
            message: "%subject_username% has rejected quote " + quoteId + "!",
            subject: client,
            link: "/quotes?sort=start_date&descending=false&page=1&search=" + quoteId,
        });
        if (notificationError) {
            console.log(notificationError);
        }
        return new Response(JSON.stringify({ message: 'You have rejected quote ' + quoteId + '!' }), { status: 200 });
    }
}