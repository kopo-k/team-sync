import { getSupabaseClient } from './supabase';
import { Activity, MemberWithActivity } from '../types';

// 自分の作業状況を更新
export async function updateActivity(
  memberId: string,
  filePath: string,
  statusMessage?: string
): Promise<void> {
  const supabase = getSupabaseClient();
  // TODO: 作業状況更新実装
}

export async function getTeamActivities(teamId: string): Promise<MemberWithActivity[]> {
  const supabase = getSupabaseClient();
  // TODO: チーム作業状況取得実装
  return [];
}

export function subscribeToActivities(
  teamId: string,
  callback: (activities: MemberWithActivity[]) => void
): () => void {
  const supabase = getSupabaseClient();
  // TODO: リアルタイム購読実装
  return () => {};
}
