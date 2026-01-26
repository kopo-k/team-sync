import * as vscode from 'vscode';
import { updateActivity } from '../services/activityService';

export async function setStatusCommand(memberId: string): Promise<void> {
  const status = await vscode.window.showInputBox({
    prompt: '現在の作業内容を入力してください',
    placeHolder: '例: ログイン機能を実装中',
  });

  if (!status) { // statusが空またはundefinedなら何もしない
    return;
  }

  try {
    const editor = vscode.window.activeTextEditor;
    const filePath = editor?.document.fileName ?? '';
    // 現在作業しているファイルパスを取得
    await updateActivity(memberId, filePath, status);
    vscode.window.showInformationMessage('ステータスを更新しました');
  } catch (error) {
    vscode.window.showErrorMessage('ステータスの更新に失敗しました');
  }
}
