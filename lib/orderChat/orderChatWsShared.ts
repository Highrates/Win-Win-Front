'use client';

/**
 * Одно Socket.IO-соединение на вариант (ЛК vs админка): TTL access JWT (`exp`), восстановление при обрыве.
 * Несколько `useOrderChat` с одним `variant` делят один сокет; при пересборке рассылается DOM-событие.
 */

import { io, type Socket } from 'socket.io-client';
import { readUpstreamJsonErrorMessage } from '@/lib/readUpstreamJsonError';
import {
  ORDER_CHAT_SOCKET_NAMESPACE,
  ORDER_CHAT_SOCKET_UPDATED_EVENT,
  ORDER_CHAT_WS_REFRESH_BUFFER_MS,
  ORDER_CHAT_WS_REFRESH_FALLBACK_MS,
} from '@/lib/orderChat/constants';
import type { OrderChatVariant } from '@/lib/orderChat/constants';
import { jwtExpiresAtMs } from '@/lib/orderChat/decodeJwtPayloadUnsafe';
import { getWsOrigin } from '@/lib/orderChat/wsOrigin';

type SharedSlice =
  | {
      socket: Socket;
      token: string;
    }
  | null;

const sharedByVariant: Record<OrderChatVariant, SharedSlice> = {
  account: null,
  admin: null,
};

const refCountByVariant: Record<OrderChatVariant, number> = {
  account: 0,
  admin: 0,
};

const ttlTimerByVariant: Record<OrderChatVariant, ReturnType<typeof setTimeout> | null> = {
  account: null,
  admin: null,
};

/** Не давать нескольким TTL / disconnect-событиям одновременно пересоздавать сокет. */
const recreateInFlight: Partial<Record<OrderChatVariant, boolean>> = {};

function clearTtl(variant: OrderChatVariant) {
  const t = ttlTimerByVariant[variant];
  if (t != null) clearTimeout(t);
  ttlTimerByVariant[variant] = null;
}

function emitSocketUpdated(variant: OrderChatVariant, socket: Socket) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ORDER_CHAT_SOCKET_UPDATED_EVENT, { detail: { variant, socket } }));
}

export function disposeSharedOrderChatSocket(variant: OrderChatVariant): void {
  const cur = sharedByVariant[variant];
  if (!cur) return;
  cur.socket.removeAllListeners();
  cur.socket.disconnect();
  sharedByVariant[variant] = null;
}

export async function fetchOrderChatWsToken(variant: OrderChatVariant): Promise<string> {
  const path = variant === 'account' ? '/api/user/ws-token' : '/api/admin/ws-token';
  const res = await fetch(path, { credentials: 'same-origin', cache: 'no-store' });
  if (!res.ok) throw new Error(await readUpstreamJsonErrorMessage(res));
  const j = (await res.json()) as { token?: string };
  if (!j.token?.trim()) throw new Error('Нет токена для чата');
  return j.token.trim();
}

export function waitOrderChatSocketConnect(socket: Socket, ms = 12000): Promise<void> {
  if (socket.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Нет соединения с чатом')), ms);
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

function wireRecovery(socket: Socket, variant: OrderChatVariant) {
  socket.on('connect_error', () => void runRecreateLocked(variant, 'connect_error'));
  socket.on('disconnect', (reason: string) => {
    if (reason === 'io client disconnect') return;
    void runRecreateLocked(variant, `disconnect:${reason}`);
  });
}

function delayUntilNextRefresh(token: string): number {
  const expMs = jwtExpiresAtMs(token);
  if (expMs == null) return ORDER_CHAT_WS_REFRESH_FALLBACK_MS;
  const left = expMs - Date.now() - ORDER_CHAT_WS_REFRESH_BUFFER_MS;
  return Math.min(Math.max(left, 10_000), 24 * 60 * 60_000);
}

function scheduleTtlRefresh(variant: OrderChatVariant, token?: string): void {
  clearTtl(variant);
  if (refCountByVariant[variant] <= 0) return;

  let tok = token ?? sharedByVariant[variant]?.token;
  if (!tok) return;

  ttlTimerByVariant[variant] = setTimeout(() => {
    ttlTimerByVariant[variant] = null;
    if (refCountByVariant[variant] <= 0) return;
    void runRecreateLocked(variant, 'jwt-ttl-or-fallback');
  }, delayUntilNextRefresh(tok));
}

async function runRecreateLocked(variant: OrderChatVariant, reason: string): Promise<void> {
  if (refCountByVariant[variant] <= 0 || recreateInFlight[variant]) return;
  recreateInFlight[variant] = true;
  try {
    await recreateSharedInner(variant, reason);
  } finally {
    recreateInFlight[variant] = false;
  }
}

async function recreateSharedInner(variant: OrderChatVariant, reason: string): Promise<void> {
  if (refCountByVariant[variant] <= 0) return;
  try {
    disposeSharedOrderChatSocket(variant);
    const token = await fetchOrderChatWsToken(variant);
    const socket = connectNewSharedSocket(variant, token);
    await waitOrderChatSocketConnect(socket);
    clearTtl(variant);
    scheduleTtlRefresh(variant, token);
    emitSocketUpdated(variant, socket);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (typeof console !== 'undefined') {
      console.warn(`[order-chat-ws] reconnect (${reason}) failed:`, msg);
    }
    clearTtl(variant);
    ttlTimerByVariant[variant] = setTimeout(() => {
      ttlTimerByVariant[variant] = null;
      if (refCountByVariant[variant] > 0) void runRecreateLocked(variant, 'retry-after-failure');
    }, 8000);
  }
}

function connectNewSharedSocket(variant: OrderChatVariant, token: string): Socket {
  const origin = getWsOrigin();
  const url = `${origin}${ORDER_CHAT_SOCKET_NAMESPACE}`;
  const socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
    path: '/socket.io',
  });
  wireRecovery(socket, variant);
  sharedByVariant[variant] = { socket, token };
  return socket;
}

/**
 * Если токен совпадает с активным подключением — возвращает существующий сокет иначе пересоздаёт.
 */
export function getOrCreateSharedOrderChatSocket(variant: OrderChatVariant, token: string): Socket {
  const existing = sharedByVariant[variant];
  if (existing && existing.token === token) {
    return existing.socket;
  }

  disposeSharedOrderChatSocket(variant);
  return connectNewSharedSocket(variant, token);
}

/**
 * После успешного получения токена подключить чат. Первый клиент включает TTL-таймер; последний монтирования — закрывает сокет.
 */
export function registerOrderChatWsSession(variant: OrderChatVariant, initialToken: string): () => void {
  refCountByVariant[variant]++;
  if (refCountByVariant[variant] === 1) {
    scheduleTtlRefresh(variant, initialToken);
  }

  return () => {
    refCountByVariant[variant] = Math.max(0, refCountByVariant[variant] - 1);
    if (refCountByVariant[variant] === 0) {
      clearTtl(variant);
      disposeSharedOrderChatSocket(variant);
    }
  };
}
