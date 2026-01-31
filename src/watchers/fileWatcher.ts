// 編集中のファイルが変わったら自動で通知する機能
import * as vscode from 'vscode';
import { updateActivity } from '../services/activityService';
import { TeamStateManager } from '../services/teamStateManager';

export function startFileWatcher(context: vscode.ExtensionContext, state: TeamStateManager): void {
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      const memberId = state.getMemberId();
      const teamId = state.getTeamId();
      if (editor && memberId && teamId) {
        const filePath = vscode.workspace.asRelativePath(editor.document.fileName);
        updateActivity(memberId, teamId, filePath).catch(console.error);
      }
    })
  );
}
