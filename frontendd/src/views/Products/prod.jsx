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

**/