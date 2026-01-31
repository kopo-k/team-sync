import * as vscode from 'vscode';
import { updateActivity } from '../services/activityService';
import { TeamStateManager } from '../services/teamStateManager';

export async function setStatusCommand(state: TeamStateManager): Promise<void> {
  const memberId = state.getMemberId();
  const teamId = state.getTeamId();
  if (!memberId || !teamId) {
    return;
  }

  const status = await vscode.window.showInputBox({
    prompt: '現在の作業内容を入力してください',
    placeHolder: '例: ログイン機能を実装中',
  });

  if (!status) { // statusが空またはundefinedなら何もしない
    return;
  }

  try {
    const editor = vscode.window.activeTextEditor;
    const filePath = editor ? vscode.workspace.asRelativePath(editor.document.fileName) : '';
    // 現在作業しているファイルパスを取得
    await updateActivity(memberId, teamId, filePath, status);
    vscode.window.showInformationMessage('ステータスを更新しました');
  } catch (error) {
    vscode.window.showErrorMessage('ステータスの更新に失敗しました');
  }
}
