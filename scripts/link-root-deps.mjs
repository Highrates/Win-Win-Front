import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localModules = path.join(frontendRoot, 'node_modules');
const rootModules = path.join(frontendRoot, '..', 'node_modules');
const rootPkg = path.join(frontendRoot, '..', 'package.json');

/**
 * Next/webpack resolves from frontend/node_modules; npm workspaces hoists react to repo root.
 * Только в монорепо WUPAPA: иначе symlink в чужой /var/www/node_modules → NFT hang на build.
 */
function isMonorepoWorkspaceRoot() {
  if (!fs.existsSync(rootPkg) || !fs.existsSync(rootModules)) return false;
  try {
    const pkg = JSON.parse(fs.readFileSync(rootPkg, 'utf8'));
    const workspaces = pkg.workspaces;
    if (Array.isArray(workspaces) && workspaces.some((w) => String(w).includes('frontend'))) {
      return true;
    }
    if (workspaces && typeof workspaces === 'object' && Array.isArray(workspaces.packages)) {
      return workspaces.packages.some((w) => String(w).includes('frontend'));
    }
  } catch {
    return false;
  }
  return false;
}

if (!isMonorepoWorkspaceRoot()) {
  process.exit(0);
}

const packages = ['react', 'react-dom', 'scheduler'];

for (const name of packages) {
  const target = path.join(localModules, name);
  const source = path.join(rootModules, name);
  if (fs.existsSync(target) || !fs.existsSync(source)) continue;
  fs.symlinkSync(path.relative(path.dirname(target), source), target, 'dir');
}
