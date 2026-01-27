import * as vscode from 'vscode';
import * as http from 'http';
import { getSupabaseClient } from './supabase';
import { URL } from 'url';

const CALLBACK_PORT = 54321;
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}/callback`;

export async function signInWithGitHub(): Promise<boolean> {
  const supabase = getSupabaseClient();

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${CALLBACK_PORT}`);

      // /complete エンドポイント（フラグメントからトークンを受け取る）
      if (url.pathname === '/complete') {
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');

        if (accessToken) {
          try {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            res.writeHead(200);
            res.end('OK');
            server.close();
            resolve(true);
          } catch (error) {
            res.writeHead(500);
            res.end('Error');
            server.close();
            reject(error);
          }
        }
        return;
      }

      // /callback エンドポイント
      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');

        if (code) {
          // PKCEフローの認証コード
          try {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              throw error;
            }
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
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <html>
                <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                  <h1>認証失敗</h1>
                  <p>エラーが発生しました。</p>
                </body>
              </html>
            `);
            server.close();
            reject(error);
          }
        } else {
          // ハッシュフラグメントで返された場合
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <html>
              <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                <h1>処理中...</h1>
                <script>
                  const hash = window.location.hash.substring(1);
                  const params = new URLSearchParams(hash);
                  const accessToken = params.get('access_token');
                  const refreshToken = params.get('refresh_token');

                  if (accessToken) {
                    fetch('/complete?access_token=' + encodeURIComponent(accessToken) + '&refresh_token=' + encodeURIComponent(refreshToken || ''))
                      .then(() => {
                        document.body.innerHTML = '<h1>認証成功!</h1><p>VS Codeに戻ってください。このウィンドウは閉じて構いません。</p>';
                      });
                  } else {
                    document.body.innerHTML = '<h1>認証失敗</h1><p>トークンが見つかりません。</p>';
                  }
                </script>
              </body>
            </html>
          `);
        }
        return;
      }

      // その他
      res.writeHead(404);
      res.end();
    });

    server.listen(CALLBACK_PORT, async () => {
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
