// 状態をUIに反映する共通関数（vscode 依存はここに集約）
import * as vscode from 'vscode';
import { TeamStateManager } from '../services/teamStateManager';
import { TeamSyncSidebarProvider } from './sidebarProvider';

// 現在の状態をサイドバーとコンテキストキーに一括反映
export function syncUI(state: TeamStateManager, sidebar: TeamSyncSidebarProvider): void {
  // コンテキストキー更新（コマンドパレットの when 句で使用）
  vscode.commands.executeCommand('setContext', 'teamSync.loggedIn', state.isLoggedIn());
  vscode.commands.executeCommand('setContext', 'teamSync.hasTeam', state.getTeamId() !== null);

  // Webview に状態を送信
  sidebar.updateState({
    isLoggedIn: state.isLoggedIn(),
    teamName: state.getTeamName(),
    members: state.getMembers(),
    currentMemberId: state.getMemberId(),
    inviteCode: state.getInviteCode(),
  });

  // ビュータイトルをチーム名に動的変更
  sidebar.setTitle(state.getTeamName() || 'メンバー');
}
