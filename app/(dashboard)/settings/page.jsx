import Settings from "../../../components/Settings";
import { getUser } from "../../../utils/getUser";

export const metadata = {
    title: 'Settings | Panel'
}

export default async function Page() {
    const user = await getUser();

    if (!user) return redirect('/login');

    return <Settings />
}