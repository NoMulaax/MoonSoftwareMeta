import CommissionsPage from "../../../components/Commissions";
import { adminClient } from "../../../utils/adminClient";
import { getUser } from "../../../utils/getUser";

export const metadata = {
    title: 'Commissions | Panel'
}

export default async function Page() {
    const user = await getUser("id");

    const { data: settings, error } = await adminClient.from('panel_settings').select('settings').eq('id', user.id).single();

    if (error) {
        console.error(error);
    }

    return <CommissionsPage settings={settings?.settings} />
}