import * as vscode from 'vscode';
import { signInWithGitHub, signOut, getCurrentUser } from '../services/authService';

export async function loginCommand(): Promise<void> {
  try {
    vscode.window.showInformationMessage('ブラウザでGitHub認証を行ってください...');
    await signInWithGitHub();

    const user = await getCurrentUser();
    const username = user?.user_metadata?.user_name || 'ユーザー';
    vscode.window.showInformationMessage(`ログインしました: ${username}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ログインに失敗しました';
    vscode.window.showErrorMessage(message);
  }
}

export async function logoutCommand(): Promise<void> {
  try {
    await signOut();
    vscode.window.showInformationMessage('ログアウトしました');
  } catch (error) {
    vscode.window.showErrorMessage('ログアウトに失敗しました');
  }
}
