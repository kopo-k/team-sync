// 編集中のファイルが変わったら自動で通知する機能
import * as vscode from 'vscode';
import { updateActivity } from '../services/activityService';
// 現在アクティブなメンバーIDを保持する変数
let currentMemberId: string | null = null;

// ログイン時に現在のメンバーIDを設定する関数
export function setCurrentMember(memberId: string): void {
  currentMemberId = memberId;
}

export function startFileWatcher(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && currentMemberId) {
        const filePath = vscode.workspace.asRelativePath(editor.document.fileName);
        updateActivity(currentMemberId, filePath);
      }
    })
  );
}
