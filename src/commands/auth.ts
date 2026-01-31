import * as vscode from 'vscode';
import { signInWithGitHub, signOut, getSession, getUserInfo } from '../services/authService';
import { getMyTeam, getMyMember } from '../services/teamService';
import { getTeamActivities } from '../services/activityService';
import { TeamStateManager } from '../services/teamStateManager';
import { TeamSyncSidebarProvider } from '../views/sidebarProvider';
import { syncUI } from '../views/syncUI';
import { setCurrentMember, setCurrentTeam } from '../watchers/fileWatcher';

// ログイン済みセッションの状態を復元する共通処理
// loginCommand と restoreLoginState の両方で使う
async function setupLoggedInState(state: TeamStateManager, sidebar: TeamSyncSidebarProvider): Promise<void> {
  const userInfo = await getUserInfo();
  if (!userInfo) { return; }

  // 状態更新
  state.setLoggedIn(userInfo.username, userInfo.avatarUrl);

  // チーム情報も確認
  const team = await getMyTeam();
  if (team) {
    state.setTeam(team.id, team.name);
    setCurrentTeam(team.id);
    const activities = await getTeamActivities(team.id);
    state.setMembers(activities);
  }

  // メンバーIDを設定
  const member = await getMyMember();
  if (member) {
    state.setMemberId(member.id);
    setCurrentMember(member.id);
  }

  // UI反映
  syncUI(state, sidebar);
}

// 起動時のセッション復元（extension.ts から呼ばれる）
export async function restoreLoginState(state: TeamStateManager, sidebar: TeamSyncSidebarProvider): Promise<void> {
  const session = await getSession();
  if (session) {
    await setupLoggedInState(state, sidebar);
  } else {
    syncUI(state, sidebar);
  }
}

export async function loginCommand(state: TeamStateManager, sidebar: TeamSyncSidebarProvider): Promise<void> {
  try {
    vscode.window.showInformationMessage('ブラウザでGitHub認証を行ってください...');
    await signInWithGitHub();
    await setupLoggedInState(state, sidebar);

    const username = state.getUsername();
    vscode.window.showInformationMessage(`ログインしました: ${username}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ログインに失敗しました';
    vscode.window.showErrorMessage(message);
  }
}

export async function logoutCommand(state: TeamStateManager, sidebar: TeamSyncSidebarProvider): Promise<void> {
  try {
    await signOut();
    state.reset();
    syncUI(state, sidebar);
    vscode.window.showInformationMessage('ログアウトしました');
  } catch (error) {
    vscode.window.showErrorMessage('ログアウトに失敗しました');
  }
}
