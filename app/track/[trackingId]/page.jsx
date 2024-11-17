import { createClient } from "@supabase/supabase-js";
import TrackingPage from "../../../components/TrackingPage";

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page({ params }) {
    const trackingId = params.trackingId;
    const commission = await getCommission(trackingId)

    return <TrackingPage commission={commission} />
}

export async function getCommission(trackingId) {

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SERVICE_ROLE_KEY)
    let {
        data: commission,
        error: commissionError
    } = await supabaseAdmin.from('panel_commissions').select('*, client ( id, username, avatar_url ), panel_id, requests:panel_requests!panel_requests_commission_fkey ( id, description, deadline, created_at, status, paid, offered_amount )')
        .order('created_at', { referencedTable: 'panel_requests', ascending: false })
        .eq('tracking_id', trackingId)
        .single()

    if (commissionError) {
        console.log(commissionError)
        return {
            notFound: true,
        }
    }

    const { data: settings, error: settingsError } = await supabaseAdmin.from('panel_settings').select('settings').eq('id', commission.panel_id).single()
    
    if(!settingsError) {
        commission.settings = settings.settings
    }

    return commission
}

export async function generateMetadata({ params }) {
    const trackingId = params.trackingId;

    return {
        title: `Tracking ${trackingId} | Panel`
    }
}
