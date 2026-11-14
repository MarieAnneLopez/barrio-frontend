#!/usr/bin/env node
// Regla del proyecto: ningún archivo de código supera 100 líneas.
// Uso: node scripts/check_line_length.mjs [directorio ...]
// Sin argumentos revisa la raíz del repo. Sale con 1 si hay infractores.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_LINES = 100;
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.py', '.css']);
const EXCLUDED_DIRS = new Set([
  'node_modules', 'dist', '.venv', 'venv', '.git', '__pycache__', 'coverage',
]);

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function countLines(text) {
  if (text.length === 0) return 0;
  const breaks = text.split('\n').length - 1;
  return text.endsWith('\n') ? breaks : breaks + 1;
}

function isExcluded(path) {
  const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
  if (parts.some((p) => EXCLUDED_DIRS.has(p))) return true;
  return parts.some((p, i) => p === 'alembic' && parts[i + 1] === 'versions');
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (isExcluded(full)) continue;
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (CODE_EXTENSIONS.has(extname(full).toLowerCase())) yield full;
  }
}

function main(args) {
  const dirs = args.length > 0 ? args.map((a) => resolve(a)) : [repoRoot];
  let checked = 0;
  const offenders = [];
  for (const dir of dirs) {
    for (const file of walk(dir)) {
      checked += 1;
      const lines = countLines(readFileSync(file, 'utf8'));
      if (lines > MAX_LINES) offenders.push({ file, lines });
    }
  }
  for (const { file, lines } of offenders) {
    const rel = relative(repoRoot, file);
    const shown = rel.startsWith('..') ? file : rel;
    console.error(`  ${shown}: ${lines} líneas (máximo ${MAX_LINES})`);
  }
  if (offenders.length > 0) {
    console.error(`check_line_length: ${offenders.length} de ${checked} archivos superan ${MAX_LINES} líneas.`);
    return 1;
  }
  console.log(`check_line_length: OK, ${checked} archivos de código, todos <= ${MAX_LINES} líneas.`);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
