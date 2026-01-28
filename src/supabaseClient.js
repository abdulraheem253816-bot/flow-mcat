import { createClient } from '@supabase/supabase-js';

// Apni asal keys yahan quote marks ke andar likhein
const supabaseUrl = 'https://wpxbiwoldvignqdyugma.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_wjNPTmRVh9kvhoszzr89Mw_jT_2s8OU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);