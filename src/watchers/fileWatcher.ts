// 編集中のファイルが変わったら自動で通知する機能
import * as vscode from 'vscode';
import { updateActivity } from '../services/activityService';
// 現在アクティブなメンバーID・チームIDを保持する変数
let currentMemberId: string | null = null;
let currentTeamId: string | null = null;

// ログイン時に現在のメンバーIDを設定する関数
export function setCurrentMember(memberId: string): void {
  currentMemberId = memberId;
}

// チーム参加・退出時に現在のチームIDを設定する関数
export function setCurrentTeam(teamId: string | null): void {
  currentTeamId = teamId;
}

export function startFileWatcher(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && currentMemberId && currentTeamId) {
        const filePath = vscode.workspace.asRelativePath(editor.document.fileName);
        updateActivity(currentMemberId, currentTeamId, filePath).catch(console.error);
      }
    })
  );
}
