export interface Team {
  id: string; // チームの一意な識別子
  name: string; // チーム名
  invite_code: string; // チームの招待コード
  created_at: string; // チーム作成日時
}

export interface Member {
  id: string; // メンバーの一意な識別子
  team_id: string; // 所属するチームのID
  github_id: string; // GitHubの一意な識別子
  github_username: string; // GitHubのユーザー名
  avatar_url: string; // アバターのURL
  joined_at: string; // チームに参加した日時
}

export interface Activity {
  id: string; // アクティビティの一意な識別子
  member_id: string; // アクティビティに関連するメンバーのID
  file_path: string; // 編集されたファイルのパス
  status_message: string; // ステータスメッセージ
  updated_at: string; // アクティビティの更新日時
  is_active: boolean; // アクティビティがアクティブかどうか
}

export interface MemberWithActivity extends Member {
  activity?: Activity;
}
