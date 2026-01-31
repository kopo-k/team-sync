import { getSupabaseClient } from './supabase';
import { getCurrentUser } from './authService';
import { Team, Member } from '../types';

// 招待コードを生成
function generateInviteCode(): string {
  // 紛らわしい文字を除いたランダムコード生成
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code.slice(0, 4) + '-' + code.slice(4);
}

// ユーザー情報を抽出
function extractUserInfo(user: { id: string; user_metadata?: Record<string, any> }) {
  return {
    githubId: user.user_metadata?.provider_id || user.id,
    githubUsername: user.user_metadata?.user_name || 'unknown',
    avatarUrl: user.user_metadata?.avatar_url || '',
  };
}

// チーム作成
export async function createTeam(name: string): Promise<Team | null> {
  const supabase = getSupabaseClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('ログインが必要です');
  }

  const inviteCode = generateInviteCode();

  // チームを作成
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ name, invite_code: inviteCode })
    .select()
    .single();

  if (teamError || !team) {
    throw new Error('チームの作成に失敗しました');
  }

  // 作成者をメンバーとして追加
  const { githubId, githubUsername, avatarUrl } = extractUserInfo(user);
  const { error: memberError } = await supabase
    .from('members')
    .insert({
      team_id: team.id,
      github_id: githubId,
      github_username: githubUsername,
      avatar_url: avatarUrl,
    });

  if (memberError) {
    throw new Error('メンバーの追加に失敗しました');
  }

  return team as Team;
}

// チーム参加
export async function joinTeam(inviteCode: string): Promise<Team | null> {
  const supabase = getSupabaseClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('ログインが必要です');
  }

  // 招待コードでチームを検索
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select()
    .eq('invite_code', inviteCode.toUpperCase())
    .single();

  if (teamError || !team) {
    throw new Error('チームが見つかりません');
  }

  // 既に参加しているか確認
  const { githubId, githubUsername, avatarUrl } = extractUserInfo(user);
  const { data: existingMember } = await supabase
    .from('members')
    .select()
    .eq('team_id', team.id)
    .eq('github_id', githubId)
    .single();

  if (existingMember) {
    return team as Team; // 既に参加済み
  }

  // メンバーとして追加
  // 追加したするだけなのでエラーだった場合のみ
  const { error: memberError } = await supabase
    .from('members')
    .insert({
      team_id: team.id,
      github_id: githubId,
      github_username: githubUsername,
      avatar_url: avatarUrl,
    });

  if (memberError) {
    throw new Error('チームへの参加に失敗しました');
  }

  return team as Team;
}

// ユーザーが所属するチームを取得
export async function getMyTeam(): Promise<Team | null> {
  const supabase = getSupabaseClient();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { githubId } = extractUserInfo(user);
  const { data: member } = await supabase
    .from('members')
    .select('team_id')
    .eq('github_id', githubId)
    .single();

  if (!member) {
    return null;
  }

  const { data: team } = await supabase
    .from('teams')
    .select()
    .eq('id', member.team_id)
    .single();

  return team as Team | null;
}

// チームメンバーを取得
export async function getTeamMembers(teamId: string): Promise<Member[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('members')
    .select()
    .eq('team_id', teamId);

  if (error) {
    console.error('[TeamSync] メンバー取得エラー:', error.message);
    return [];
  }

  return data as Member[];
}

// チームを退出
export async function leaveTeam(teamId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('ログインが必要です');
  }

  const { githubId } = extractUserInfo(user);
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('team_id', teamId)
    .eq('github_id', githubId);

  if (error) {
    throw new Error('チームの退出に失敗しました');
  }
}

// 現在のメンバー情報を取得
export async function getMyMember(): Promise<Member | null> {
  const supabase = getSupabaseClient();
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  const { githubId } = extractUserInfo(user);
  const { data } = await supabase
    .from('members')
    .select()
    .eq('github_id', githubId)
    .single();

  return data as Member | null;
}
