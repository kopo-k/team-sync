import * as vscode from 'vscode';
import { signInWithGitHub, signOut, getCurrentUser } from '../services/authService';
import { getMyTeam, getMyMember } from '../services/teamService';
import { getTeamActivities } from '../services/activityService';
import { TeamSyncSidebarProvider } from '../views/sidebarProvider';
import { setCurrentMember } from '../watchers/fileWatcher';

export async function loginCommand(sidebarProvider: TeamSyncSidebarProvider): Promise<void> {
  try {
    vscode.window.showInformationMessage('ブラウザでGitHub認証を行ってください...');
    await signInWithGitHub();

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
    }

    // メンバーIDを設定
    const member = await getMyMember();
    if (member) {
      setCurrentMember(member.id);
    }

    vscode.window.showInformationMessage(`ログインしました: ${username}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ログインに失敗しました';
    vscode.window.showErrorMessage(message);
  }
}

export async function logoutCommand(sidebarProvider: TeamSyncSidebarProvider): Promise<void> {
  try {
    await signOut();
    sidebarProvider.setLoginState(false);
    sidebarProvider.setTeam(null);
    vscode.window.showInformationMessage('ログアウトしました');
  } catch (error) {
    vscode.window.showErrorMessage('ログアウトに失敗しました');
  }
}
