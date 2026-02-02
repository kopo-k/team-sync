import * as vscode from 'vscode';
import { MemberWithActivity } from '../types';

export class TeamSyncSidebarProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  // クラス内部でのみ
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private _treeView: vscode.TreeView<vscode.TreeItem> | null = null;
  private isLoggedIn = false;
  private teamName: string | null = null;
  private members: MemberWithActivity[] = [];

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  // TreeViewの参照を保持（タイトル変更用）
  setTreeView(treeView: vscode.TreeView<vscode.TreeItem>): void {
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

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  //サイドバーを開いた瞬間に呼ばれる
  //refresh()が呼ばれたときにも呼ばれる
  getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
    // チーム招待セクションの子要素
    if (element instanceof InviteSectionItem) {
      return [
        new InviteDescriptionItem(),
        new InviteActionItem(),
      ];
    }

    // その他の親要素は子なし
    if (element) {
      return [];
    }

    // ルートレベル: 未ログイン・チーム未参加時は空配列
    // → package.json の viewsWelcome でボタンを表示する
    if (!this.isLoggedIn || !this.teamName) {
      return [];
    }

    // メンバー一覧 + チーム招待セクション
    const items: vscode.TreeItem[] = this.members.map(member => new MemberItem(member));
    items.push(new InviteSectionItem());
    return items;
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

// チーム招待セクションヘッダー（折りたたみ可能、初期表示は展開）
class InviteSectionItem extends vscode.TreeItem {
  constructor() {
    super('チーム招待', vscode.TreeItemCollapsibleState.Expanded);
    this.id = 'invite-section';
    this.iconPath = new vscode.ThemeIcon('person-add');
  }
}

// 招待の説明文（クリック不可）
class InviteDescriptionItem extends vscode.TreeItem {
  constructor() {
    super('招待コードを共有してメンバーを招待できます');
    this.id = 'invite-description';
  }
}

// 招待コードコピーアクション（クリックでコピー）
class InviteActionItem extends vscode.TreeItem {
  constructor() {
    super('招待コードをコピー');
    this.id = 'invite-action';
    this.iconPath = new vscode.ThemeIcon('copy');
    this.tooltip = 'クリックして招待コードをクリップボードにコピーします';
    this.command = {
      command: 'team-sync.copyInviteCode',
      title: '招待コードをコピー',
    };
  }
}
