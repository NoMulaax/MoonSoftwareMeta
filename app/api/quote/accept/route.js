import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SERVICE_ROLE_KEY);

export async function POST(req) {
    const { quoteId, acceptedTos, client, proposedAmount, deadline, title, panelId } = await req.json();

    if (!quoteId || acceptedTos === undefined) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    if (!acceptedTos) {
        return new Response(JSON.stringify({ error: "You must accept the freelancer's terms of service!" }), { status: 400 });
    }

    const { data: quote } = await supabaseAdmin.from('panel_quotes').select('status').eq('id', quoteId).single();
    if (quote.status !== "pending") {
        return new Response(JSON.stringify({ error: 'This quote has already been accepted or rejected!' }), { status: 400 });
    }

    const { error } = await supabaseAdmin.from('panel_quotes').update({ status: "accepted" }).eq('id', quoteId);

    const { error: commissionError } = await supabaseAdmin.from('panel_commissions').insert([{
        client: client.id, total_value: proposedAmount, deadline, title, status: "not_started", panel_id: panelId,
    }]);

    if (commissionError) {
        console.log(commissionError);
        return new Response(JSON.stringify({ error: 'An unexpected error occurred when creating the commission!' }), { status: 500 });
    }

    if (error) {
        console.log(error);
        return new Response(JSON.stringify({ error: 'An unexpected error occurred!' }), { status: 500 });
    } else {
        const { error: notificationError } = await supabaseAdmin.from('notifications').insert({
            panel_id: panelId,
            title: "Quote accepted",
            message: "%subject_username% has accepted quote " + quoteId + "!",
            subject: client.id,
            link: "/quotes?sort=start_date&descending=false&page=1&search=" + quoteId,
        });
        if (notificationError) {
            console.log(notificationError);
        }
        return new Response(JSON.stringify({
            message: 'You have accepted quote ' + quoteId + '!',
        }), { status: 200 });
    }
}