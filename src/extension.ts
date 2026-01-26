import * as vscode from 'vscode';
import { loginCommand, logoutCommand } from './commands/auth';
import { createTeamCommand, joinTeamCommand } from './commands/team';
import { setStatusCommand } from './commands/status';
import { TeamSyncSidebarProvider } from './views/sidebarProvider';
import { startFileWatcher } from './watchers/fileWatcher';

export function activate(context: vscode.ExtensionContext) {
  console.log('TeamSync is now active!');

  // サイドバー
  const sidebarProvider = new TeamSyncSidebarProvider();
  vscode.window.registerTreeDataProvider('teamSyncSidebar', sidebarProvider);

  // コマンド登録
  context.subscriptions.push(
    vscode.commands.registerCommand('team-sync.login', loginCommand),
    vscode.commands.registerCommand('team-sync.logout', logoutCommand),
    vscode.commands.registerCommand('team-sync.createTeam', createTeamCommand),
    vscode.commands.registerCommand('team-sync.joinTeam', joinTeamCommand),
    vscode.commands.registerCommand('team-sync.setStatus', () => {
      // TODO: 現在のメンバーIDを渡す
      setStatusCommand('');
    })
  );

  // ファイル監視開始
  startFileWatcher(context);
}

export function deactivate() {}
