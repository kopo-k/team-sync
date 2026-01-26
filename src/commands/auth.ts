import * as vscode from 'vscode';
import { signInWithGitHub, signOut } from '../services/authService';

// 認証関連のコマンド

export async function loginCommand(): Promise<void> {
  try {
    await signInWithGitHub();
    vscode.window.showInformationMessage('ログインしました');
  } catch (error) {
    vscode.window.showErrorMessage('ログインに失敗しました');
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
