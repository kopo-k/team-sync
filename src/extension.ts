import * as vscode from 'vscode';
import { signInWithGitHub, signOut, getCurrentUser, getSession } from './services/authService';
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
    vscode.commands.registerCommand('team-sync.login', loginCommand),
    vscode.commands.registerCommand('team-sync.logout', logoutCommand),
    vscode.commands.registerCommand('team-sync.createTeam', createTeamCommand),
    vscode.commands.registerCommand('team-sync.joinTeam', joinTeamCommand),
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
  } else {
    sidebarProvider.setLoginState(false);
  }
}

async function loginCommand(): Promise<void> {
  try {
    vscode.window.showInformationMessage('ブラウザでGitHub認証を行ってください...');
    await signInWithGitHub();

    const user = await getCurrentUser();
    const username = user?.user_metadata?.user_name || 'ユーザー';
    const avatarUrl = user?.user_metadata?.avatar_url || '';

    sidebarProvider.setLoginState(true, { username, avatarUrl });
    vscode.window.showInformationMessage(`ログインしました: ${username}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ログインに失敗しました';
    vscode.window.showErrorMessage(message);
  }
}

async function logoutCommand(): Promise<void> {
  try {
    await signOut();
    sidebarProvider.setLoginState(false);
    sidebarProvider.setTeam(null);
    vscode.window.showInformationMessage('ログアウトしました');
  } catch (error) {
    vscode.window.showErrorMessage('ログアウトに失敗しました');
  }
}

export function deactivate() {}
