import * as vscode from 'vscode';
import { MemberWithActivity } from '../types';

export class TeamSyncSidebarProvider implements vscode.TreeDataProvider<MemberItem> {
  // クラス内部でのみ
  private _onDidChangeTreeData = new vscode.EventEmitter<MemberItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private _treeView: vscode.TreeView<MemberItem> | null = null;
  private isLoggedIn = false;
  private teamName: string | null = null;
  private members: MemberWithActivity[] = [];

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  // TreeViewの参照を保持（タイトル変更用）
  setTreeView(treeView: vscode.TreeView<MemberItem>): void {
    this._treeView = treeView;
  }

  // ビューのタイトルを動的に変更
  setTitle(title: string): void {
    if (this._treeView) {
      this._treeView.title = title;
    }
  }

  // ログイン状態の設定
  setLoginState(isLoggedIn: boolean): void {
    this.isLoggedIn = isLoggedIn;
    this.refresh();
  }

  // チーム名の設定
  setTeam(teamName: string | null): void {
    this.teamName = teamName;
    this.refresh();
  }

  // メンバー一覧の設定
  setMembers(members: MemberWithActivity[]): void {
    this.members = members;
    this.refresh();
  }


  getTreeItem(element: MemberItem): vscode.TreeItem {
    return element;
  }

  //サイドバーを開いた瞬間に呼ばれる
  //refresh()が呼ばれたときにも呼ばれる
  getChildren(): MemberItem[] {
    // 未ログイン・チーム未参加時は空配列を返す
    // → package.json の viewsWelcome でボタンを表示する
    if (!this.isLoggedIn || !this.teamName) {
      return [];
    }

    // メンバー一覧のみ返す
    return this.members.map(member => new MemberItem(member));
  }
}

class MemberItem extends vscode.TreeItem {
  constructor(member: MemberWithActivity) {
    super(member.github_username, vscode.TreeItemCollapsibleState.None);

    const filePath = member.activity?.file_path;

    this.description = filePath ? `作業中: ${filePath}` : '作業なし';
    this.tooltip = new vscode.MarkdownString();
    this.tooltip.appendMarkdown(`**${member.github_username}**\n\n`);
    if (member.activity?.status_message) {
      this.tooltip.appendMarkdown(`💬 ${member.activity.status_message}\n\n`);
    }
    if (filePath) {
      this.tooltip.appendMarkdown(`📁 ${filePath}`);
    }

    if (member.avatar_url) {
      this.iconPath = vscode.Uri.parse(member.avatar_url);
    } else {
      this.iconPath = new vscode.ThemeIcon('account');
    }
  }
}
