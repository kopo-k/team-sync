import * as vscode from 'vscode';
import { getCurrentUser, getSession } from './services/authService';
import { getMyTeam } from './services/teamService';
import { loginCommand, logoutCommand } from './commands/auth';
import { createTeamCommand, joinTeamCommand } from './commands/team';
import { setStatusCommand } from './commands/status';
import { TeamSyncSidebarProvider } from './views/sidebarProvider';
import { startFileWatcher } from './watchers/fileWatcher';

let sidebarProvider: TeamSyncSidebarProvider;

export async function activate(context: vscode.ExtensionContext) {
  console.log('TeamSync is now active!');

  // サイドバー
  sidebarProvider = new TeamSyncSidebarProvider();
  vscode.window.registerTreeDataProvider('teamSyncSidebar', sidebarProvider);

  // 起動時にセッション確認
  await checkLoginState();

  // コマンド登録
  context.subscriptions.push(
    vscode.commands.registerCommand('team-sync.login', () => loginCommand(sidebarProvider)),
    vscode.commands.registerCommand('team-sync.logout', () => logoutCommand(sidebarProvider)),
    vscode.commands.registerCommand('team-sync.createTeam', () => createTeamCommand(sidebarProvider)),
    vscode.commands.registerCommand('team-sync.joinTeam', () => joinTeamCommand(sidebarProvider)),
    vscode.commands.registerCommand('team-sync.setStatus', () => {
      setStatusCommand('');
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
    }
  } else {
    sidebarProvider.setLoginState(false);
  }
}

export function deactivate() {}

