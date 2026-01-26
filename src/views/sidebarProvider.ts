import * as vscode from 'vscode';
import { MemberWithActivity } from '../types';

export class TeamSyncSidebarProvider implements vscode.TreeDataProvider<MemberItem> {
  // 通知を発信する装置（内部用）
  private _onDidChangeTreeData = new vscode.EventEmitter<MemberItem | undefined>();
  // 外部（VS Code）が監視するイベント（公開用）
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private members: MemberWithActivity[] = [];

  refresh(members: MemberWithActivity[]): void {
    this.members = members;
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: MemberItem): vscode.TreeItem {
    return element;
  }

  getChildren(): MemberItem[] {
    return this.members.map(member => new MemberItem(member));
  }
}

class MemberItem extends vscode.TreeItem {
  constructor(member: MemberWithActivity) {
    const label = member.github_username;
    super(label, vscode.TreeItemCollapsibleState.None);

    this.description = member.activity?.file_path ?? '作業なし';
    this.tooltip = member.activity?.status_message ?? '';
    this.iconPath = vscode.Uri.parse(member.avatar_url);
  }
}
