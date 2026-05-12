/** Origin хоста API для Socket.IO (без path вида `/api/v1`). */
export function getWsOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  try {
    return new URL(raw).origin;
  } catch {
    return 'http://localhost:3001';
  }
}
