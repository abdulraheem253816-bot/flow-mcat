import { createClient } from '@supabase/supabase-js';

// Supabase Dashboard -> Settings -> API se URL aur Anon Key yahan dalein
const supabaseUrl = 'https://wpxbiwoldvignqdyugma.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_wjNPTmRVh9kvhoszzr89Mw_jT_2s8OU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);