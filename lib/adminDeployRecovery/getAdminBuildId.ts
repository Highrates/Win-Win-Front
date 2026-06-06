import { readFileSync } from 'fs';
import path from 'path';

/** Текущий BUILD_ID Next (серверный layout). В dev без сборки — «dev». */
export function getAdminBuildId(): string {
  try {
    return readFileSync(path.join(process.cwd(), '.next', 'BUILD_ID'), 'utf8').trim();
  } catch {
    return 'dev';
  }
}
