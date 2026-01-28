import * as vscode from 'vscode';
import { createTeam, joinTeam } from '../services/teamService';
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
      vscode.window.showInformationMessage(`チーム「${team.name}」に参加しました`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'チームへの参加に失敗しました';
    vscode.window.showErrorMessage(message);
  }
}
