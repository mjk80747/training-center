import axios from 'axios';
import apiClient from '../api/client';

export type UserRole = 'ADMIN' | 'COUNSELLOR' | 'TRAINER' | 'STUDENT';

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
};

export function setAuthSession(user: AuthUser, accessToken: string, refreshToken: string) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

export function getAuthSession(): AuthUser | null {
  const raw = localStorage.getItem('user');
  if (!raw || !localStorage.getItem('access_token')) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem('user');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export async function logout() {
  const refreshToken = localStorage.getItem('refresh_token');
  clearAuthSession();
  if (!refreshToken) return;

  try {
    await apiClient.post('/auth/logout/', { refresh: refreshToken });
  } catch (error: unknown) {
    if (!axios.isAxiosError(error)) throw error;
    console.error('The local session ended, but the server could not revoke the refresh token.', error.message);
  }
}
