import { createClient } from "@supabase/supabase-js";
import QuotePage from "../../../components/QuotePage";

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page({ params }) {
    const quoteId = params.quoteId;
    const { quote, settings } = await getQuote(quoteId)

    return <QuotePage quote={quote} settings={settings} />
}


export async function getQuote(quoteId) {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SERVICE_ROLE_KEY)

    const {
        data: quote,
        error: quoteError
    } = await supabaseAdmin.from('panel_quotes').select('*, client ( id, username, avatar_url )').eq('id', quoteId).single()

    const {
        data: settings,
        error: settingsError
    } = await supabaseAdmin.from('panel_settings').select('settings,terms, display_name').eq('id', quote.panel_id).single()

    if (quoteError || settingsError) {
        console.log(quoteError, settingsError)
        return {
            notFound: true,
        }
    }

    return {
        quote,
        settings
    }
}

export async function generateMetadata({ params }) {
    const quoteId = params.quoteId;

    return {
        title: `Quote ${quoteId} | Panel`
    }
}