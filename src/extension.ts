import * as vscode from 'vscode';
import { getCurrentUser, getSession } from './services/authService';
import { getMyTeam, getMyMember } from './services/teamService';
import { getTeamActivities, subscribeToActivities } from './services/activityService';
import { loginCommand, logoutCommand } from './commands/auth';
import { createTeamCommand, joinTeamCommand } from './commands/team';
import { setStatusCommand } from './commands/status';
import { TeamSyncSidebarProvider } from './views/sidebarProvider';
import { startFileWatcher, setCurrentMember } from './watchers/fileWatcher';

let sidebarProvider: TeamSyncSidebarProvider;
let currentMemberId: string | null = null;
let unsubscribe: (() => void) | null = null;

export async function activate(context: vscode.ExtensionContext) {
  console.log('TeamSync is now active!');

  // サイドバー
  sidebarProvider = new TeamSyncSidebarProvider();
  vscode.window.registerTreeDataProvider('teamSyncSidebar', sidebarProvider);

  // 起動時にセッション確認(完了を待つだけ)
  await checkLoginState();

  // コマンド登録
  context.subscriptions.push(
    vscode.commands.registerCommand('team-sync.login', () => loginCommand(sidebarProvider)),
    vscode.commands.registerCommand('team-sync.logout', () => logoutCommand(sidebarProvider)),
    vscode.commands.registerCommand('team-sync.createTeam', () => createTeamCommand(sidebarProvider)),
    vscode.commands.registerCommand('team-sync.joinTeam', () => joinTeamCommand(sidebarProvider)),
    vscode.commands.registerCommand('team-sync.setStatus', () => {
      setStatusCommand(currentMemberId ?? '');
    })
  );

  // ファイル監視開始
  startFileWatcher(context);
}

async function checkLoginState(): Promise<void> {
  const session = await getSession();
  if (session) {
    const user = await getCurrentUser();
    const username = user?.user_metadata?.user_name || 'ユーザー';
    const avatarUrl = user?.user_metadata?.avatar_url || '';
    sidebarProvider.setLoginState(true, { username, avatarUrl });

    // チーム情報も確認
    const team = await getMyTeam();
    if (team) {
      sidebarProvider.setTeam(team.name);

      // メンバーの作業状況を取得してサイドバーに表示
      const activities = await getTeamActivities(team.id);
      sidebarProvider.setMembers(activities);

      // リアルタイム購読開始
      unsubscribe = subscribeToActivities(team.id, (updated) => {
        sidebarProvider.setMembers(updated);
      });
    }

    // メンバーIDを保存
    const member = await getMyMember();
    if (member) {
      currentMemberId = member.id;
      setCurrentMember(member.id);
    }
  } else {
    sidebarProvider.setLoginState(false);
  }
}

export function deactivate() {
  // リアルタイム購読を解除
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

