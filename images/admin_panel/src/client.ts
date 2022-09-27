import { GameClient } from 'game-socket/dist/lib/client.js';
import { adminReducer } from 'game-socket/dist/trivia/admin_state.js';
import { getAdminToken, upgradeToAdmin } from 'game-socket/dist/trivia/admin_rpcs.js';
import type { StatusResponse } from 'game-socket/dist/trivia/base';
import { navigate } from 'svelte-routing';

export const client = new GameClient('ws://localhost:8082', adminReducer);

export async function refreshToken(password: string): Promise<StatusResponse> {
  const response = await client.call(getAdminToken, { password });
  localStorage.setItem('token', response.token);
  return upgrade();
}

export async function upgrade(): Promise<StatusResponse> {
  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
    return { success: false };
  }

  const response = await client.call(upgradeToAdmin, { token });
  if (response.success) {
    navigate('/');
  } else {
    navigate('/login');
  }
  return response;
}
