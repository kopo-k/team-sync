import * as vscode from 'vscode';
import { createTeam, joinTeam, leaveTeam, getMyMember } from '../services/teamService';
import { getTeamActivities } from '../services/activityService';
import { TeamStateManager } from '../services/teamStateManager';
import { TeamSyncSidebarProvider } from '../views/sidebarProvider';
import { syncUI } from '../views/syncUI';

export async function createTeamCommand(state: TeamStateManager, sidebar: TeamSyncSidebarProvider): Promise<void> {
  const name = await vscode.window.showInputBox({
    prompt: 'チーム名を入力してください',
    placeHolder: 'My Team',
  });

  if (!name) {
    return;
  }

  try {
    const team = await createTeam(name);
    if (team) {
      // 状態更新
      state.setTeam(team.id, team.name, team.invite_code);
      const member = await getMyMember(team.id);
      if (member) {
        state.setMemberId(member.id);
      }
      const activities = await getTeamActivities(team.id);
      state.setMembers(activities);

      // UI反映
      syncUI(state, sidebar);

      vscode.window.showInformationMessage(
        `チーム「${team.name}」を作成しました\n招待コード: ${team.invite_code}`
      );
      // 招待コードをクリップボードにコピー
      await vscode.env.clipboard.writeText(team.invite_code);
      vscode.window.showInformationMessage('招待コードをクリップボードにコピーしました');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'チームの作成に失敗しました';
    vscode.window.showErrorMessage(message);
  }
}

export async function joinTeamCommand(state: TeamStateManager, sidebar: TeamSyncSidebarProvider): Promise<void> {
  const code = await vscode.window.showInputBox({
    prompt: '招待コードを入力してください',
    placeHolder: 'XXXX-XXXX',
  });

  if (!code) {
    return;
  }

  try {
    const team = await joinTeam(code);
    if (team) {
      // 状態更新
      state.setTeam(team.id, team.name, team.invite_code);
      const member = await getMyMember(team.id);
      if (member) {
        state.setMemberId(member.id);
      }
      const activities = await getTeamActivities(team.id);
      state.setMembers(activities);

      // UI反映
      syncUI(state, sidebar);

      vscode.window.showInformationMessage(`チーム「${team.name}」に参加しました`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'チームへの参加に失敗しました';
    vscode.window.showErrorMessage(message);
  }
}

export async function leaveTeamCommand(state: TeamStateManager, sidebar: TeamSyncSidebarProvider): Promise<void> {
  // 現在のチーム名を状態から取得
  const teamId = state.getTeamId();
  const teamName = state.getTeamName();
  if (!teamId || !teamName) {
    vscode.window.showErrorMessage('チームに参加していません');
    return;
  }

  // 確認ダイアログ
  const confirm = await vscode.window.showWarningMessage(
    `チーム「${teamName}」から退出しますか？`,
    { modal: true },
    '退出する'
  );

  if (confirm !== '退出する') {
    return;
  }

  try {
    await leaveTeam(teamId);

    // 状態更新
    state.clearTeam();

    // UI反映
    syncUI(state, sidebar);

    vscode.window.showInformationMessage(`チーム「${teamName}」から退出しました`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'チームの退出に失敗しました';
    vscode.window.showErrorMessage(message);
  }
}
