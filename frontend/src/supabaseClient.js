import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dbcfhnkmuxfhllihomyt.supabase.co'
const supabaseAnonKey = 'sb_publishable_vz4cwlm243FfLJo6d8Mf5w_xSszd24a'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)