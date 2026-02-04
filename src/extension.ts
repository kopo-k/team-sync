import * as vscode from 'vscode';
import { TeamStateManager } from './services/teamStateManager';
import { subscribeToActivities, updateActivity } from './services/activityService';
import { loginCommand, logoutCommand, restoreLoginState } from './commands/auth';
import { createTeamCommand, joinTeamCommand, leaveTeamCommand } from './commands/team';
import { setStatusCommand } from './commands/status';
import { TeamSyncSidebarProvider, WebviewMessage } from './views/sidebarProvider';
import { syncUI } from './views/syncUI';
import { checkFileConflicts } from './views/conflictWarning';
import { startFileWatcher } from './watchers/fileWatcher';

let state: TeamStateManager;
let sidebarProvider: TeamSyncSidebarProvider;
let unsubscribe: (() => void) | null = null;

export async function activate(context: vscode.ExtensionContext) {
  // 状態管理
  state = new TeamStateManager();

  // サイドバー（Webview）
  sidebarProvider = new TeamSyncSidebarProvider(handleWebviewMessage);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('teamSyncSidebar', sidebarProvider)
  );

  // 起動時にセッション復元
  await restoreLoginState(state, sidebarProvider);
  startRealtime();

  // コマンド登録（コマンドパレット + view/title メニュー用）
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
    // 招待コードをクリップボードにコピー
    vscode.commands.registerCommand('team-sync.copyInviteCode', async () => {
      const inviteCode = state.getInviteCode();
      if (inviteCode) {
        await vscode.env.clipboard.writeText(inviteCode);
        vscode.window.showInformationMessage('招待コードをクリップボードにコピーしました');
      }
    }),
  );

  // ファイル監視開始
  startFileWatcher(context, state);
}

// Webview → Extension のメッセージハンドラ
async function handleWebviewMessage(message: WebviewMessage): Promise<void> {
  switch (message.type) {
    // 既存コマンドに委譲
    case 'login':
      await vscode.commands.executeCommand('team-sync.login');
      break;
    case 'createTeam':
      await vscode.commands.executeCommand('team-sync.createTeam');
      break;
    case 'joinTeam':
      await vscode.commands.executeCommand('team-sync.joinTeam');
      break;
    case 'leaveTeam':
      await vscode.commands.executeCommand('team-sync.leaveTeam');
      break;
    case 'logout':
      await vscode.commands.executeCommand('team-sync.logout');
      break;
    case 'copyInviteCode':
      await vscode.commands.executeCommand('team-sync.copyInviteCode');
      break;

    // Webview 内のインライン編集から直接 DB 更新
    case 'saveStatus': {
      // 型と長さの検証
      if (typeof message.status !== 'string' || message.status.length > 500) {
        break;
      }
      const memberId = state.getMemberId();
      const teamId = state.getTeamId();
      if (!memberId || !teamId) { break; }
      const editor = vscode.window.activeTextEditor;
      const filePath = editor
        ? vscode.workspace.asRelativePath(editor.document.fileName)
        : '';
      await updateActivity(memberId, teamId, filePath, message.status);
      break;
    }
  }
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
