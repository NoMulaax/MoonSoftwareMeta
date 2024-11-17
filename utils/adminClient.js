import { createClient } from "@supabase/supabase-js";
import 'server-only'

export const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SERVICE_ROLE_KEY);