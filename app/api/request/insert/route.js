import { createClient } from "@supabase/supabase-js";

const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;

const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, SERVICE_ROLE_KEY);

export async function POST(req) {
    const { tracking_id, commission_id, panel_id, description, offered_amount, deadline, client_id } = await req.json();

    const { data: commission, error: commissionError } = await adminClient
        .from('panel_commissions')
        .select('id')
        .eq('tracking_id', tracking_id)
        .eq('id', commission_id)
        .single();

    if (commissionError) {
        console.log(commissionError);
        return new Response(JSON.stringify({ error: { code: 500, message: commissionError.message } }), { status: 500 });
    } else if (!commission) {
        return new Response(JSON.stringify({ error: { code: 400, message: "The tracking ID does not match the commission ID!" } }), { status: 400 });
    }

    const { data: insertData, error: insertError } = await adminClient
        .from('panel_requests')
        .insert({
            panel_id: panel_id,
            commission: commission_id,
            description: description,
            offered_amount: offered_amount,
            deadline: deadline
        })
        .select()
        .single();

    if (insertError) {
        console.log(insertError);
        return new Response(JSON.stringify({ error: { code: 500, message: insertError.message } }), { status: 500 });
    } else {
        const { error: notificationError } = await adminClient.from('notifications').insert({
            panel_id: panel_id,
            title: "New change request",
            message: "%subject_username% submitted a new change request!",
            subject: client_id,
            link: "/requests?page=1&sort=deadline&descending=false",
        });
        if (notificationError) {
            console.log(notificationError);
        }
        return new Response(JSON.stringify({ message: "Request inserted successfully!", data: insertData }), { status: 200 });
    }
}