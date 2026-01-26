import * as vscode from 'vscode';
import * as http from 'http';
import { getSupabaseClient } from './supabase';
import { URL } from 'url';

const CALLBACK_PORT = 54321;
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}/callback`;

export async function signInWithGitHub(): Promise<boolean> {
  const supabase = getSupabaseClient();

  return new Promise((resolve, reject) => {
    // ローカルサーバーを起動してコールバックを待つ
    const server = http.createServer(async (req, res) => {
      if (!req.url?.startsWith('/callback')) {
        res.writeHead(404);
        res.end();
        return;
      }
      

      try {
        const url = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
        const code = url.searchParams.get('code');

        if (code) {
          // 認証コードをセッションに交換
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }

          // 成功レスポンス
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <html>
              <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                <h1>認証成功!</h1>
                <p>VS Codeに戻ってください。このウィンドウは閉じて構いません。</p>
              </body>
            </html>
          `);

          server.close();
          resolve(true);
        } else {
          throw new Error('認証コードがありません');
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html>
            <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
              <h1>認証失敗</h1>
              <p>エラーが発生しました。VS Codeで再度お試しください。</p>
            </body>
          </html>
        `);
        server.close();
        reject(error);
      }
    });

    server.listen(CALLBACK_PORT, async () => {
      // OAuth URLを生成してブラウザで開く
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: REDIRECT_URI,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        server.close();
        reject(new Error('OAuth URL の生成に失敗しました'));
        return;
      }

      await vscode.env.openExternal(vscode.Uri.parse(data.url));
    });

    // タイムアウト（2分）
    setTimeout(() => {
      server.close();
      reject(new Error('認証がタイムアウトしました'));
    }, 120000);
  });
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
