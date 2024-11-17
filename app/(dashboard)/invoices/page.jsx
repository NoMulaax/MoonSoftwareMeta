import { redirect } from "next/navigation";
import InvoicesPage from "../../../components/Invoices";
import { adminClient } from "../../../utils/adminClient";
import { getUser } from "../../../utils/getUser";

export const metadata = {
    title: 'Invoices | Panel'
}

export default async function Page() {
    const user = await getUser("id");

    if (!user) return redirect('/login');
    
    const { data: settings, error } = await adminClient.from('panel_settings').select('settings').eq('id', user.id).single();

    if (error) {
        console.error(error);
    }

    return <InvoicesPage settings={settings?.settings} />
}