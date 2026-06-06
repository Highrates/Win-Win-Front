import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localModules = path.join(frontendRoot, 'node_modules');
const rootModules = path.join(frontendRoot, '..', 'node_modules');

/** Next/webpack resolves from frontend/node_modules; npm workspaces hoists react to repo root. */
const packages = ['react', 'react-dom', 'scheduler'];

for (const name of packages) {
  const target = path.join(localModules, name);
  const source = path.join(rootModules, name);
  if (fs.existsSync(target) || !fs.existsSync(source)) continue;
  fs.symlinkSync(path.relative(path.dirname(target), source), target, 'dir');
}
