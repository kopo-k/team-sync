import { getSupabaseClient } from './supabase';
import { Team, Member } from '../types';

export async function createTeam(name: string): Promise<Team | null> {
  const supabase = getSupabaseClient();
  // TODO: チーム作成実装
  return null;
}

export async function joinTeam(inviteCode: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  // TODO: チーム参加実装
  return false;
}

export async function getTeamMembers(teamId: string): Promise<Member[]> {
  const supabase = getSupabaseClient();
  // TODO: メンバー取得実装
  return [];
}
