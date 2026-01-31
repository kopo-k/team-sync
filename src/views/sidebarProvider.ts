import * as vscode from 'vscode';
import { MemberWithActivity } from '../types';

type TreeItem = StatusItem | MemberItem;

export class TeamSyncSidebarProvider implements vscode.TreeDataProvider<TreeItem> {
  // クラス内部でのみ
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private isLoggedIn = false;
  private currentUser: { username: string; avatarUrl: string } | null = null;
  private teamName: string | null = null;
  private members: MemberWithActivity[] = [];

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  // ログイン状態の設定
  setLoginState(isLoggedIn: boolean, user?: { username: string; avatarUrl: string }): void {
    this.isLoggedIn = isLoggedIn;
    this.currentUser = user || null;
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


  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  //サイドバーを開いた瞬間に呼ばれる
  //refresh()が呼ばれたときにも呼ばれる
  getChildren(): TreeItem[] {
    // 未ログイン・チーム未参加時は空配列を返す
    // → package.json の viewsWelcome でボタンを表示する
    if (!this.isLoggedIn) {
      return [];
    }

    if (!this.teamName) {
      return [];
    }

    const items: TreeItem[] = [];

    // ユーザー情報があれば表示
    if (this.currentUser) {
      items.push(new StatusItem(
        this.currentUser.username,
        'ログイン中',
        'account',
        this.currentUser.avatarUrl
      ));
    }

    items.push(new StatusItem(this.teamName, 'チーム', 'organization'));

    // メンバー一覧
    if (this.members.length === 0) {
      items.push(new StatusItem('メンバーなし', '', 'info'));
    } else {
      this.members.forEach(member => {
        items.push(new MemberItem(member));
      });
    }

    return items;
  }
}

class StatusItem extends vscode.TreeItem {
  constructor(
    label: string,
    description: string,
    icon: string,
    avatarUrl?: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    if (avatarUrl) {
      this.iconPath = vscode.Uri.parse(avatarUrl);
    } else {
      this.iconPath = new vscode.ThemeIcon(icon);
    }
  }
}

class MemberItem extends vscode.TreeItem {
  constructor(member: MemberWithActivity) {
    super(member.github_username, vscode.TreeItemCollapsibleState.None);

    const filePath = member.activity?.file_path;

    this.description = filePath ?? '作業なし';
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
