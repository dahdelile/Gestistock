/**sa3dbouh
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mlhraljwaevemwmbeynz.supabase.co';
const supabaseAnonKey = 'sb_publishable_yKgphmJE3D2PtTVJJeC5UQ_fDvHpf03';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

//swdat
import { createClient } from '@supabase/supabase-js';
//s3dn
const supabaseUrl = 'https://dxfukwpvcenbrpfdkqgb.supabase.co';
const supabaseAnonKey = 'sb_publishable_KZFRKV4F1J1iTY1FUyB_Ag_QocYkg8B';

//swdt
//const supabaseUrl = 'https://dbcfhnkmuxfhllihomyt.supabase.co';
//const supabaseAnonKey = 'sb_publishable_vz4cwlm243FfLJo6d8Mf5w_xSszd24a';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
  
});




**/