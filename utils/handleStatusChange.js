import {supabaseClient} from "./supabaseClient";
import {notifications} from "@mantine/notifications";

export default async function handleStatusChangeClick (table, id, status, callback) {
    const {error} = await supabaseClient
        .from(table)
        .update({status})
        .eq('id', id);
    if (error) {
        notifications.show({
            title: 'Error!', message: 'Something went wrong', color: 'red',
        })
    } else {
        callback(id, status);
        notifications.show({
            title: 'Done!',
            message: 'Status has been marked as ' + status.replaceAll("_", " ") + '',
            color: 'green',
        })
    }
}