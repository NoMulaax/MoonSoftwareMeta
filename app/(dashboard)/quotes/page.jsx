import QuotesPage from "../../../components/Quotes";
import { getUser } from "../../../utils/getUser";
import { adminClient } from "../../../utils/adminClient";

export const metadata = {
    title: 'Quotes | Panel'
}

export default async function Page() {
    const user = await getUser("id");
    const { data: settings, error } = await adminClient.from('panel_settings').select('settings').eq('id', user.id).single();

    if (error) {
        console.error(error);
    }

    return <QuotesPage settings={settings?.settings} />
}