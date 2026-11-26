

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dxfukwpvcenbrpfdkqgb.supabase.co'.trim();
const supabaseAnonKey = 'sb_publishable_KZFRKV4F1J1iTY1FUyB_Ag_QocYkg8B'.trim();

if (!/^https?:\/\/.+/.test(supabaseUrl)) {
  throw new Error(`URL Supabase invalide : ${supabaseUrl}`);
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  }
);
