import { getSupabaseClient } from './supabase';
import { Activity, MemberWithActivity } from '../types';

// 自分の作業状況を更新
export async function updateActivity(
  memberId: string,
  filePath: string,
  statusMessage?: string
): Promise<void> {
  const supabase = getSupabaseClient();

  // 既存のアクティビティを検索
  const { data: existing } = await supabase
    .from('activities')
    .select('id')
    .eq('member_id', memberId)
    .single();

  if (existing) {
    // そのメンバーのアクティビティを更新
    const updateData: Record<string, unknown> = {
      file_path: filePath,
      is_active: true,
      updated_at: new Date().toISOString(),
    };
    // ステータスメッセージが提供されていれば更新
    if (statusMessage !== undefined) {
      updateData.status_message = statusMessage;
    }
    await supabase
      .from('activities')
      .update(updateData)
      .eq('id', existing.id);
  // 新しいアクティビティを作成
  } else {
    // 新規作成
    await supabase
      .from('activities')
      .insert({
        member_id: memberId,
        file_path: filePath,
        status_message: statusMessage || '',
        is_active: true,
      });
  }
}

export async function getTeamActivities(teamId: string): Promise<MemberWithActivity[]> {
  const supabase = getSupabaseClient();

  // チームのメンバー一覧を取得
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select()
    .eq('team_id', teamId);
  
  if (membersError || !members) {
    return [];
  }

  // 各メンバーのアクティビティを取得
  const memberIds = members.map(m => m.id);
  const { data: activities } = await supabase
    .from('activities')
    .select()
    .in('member_id', memberIds);

  // メンバーとアクティビティを結合
  return members.map(member => {
    const activity = activities?.find(a => a.member_id === member.id);
    return {
      ...member,
      activity: activity as Activity | undefined,
    } as MemberWithActivity;
  });
}

export function subscribeToActivities(
  teamId: string,
  callback: (activities: MemberWithActivity[]) => void
): () => void {
  const supabase = getSupabaseClient();
  // TODO: リアルタイム購読実装
  return () => {};
}
