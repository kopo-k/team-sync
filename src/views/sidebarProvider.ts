import * as vscode from 'vscode';
import { MemberWithActivity } from '../types';

// Webview に送信する状態
export interface SidebarState {
  isLoggedIn: boolean;
  teamName: string | null;
  members: MemberWithActivity[];
  currentMemberId: string | null;
  inviteCode: string | null;
}

// Webview → Extension のメッセージ型
export type WebviewMessage =
  | { type: 'login' }
  | { type: 'createTeam' }
  | { type: 'joinTeam' }
  | { type: 'leaveTeam' }
  | { type: 'logout' }
  | { type: 'saveStatus'; status: string }
  | { type: 'copyInviteCode' };

export class TeamSyncSidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _lastState: SidebarState = {
    isLoggedIn: false,
    teamName: null,
    members: [],
    currentMemberId: null,
    inviteCode: null,
  };

  constructor(private _onMessage: (message: WebviewMessage) => void) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this._getHtml(webviewView.webview);

    // Webview → Extension のメッセージ受信
    webviewView.webview.onDidReceiveMessage((message) => {
      // Webview の JS が読み込まれたら状態を送信
      if (message.type === 'ready') {
        this.updateState(this._lastState);
        return;
      }
      this._onMessage(message);
    });
  }

  // ビューのタイトルを動的に変更
  setTitle(title: string): void {
    if (this._view) {
      this._view.title = title;
    }
  }

  // Webview に状態を送信
  updateState(data: SidebarState): void {
    this._lastState = data;
    this._view?.webview.postMessage({ type: 'update', ...data });
  }

  private _getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style nonce="${nonce}">${getStyles()}</style>
</head>
<body>
${getBody()}
  <script nonce="${nonce}">${getScript()}</script>
</body>
</html>`;
  }
}

// ランダムな nonce を生成（CSP 用）
function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function getStyles(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: transparent;
    }

    /* Welcome 画面 */
    .welcome {
      padding: 20px 16px;
      display: none;
    }
    .welcome p {
      margin-bottom: 12px;
      text-align: center;
    }

    /* ボタン */
    button {
      display: block;
      width: 100%;
      padding: 6px 14px;
      margin-bottom: 6px;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-size: var(--vscode-font-size);
      font-family: var(--vscode-font-family);
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    button.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    button.secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }

    /* メンバーヘッダー行 */
    .member-header {
      display: flex;
      align-items: center;
      padding: 4px 12px;
      cursor: pointer;
      user-select: none;
    }
    .member-header:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .arrow {
      width: 16px;
      font-size: 10px;
      flex-shrink: 0;
      text-align: center;
    }
    .avatar {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      margin-right: 6px;
      flex-shrink: 0;
    }
    .username {
      margin-right: 8px;
      white-space: nowrap;
    }
    .file-path {
      color: var(--vscode-descriptionForeground);
      font-size: 0.9em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* アコーディオン詳細 */
    .member-detail {
      padding: 4px 12px 8px 34px;
    }
    .status-label {
      color: var(--vscode-descriptionForeground);
      font-size: 0.85em;
      margin-bottom: 2px;
    }
    .status-value {
      margin-bottom: 8px;
    }

    /* テキスト入力 */
    input[type="text"] {
      width: 100%;
      padding: 4px 8px;
      margin-bottom: 8px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, transparent);
      border-radius: 2px;
      font-size: var(--vscode-font-size);
      font-family: var(--vscode-font-family);
      outline: none;
    }
    input[type="text"]:focus {
      border-color: var(--vscode-focusBorder);
    }

    /* 招待セクション */
    .invite-section {
      padding: 12px;
      margin-top: 8px;
      border-top: 1px solid var(--vscode-widget-border, transparent);
    }
    .invite-title {
      font-size: 0.8em;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
    }
    .invite-description {
      font-size: 0.9em;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
    }

    #view-main { display: none; }
  `;
}

function getBody(): string {
  return `
  <!-- ログイン画面 -->
  <div id="view-login" class="welcome">
    <p>TeamSync を始めましょう。</p>
    <button id="btn-login">ログイン</button>
  </div>

  <!-- チーム参加画面 -->
  <div id="view-team" class="welcome">
    <p>チームに参加して始めましょう。</p>
    <button id="btn-create-team">チームを作成</button>
    <button id="btn-join-team" class="secondary">チームに参加</button>
  </div>

  <!-- メイン画面 -->
  <div id="view-main">
    <div id="members-list"></div>
    <div class="invite-section">
      <div class="invite-title">チーム招待</div>
      <p class="invite-description">招待コードを共有してメンバーを招待できます</p>
      <button id="btn-copy-invite">招待コードをコピー</button>
    </div>
  </div>
  `;
}

function getScript(): string {
  return `
    const vscode = acquireVsCodeApi();

    let currentState = {
      isLoggedIn: false,
      teamName: null,
      members: [],
      currentMemberId: null,
      inviteCode: null,
    };
    let openMemberId = null;
    let editingStatus = false;

    // ボタンイベント
    document.getElementById('btn-login').addEventListener('click', () => {
      vscode.postMessage({ type: 'login' });
    });
    document.getElementById('btn-create-team').addEventListener('click', () => {
      vscode.postMessage({ type: 'createTeam' });
    });
    document.getElementById('btn-join-team').addEventListener('click', () => {
      vscode.postMessage({ type: 'joinTeam' });
    });
    document.getElementById('btn-copy-invite').addEventListener('click', () => {
      vscode.postMessage({ type: 'copyInviteCode' });
    });

    // Extension → Webview のメッセージ受信
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'update') {
        currentState = message;
        render();
      }
    });

    function render() {
      const { isLoggedIn, teamName, members, currentMemberId } = currentState;

      // 画面切り替え
      document.getElementById('view-login').style.display =
        !isLoggedIn ? 'block' : 'none';
      document.getElementById('view-team').style.display =
        isLoggedIn && !teamName ? 'block' : 'none';
      document.getElementById('view-main').style.display =
        isLoggedIn && teamName ? 'block' : 'none';

      if (!members || !teamName) return;

      // メンバーリスト描画
      const list = document.getElementById('members-list');
      list.innerHTML = '';

      members.forEach((member) => {
        const isMe = member.id === currentMemberId;
        const isOpen = openMemberId === member.id;
        const filePath = member.activity ? member.activity.file_path : null;
        const statusMessage = member.activity ? member.activity.status_message : null;

        const el = document.createElement('div');

        // ── ヘッダー行 ──
        const header = document.createElement('div');
        header.className = 'member-header';

        const arrow = document.createElement('span');
        arrow.className = 'arrow';
        arrow.textContent = isOpen ? '▼' : '▶';
        header.appendChild(arrow);

        if (member.avatar_url) {
          const img = document.createElement('img');
          img.className = 'avatar';
          img.src = member.avatar_url;
          header.appendChild(img);
        }

        const name = document.createElement('span');
        name.className = 'username';
        name.textContent = member.github_username;
        header.appendChild(name);

        const desc = document.createElement('span');
        desc.className = 'file-path';
        desc.textContent = filePath ? '作業中: ' + filePath : '作業なし';
        header.appendChild(desc);

        header.addEventListener('click', () => {
          openMemberId = isOpen ? null : member.id;
          editingStatus = false;
          render();
        });
        el.appendChild(header);

        // ── アコーディオン詳細 ──
        if (isOpen) {
          const detail = document.createElement('div');
          detail.className = 'member-detail';

          if (isMe && editingStatus) {
            // 編集モード
            const input = document.createElement('input');
            input.type = 'text';
            input.value = statusMessage || '';
            input.placeholder = '作業内容を入力...';
            input.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') { saveStatus(input.value, member); }
            });
            detail.appendChild(input);

            const saveBtn = document.createElement('button');
            saveBtn.textContent = '保存';
            saveBtn.addEventListener('click', () => {
              saveStatus(input.value, member);
            });
            detail.appendChild(saveBtn);

            setTimeout(() => input.focus(), 0);
          } else {
            // 表示モード
            const label = document.createElement('div');
            label.className = 'status-label';
            label.textContent = '作業内容:';
            detail.appendChild(label);

            const value = document.createElement('div');
            value.className = 'status-value';
            value.textContent = statusMessage || '未設定';
            detail.appendChild(value);

            if (isMe) {
              const editBtn = document.createElement('button');
              editBtn.className = 'secondary';
              editBtn.textContent = '編集';
              editBtn.addEventListener('click', () => {
                editingStatus = true;
                render();
              });
              detail.appendChild(editBtn);
            }
          }

          el.appendChild(detail);
        }

        list.appendChild(el);
      });
    }

    // ステータス保存（楽観的更新 + Extension に通知）
    function saveStatus(status, member) {
      if (member.activity) {
        member.activity.status_message = status;
      }
      vscode.postMessage({ type: 'saveStatus', status: status });
      editingStatus = false;
      render();
    }

    // Extension に準備完了を通知（状態復元のトリガー）
    vscode.postMessage({ type: 'ready' });
  `;
}
