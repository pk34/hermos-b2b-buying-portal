// scripts/deploy-to-stencil.mjs
import { cpSync, rmSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve('apps/storefront/.env.local') });
dotenv.config({ path: resolve('apps/storefront/.env') }); // fallback if you prefer .env

const SRC = resolve('apps/storefront/dist');
const DEST = process.env.STENCIL_ASSETS_DIR;

if (!DEST) {
  console.error('✖ STENCIL_ASSETS_DIR is not set in apps/storefront/.env(.local)');
  process.exit(1);
}
if (!existsSync(SRC)) {
  console.error(`✖ Source not found: ${SRC}. Did you run the build?`);
  process.exit(1);
}

// Optional: exclude heavy or unnecessary files from deployment
const EXCLUDE_EXT = new Set(['.map', '.csv']); // sourcemaps & translation template
function shouldCopy(name) {
  for (const ext of EXCLUDE_EXT) if (name.endsWith(ext)) return false;
  return true;
}

// Clean target and copy
rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });

// Copy everything except excluded types
cpSync(SRC, DEST, { recursive: true, filter: (srcPath) => {
  const name = srcPath.split('/').pop() || '';
  return shouldCopy(name);
}});

// Quick visibility
const sample = readdirSync(DEST).slice(0, 8);
console.log('✔ Deployed to:', DEST);
console.log('✔ Files (sample):', sample);
