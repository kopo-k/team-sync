import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CONFIG } from '../utils/config';

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    // まだ作られていなければ作成
    supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  }
  return supabase;
}
