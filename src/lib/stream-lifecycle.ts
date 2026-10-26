"use client";

const cleanups = new Set<() => Promise<unknown>>();
export function registerStreamCleanup(cleanup: () => Promise<unknown>) {
  cleanups.add(cleanup);
  return () => { cleanups.delete(cleanup); };
}
export async function disconnectStreamClients() {
  await Promise.allSettled([...cleanups].map(cleanup => cleanup()));
}
