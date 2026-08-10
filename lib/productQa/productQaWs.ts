'use client';

import { io, type Socket } from 'socket.io-client';
import { PRODUCT_QA_SOCKET_NAMESPACE } from '@/lib/productQa/constants';
import { getWsOrigin } from '@/lib/orderChat/wsOrigin';

/** React Strict Mode: cleanup между mount не рвёт connect mid-flight. */
const SOCKET_RELEASE_DEFER_MS = 200;

let sharedSocket: Socket | null = null;
let refCount = 0;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;

function cancelDeferredRelease(): void {
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
}

function scheduleDeferredRelease(onRelease: () => void): void {
  cancelDeferredRelease();
  releaseTimer = setTimeout(() => {
    releaseTimer = null;
    onRelease();
  }, SOCKET_RELEASE_DEFER_MS);
}

export function getSharedProductQaSocket(): Socket {
  cancelDeferredRelease();
  if (!sharedSocket) {
    sharedSocket = io(`${getWsOrigin()}${PRODUCT_QA_SOCKET_NAMESPACE}`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  refCount += 1;
  return sharedSocket;
}

export function releaseSharedProductQaSocket(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0 || !sharedSocket) return;
  const socket = sharedSocket;
  scheduleDeferredRelease(() => {
    if (refCount > 0 || sharedSocket !== socket) return;
    socket.removeAllListeners();
    socket.disconnect();
    sharedSocket = null;
  });
}

export function waitProductQaSocketConnect(socket: Socket, ms = 12000): Promise<void> {
  if (socket.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Нет соединения с Q&A')), ms);
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

export async function joinProductQaRoom(
  socket: Socket,
  target: { productSlug?: string; productId?: string },
): Promise<void> {
  await waitProductQaSocketConnect(socket);
  await new Promise<void>((resolve, reject) => {
    socket.emit('join_product_qa', target, (res: { ok?: boolean; productId?: string } | undefined) => {
      if (res?.ok) resolve();
      else reject(new Error('Не удалось подписаться на обновления Q&A'));
    });
  });
}

function roomTargetKey(target: { productSlug?: string; productId?: string }): string | null {
  const id = target.productId?.trim();
  if (id) return `id:${id}`;
  const slug = target.productSlug?.trim();
  if (slug) return `slug:${slug}`;
  return null;
}

const productQaRoomRefCounts = new Map<string, number>();

/** Подписка на комнату с ref-count: leave только когда последний подписчик отписался. */
export async function retainProductQaRoom(
  socket: Socket,
  target: { productSlug?: string; productId?: string },
): Promise<void> {
  const key = roomTargetKey(target);
  if (!key) return;
  const prev = productQaRoomRefCounts.get(key) ?? 0;
  productQaRoomRefCounts.set(key, prev + 1);
  if (prev === 0) {
    await joinProductQaRoom(socket, target);
  }
}

export function releaseProductQaRoom(
  socket: Socket,
  target: { productSlug?: string; productId?: string },
): void {
  const key = roomTargetKey(target);
  if (!key) return;
  const prev = productQaRoomRefCounts.get(key) ?? 0;
  if (prev <= 1) {
    productQaRoomRefCounts.delete(key);
    leaveProductQaRoom(socket, target);
  } else {
    productQaRoomRefCounts.set(key, prev - 1);
  }
}

export function leaveProductQaRoom(
  socket: Socket,
  target: { productSlug?: string; productId?: string },
): void {
  if (!socket.connected) return;
  socket.emit('leave_product_qa', target);
}

let userAuthSocket: Socket | null = null;
let userAuthRefCount = 0;
let userAuthReleaseTimer: ReturnType<typeof setTimeout> | null = null;

/** JWT-сокет для private correspondence (ЛК). Отдельно от анонимного shared. */
export function getUserAuthProductQaSocket(token: string): Socket {
  if (userAuthReleaseTimer) {
    clearTimeout(userAuthReleaseTimer);
    userAuthReleaseTimer = null;
  }
  if (!userAuthSocket) {
    userAuthSocket = io(`${getWsOrigin()}${PRODUCT_QA_SOCKET_NAMESPACE}`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: { token },
    });
  } else {
    userAuthSocket.auth = { token };
  }
  userAuthRefCount += 1;
  return userAuthSocket;
}

export function releaseUserAuthProductQaSocket(): void {
  userAuthRefCount = Math.max(0, userAuthRefCount - 1);
  if (userAuthRefCount > 0 || !userAuthSocket) return;
  const socket = userAuthSocket;
  if (userAuthReleaseTimer) clearTimeout(userAuthReleaseTimer);
  userAuthReleaseTimer = setTimeout(() => {
    userAuthReleaseTimer = null;
    if (userAuthRefCount > 0 || userAuthSocket !== socket) return;
    socket.removeAllListeners();
    socket.disconnect();
    userAuthSocket = null;
  }, SOCKET_RELEASE_DEFER_MS);
}

export async function joinProductCorrespondenceRoom(
  socket: Socket,
  correspondenceId: string,
): Promise<void> {
  await waitProductQaSocketConnect(socket);
  await new Promise<void>((resolve, reject) => {
    socket.emit(
      'join_product_correspondence',
      { correspondenceId },
      (res: { ok?: boolean } | undefined) => {
        if (res?.ok) resolve();
        else reject(new Error('Не удалось подписаться на переписку'));
      },
    );
  });
}

export function leaveProductCorrespondenceRoom(socket: Socket, correspondenceId: string): void {
  if (!socket.connected) return;
  socket.emit('leave_product_correspondence', { correspondenceId });
}
