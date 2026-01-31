import * as vscode from 'vscode';
import { createTeam, joinTeam, leaveTeam, getMyTeam } from '../services/teamService';
import { getTeamActivities } from '../services/activityService';
import { TeamSyncSidebarProvider } from '../views/sidebarProvider';

export async function createTeamCommand(sidebarProvider: TeamSyncSidebarProvider): Promise<void> {
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
      sidebarProvider.setTeam(team.name);

      // メンバーの作業状況を取得してサイドバーに表示
      const activities = await getTeamActivities(team.id);
      sidebarProvider.setMembers(activities);

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

export async function joinTeamCommand(sidebarProvider: TeamSyncSidebarProvider): Promise<void> {
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
      sidebarProvider.setTeam(team.name);

      // メンバーの作業状況を取得してサイドバーに表示
      const activities = await getTeamActivities(team.id);
      sidebarProvider.setMembers(activities);

      vscode.window.showInformationMessage(`チーム「${team.name}」に参加しました`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'チームへの参加に失敗しました';
    vscode.window.showErrorMessage(message);
  }
}

export async function leaveTeamCommand(sidebarProvider: TeamSyncSidebarProvider): Promise<void> {
  // 現在のチームを取得
  const team = await getMyTeam();
  if (!team) {
    vscode.window.showErrorMessage('チームに参加していません');
    return;
  }

  // 確認ダイアログ
  const confirm = await vscode.window.showWarningMessage(
    `チーム「${team.name}」から退出しますか？`,
    { modal: true },
    '退出する'
  );

  if (confirm !== '退出する') {
    return;
  }

  try {
    await leaveTeam(team.id);
    sidebarProvider.setTeam(null);
    sidebarProvider.setMembers([]);
    vscode.window.showInformationMessage(`チーム「${team.name}」から退出しました`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'チームの退出に失敗しました';
    vscode.window.showErrorMessage(message);
  }
}
