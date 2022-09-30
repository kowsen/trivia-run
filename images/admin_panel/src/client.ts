import { GameClient } from 'game-socket/dist/lib/client.js';
import { adminReducer, type AdminQuestionOrder } from 'game-socket/dist/trivia/admin_state.js';
import { getAdminToken, upgradeToAdmin } from 'game-socket/dist/trivia/admin_rpcs.js';
import type { RequestDoc, StatusResponse } from 'game-socket/dist/trivia/base';
import { navigate } from 'svelte-routing';
import { derived } from 'svelte/store';

console.log(`ws://${window.location.host}/api`);
export const client = new GameClient(`ws://${window.location.host}/api`, adminReducer, { path: '/admin/socket.io' });

export async function refreshToken(password: string): Promise<StatusResponse> {
  const response = await client.call(getAdminToken, { password });
  localStorage.setItem('token', response.token);
  return upgrade();
}

export async function upgrade(): Promise<StatusResponse> {
  const token = localStorage.getItem('token');
  console.log(token);
  if (!token) {
    navigate('/admin/login');
    return { success: false };
  }

  const response = await client.call(upgradeToAdmin, { token });
  console.log(response);
  if (response.success) {
    if (window.location.pathname === '/login') {
      navigate('/admin');
    }
  } else {
    navigate('/admin/login');
  }
  return response;
}

export const order = derived(client, ({ order }): RequestDoc<AdminQuestionOrder> => {
  const docs = order.ids.map(id => order.entities[id]);
  return docs.sort((a, b) => b._modified - a._modified)[0] ?? { main: [], bonus: [] };
});
