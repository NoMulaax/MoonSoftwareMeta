import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export async function getUser(columns) {
    const cookies = require('next/headers').cookies()

    const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const accessToken = cookies.get('access-token')?.value;
    const refreshToken = cookies.get('refresh-token')?.value;

    if (refreshToken && accessToken) {
        try {
            await client.auth.setSession({
                refresh_token: refreshToken, access_token: accessToken
            }, {
                auth: { persistSession: false }
            });

        } catch (error) {
            console.error('User not authenticated:', error);
            return null;
        }
    } else {
        return null;
    }
    const { data, error } = await client.auth.getUser();
    
    if (!data.user || !data?.user?.id || error) {
        return redirect('/login');
    }

    const {
        data: userData,
        error: userError
    } = await client.from('panel_settings').select(columns || "*").eq('id', data.user.id).single();

    if (!userData || userError) {
        return redirect('/login');
    }

    return {
        ...userData,
        email: data.user.email,
    };

}