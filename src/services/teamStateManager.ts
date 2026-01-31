// 純粋な状態管理（vscode に依存しない）
import { MemberWithActivity } from '../types';

export class TeamStateManager {
  private _isLoggedIn = false;
  private _username: string | null = null;
  private _avatarUrl: string | null = null;
  private _teamId: string | null = null;
  private _teamName: string | null = null;
  private _currentMemberId: string | null = null;
  private _members: MemberWithActivity[] = [];

  // --- Getters ---
  isLoggedIn(): boolean { return this._isLoggedIn; }
  getUsername(): string | null { return this._username; }
  getAvatarUrl(): string | null { return this._avatarUrl; }
  getTeamId(): string | null { return this._teamId; }
  getTeamName(): string | null { return this._teamName; }
  getMemberId(): string | null { return this._currentMemberId; }
  getMembers(): MemberWithActivity[] { return this._members; }

  // --- Setters ---
  setLoggedIn(username: string, avatarUrl: string): void {
    this._isLoggedIn = true;
    this._username = username;
    this._avatarUrl = avatarUrl;
  }

  setTeam(teamId: string, teamName: string): void {
    this._teamId = teamId;
    this._teamName = teamName;
  }

  setMemberId(memberId: string): void {
    this._currentMemberId = memberId;
  }

  setMembers(members: MemberWithActivity[]): void {
    this._members = members;
  }

  clearTeam(): void {
    this._teamId = null;
    this._teamName = null;
    this._members = [];
  }

  // 全状態をリセット（ログアウト時）
  reset(): void {
    this._isLoggedIn = false;
    this._username = null;
    this._avatarUrl = null;
    this._teamId = null;
    this._teamName = null;
    this._currentMemberId = null;
    this._members = [];
  }
}
