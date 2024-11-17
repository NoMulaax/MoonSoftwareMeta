import RequestsPage from "../../../components/Requests";
import { getUser } from "../../../utils/getUser";
import { adminClient } from "../../../utils/adminClient";
export const metadata = {
    title: 'Requests | Panel'
}

export default async function Page() {
    const user = await getUser("id");
    const { data: settings, error } = await adminClient.from('panel_settings').select('settings').eq('id', user.id).single();

    if (error) {
        console.error(error);
    }

    return <RequestsPage settings={settings?.settings} />
}