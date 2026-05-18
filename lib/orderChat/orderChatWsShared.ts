'use client';

/**
 * Одно Socket.IO-соединение на вариант (ЛК vs админка): TTL access JWT (`exp`), восстановление при обрыве.
 * Несколько `useOrderChat` с одним `variant` делят один сокет; при пересборке рассылается DOM-событие.
 * Поля `sub` и `exp` приходят с BFF (`/api/user/ws-token`, `/api/admin/ws-token`); JWT в браузере не разбирается.
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
import { getWsOrigin } from '@/lib/orderChat/wsOrigin';

export type OrderChatWsAuth = {
  token: string;
  /** JWT `sub` с BFF; для UI «свои / чужие» сообщения */
  sub: string | null;
  /** JWT `exp` в секундах с epoch (с BFF); для планирования пересборки сокета */
  exp: number | null;
};

type SharedSlice =
  | {
      socket: Socket;
      auth: OrderChatWsAuth;
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

/**
 * После logout: обнулить refcount, TTL и разорвать общий сокет (handlers снимает disconnect/removeAllListeners).
 */
export function teardownOrderChatWsForLogout(variant: OrderChatVariant): void {
  clearTtl(variant);
  refCountByVariant[variant] = 0;
  recreateInFlight[variant] = false;
  disposeSharedOrderChatSocket(variant);
}

export async function fetchOrderChatWsToken(variant: OrderChatVariant): Promise<OrderChatWsAuth> {
  const path = variant === 'account' ? '/api/user/ws-token' : '/api/admin/ws-token';
  const res = await fetch(path, { credentials: 'same-origin', cache: 'no-store' });
  if (!res.ok) throw new Error(await readUpstreamJsonErrorMessage(res));
  const j = (await res.json()) as { token?: string; sub?: string | null; exp?: number | null };
  const token = j.token?.trim();
  if (!token) throw new Error('Нет токена для чата');
  const sub = j.sub === undefined || j.sub === null ? null : String(j.sub);
  let exp: number | null = null;
  if (typeof j.exp === 'number' && Number.isFinite(j.exp)) exp = j.exp;
  return { token, sub: sub === '' ? null : sub, exp };
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

function delayUntilNextRefresh(expSeconds: number | null): number {
  if (expSeconds == null) return ORDER_CHAT_WS_REFRESH_FALLBACK_MS;
  const expMs = expSeconds * 1000;
  const left = expMs - Date.now() - ORDER_CHAT_WS_REFRESH_BUFFER_MS;
  return Math.min(Math.max(left, 10_000), 24 * 60 * 60_000);
}

function scheduleTtlRefresh(variant: OrderChatVariant, auth?: OrderChatWsAuth): void {
  clearTtl(variant);
  if (refCountByVariant[variant] <= 0) return;

  const a = auth ?? sharedByVariant[variant]?.auth;
  if (!a) return;

  ttlTimerByVariant[variant] = setTimeout(() => {
    ttlTimerByVariant[variant] = null;
    if (refCountByVariant[variant] <= 0) return;
    void runRecreateLocked(variant, 'jwt-ttl-or-fallback');
  }, delayUntilNextRefresh(a.exp));
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
    const auth = await fetchOrderChatWsToken(variant);
    const socket = connectNewSharedSocket(variant, auth);
    await waitOrderChatSocketConnect(socket);
    clearTtl(variant);
    scheduleTtlRefresh(variant, auth);
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

function connectNewSharedSocket(variant: OrderChatVariant, auth: OrderChatWsAuth): Socket {
  const origin = getWsOrigin();
  const url = `${origin}${ORDER_CHAT_SOCKET_NAMESPACE}`;
  const socket = io(url, {
    auth: { token: auth.token },
    transports: ['websocket', 'polling'],
    path: '/socket.io',
  });
  wireRecovery(socket, variant);
  sharedByVariant[variant] = { socket, auth };
  return socket;
}

/**
 * Если токен совпадает с активным подключением — возвращает существующий сокет иначе пересоздаёт.
 */
export function getOrCreateSharedOrderChatSocket(variant: OrderChatVariant, auth: OrderChatWsAuth): Socket {
  const existing = sharedByVariant[variant];
  if (existing && existing.auth.token === auth.token) {
    return existing.socket;
  }

  disposeSharedOrderChatSocket(variant);
  return connectNewSharedSocket(variant, auth);
}

/**
 * После успешного получения токена подключить чат. Первый клиент включает TTL-таймер; последний монтирования — закрывает сокет.
 */
export function registerOrderChatWsSession(variant: OrderChatVariant, auth: OrderChatWsAuth): () => void {
  refCountByVariant[variant]++;
  if (refCountByVariant[variant] === 1) {
    scheduleTtlRefresh(variant, auth);
  }

  return () => {
    refCountByVariant[variant] = Math.max(0, refCountByVariant[variant] - 1);
    if (refCountByVariant[variant] === 0) {
      clearTtl(variant);
      disposeSharedOrderChatSocket(variant);
    }
  };
}
