import * as vscode from 'vscode';
import { createTeam, joinTeam } from '../services/teamService';

export async function createTeamCommand(): Promise<void> {
  const name = await vscode.window.showInputBox({
    prompt: 'チーム名を入力してください',
    placeHolder: 'My Team',
  });

  if (!name) {// nameが空またはundefinedなら何もしない
    return;
  }

  try {
    const team = await createTeam(name);
    if (team) {
      vscode.window.showInformationMessage(`チーム「${name}」を作成しました`);
    }
  } catch (error) {
    vscode.window.showErrorMessage('チームの作成に失敗しました');
  }
}

export async function joinTeamCommand(): Promise<void> {
  const code = await vscode.window.showInputBox({
    prompt: '招待コードを入力してください',
    placeHolder: 'XXXX-XXXX',
  });

  if (!code) { // codeが空またはundefinedなら何もしない
    return;
  }

  try {
    const success = await joinTeam(code);
    if (success) {
      vscode.window.showInformationMessage('チームに参加しました');
    }
  } catch (error) {
    vscode.window.showErrorMessage('チームへの参加に失敗しました');
  }
}
