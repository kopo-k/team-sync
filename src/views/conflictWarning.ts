// 同一ファイル編集の警告表示
import * as vscode from 'vscode';
import { MemberWithActivity } from '../types';

export function checkFileConflicts(members: MemberWithActivity[], myMemberId: string | null): void {
  const absolutePath = vscode.window.activeTextEditor?.document.fileName;
  if (!absolutePath || !myMemberId) { return; }

  // DBには相対パスで保存されているので、比較用に変換
  const myFile = vscode.workspace.asRelativePath(absolutePath);

  const others = members.filter(
    m => m.id !== myMemberId && m.activity?.file_path === myFile
  );
  for (const other of others) {
    vscode.window.showWarningMessage(
      `${other.github_username} さんが ${myFile.split('/').pop()} を編集中です`
    );
  }
}
