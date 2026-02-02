// 状態をUIに反映する共通関数（vscode 依存はここに集約）
import * as vscode from 'vscode';
import { TeamStateManager } from '../services/teamStateManager';
import { TeamSyncSidebarProvider } from './sidebarProvider';

// 現在の状態をサイドバーとコンテキストキーに一括反映
export function syncUI(state: TeamStateManager, sidebar: TeamSyncSidebarProvider): void {
  // コンテキストキー更新
  vscode.commands.executeCommand('setContext', 'teamSync.loggedIn', state.isLoggedIn());
  vscode.commands.executeCommand('setContext', 'teamSync.hasTeam', state.getTeamId() !== null);

  // サイドバー更新
  sidebar.setLoginState(state.isLoggedIn());
  sidebar.setTeam(state.getTeamName());
  sidebar.setMembers(state.getMembers());

  // ビュータイトルをチーム名に動的変更
  sidebar.setTitle(state.getTeamName() || 'メンバー');
}
