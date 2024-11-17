import {supabaseClient} from "./supabaseClient";
import {notifications} from "@mantine/notifications";

export default async function handleDeleteEntry(table, id) {
    const {error} = await supabaseClient
        .from(table)
        .delete()
        .eq('id', id);
    if (error) {
        notifications.show({
            title: 'Error!', message: 'Something went wrong', color: 'red',
        })
        return false;
    } else {
        notifications.show({
            title: 'Done!', message: 'Entry ' + id + ' deleted successfully', color: 'green',
        })
        return true;
    }
}