'use client';

import { io, type Socket } from 'socket.io-client';
import { PRODUCT_QA_SOCKET_NAMESPACE } from '@/lib/productQa/constants';
import { getWsOrigin } from '@/lib/orderChat/wsOrigin';

const SOCKET_RELEASE_DEFER_MS = 200;

let staffSocket: Socket | null = null;
let refCount = 0;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;

export function getAdminProductQaStaffSocket(token: string): Socket {
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  if (!staffSocket) {
    staffSocket = io(`${getWsOrigin()}${PRODUCT_QA_SOCKET_NAMESPACE}`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: { token },
    });
  } else {
    staffSocket.auth = { token };
    if (!staffSocket.connected) {
      staffSocket.connect();
    }
  }
  return staffSocket;
}

export function releaseAdminProductQaStaffSocket(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0 || !staffSocket) return;
  const socket = staffSocket;
  if (releaseTimer) clearTimeout(releaseTimer);
  releaseTimer = setTimeout(() => {
    releaseTimer = null;
    if (refCount > 0 || staffSocket !== socket) return;
    socket.removeAllListeners();
    socket.disconnect();
    staffSocket = null;
  }, SOCKET_RELEASE_DEFER_MS);
}

export function retainAdminProductQaStaffSocket(): void {
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  refCount += 1;
}

export function waitAdminProductQaStaffSocketConnect(socket: Socket, ms = 12000): Promise<void> {
  if (socket.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Product QA staff WS timeout')), ms);
    socket.once('connect', () => {
      clearTimeout(t);
      resolve();
    });
    socket.once('connect_error', (err: Error) => {
      clearTimeout(t);
      reject(err);
    });
  });
}

export async function fetchAdminWsToken(): Promise<string> {
  const res = await fetch('/api/admin/ws-token', { credentials: 'include' });
  if (!res.ok) throw new Error('WS token unavailable');
  const j = (await res.json()) as { token?: string };
  const token = j.token?.trim();
  if (!token) throw new Error('WS token missing');
  return token;
}
