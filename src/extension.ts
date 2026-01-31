import * as vscode from 'vscode';
import { TeamStateManager } from './services/teamStateManager';
import { subscribeToActivities } from './services/activityService';
import { loginCommand, logoutCommand, restoreLoginState } from './commands/auth';
import { createTeamCommand, joinTeamCommand, leaveTeamCommand } from './commands/team';
import { setStatusCommand } from './commands/status';
import { TeamSyncSidebarProvider } from './views/sidebarProvider';
import { syncUI } from './views/syncUI';
import { checkFileConflicts } from './views/conflictWarning';
import { startFileWatcher } from './watchers/fileWatcher';

let state: TeamStateManager;
let sidebarProvider: TeamSyncSidebarProvider;
let unsubscribe: (() => void) | null = null;

export async function activate(context: vscode.ExtensionContext) {
  console.log('TeamSync is now active!');

  // サイドバー
  sidebarProvider = new TeamSyncSidebarProvider();
  vscode.window.registerTreeDataProvider('teamSyncSidebar', sidebarProvider);

  // 状態管理
  state = new TeamStateManager();

  // 起動時にセッション復元
  await restoreLoginState(state, sidebarProvider);
  startRealtime();

  // コマンド登録
  context.subscriptions.push(
    vscode.commands.registerCommand('team-sync.login', async () => {
      await loginCommand(state, sidebarProvider);
      startRealtime();
    }),
    vscode.commands.registerCommand('team-sync.logout', async () => {
      await logoutCommand(state, sidebarProvider);
      stopRealtime();
    }),
    vscode.commands.registerCommand('team-sync.createTeam', async () => {
      await createTeamCommand(state, sidebarProvider);
      startRealtime();
    }),
    vscode.commands.registerCommand('team-sync.joinTeam', async () => {
      await joinTeamCommand(state, sidebarProvider);
      startRealtime();
    }),
    vscode.commands.registerCommand('team-sync.setStatus', () => setStatusCommand(state)),
    vscode.commands.registerCommand('team-sync.leaveTeam', async () => {
      await leaveTeamCommand(state, sidebarProvider);
      stopRealtime();
    }),
  );

  // ファイル監視開始
  startFileWatcher(context, state);
}

// Realtime購読を開始
function startRealtime(): void {
  const teamId = state.getTeamId();
  if (!teamId) { return; }

  stopRealtime();
  unsubscribe = subscribeToActivities(teamId, (updated) => {
    state.setMembers(updated);
    syncUI(state, sidebarProvider);
    checkFileConflicts(updated, state.getMemberId());
  });
}

// Realtime購読を解除
function stopRealtime(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

// 拡張機能を無効化した際のクリーンアップ
export function deactivate() {
  stopRealtime();
}
