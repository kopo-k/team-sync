import { getSupabaseClient } from './supabase';

// GitHub アカウントでログインする処理
export async function signInWithGitHub(): Promise<void> {
  const supabase = getSupabaseClient();
  // TODO: GitHub OAuth実装
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
