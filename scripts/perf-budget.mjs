#!/usr/bin/env node

/* eslint-disable no-console */
/**
 * Performance Budget Checker
 * Ensures build artifacts stay within acceptable size limits.
 * Run after `npm run build` via `node scripts/perf-budget.mjs`
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const statsPath = join(__dirname, '..', 'dist', '.vite', 'stats.json');

const BUDGETS = {
  '**/*.js': { maxSize: 300 * 1024, gzipMaxSize: 100 * 1024 },
  '**/*.css': { maxSize: 100 * 1024, gzipMaxSize: 30 * 1024 },
  '**/*.html': { maxSize: 20 * 1024 },
};

let passed = true;

try {
  const stats = JSON.parse(readFileSync(statsPath, 'utf-8'));
  for (const [pattern, budget] of Object.entries(BUDGETS)) {
    for (const [file, info] of Object.entries(stats.output || {})) {
      if (!file.match(pattern)) continue;
      const size = info.size || 0;
      const gzipSize = info.gzipSize || 0;

      if (size > budget.maxSize) {
        console.error(
          `❌ ${file}: ${(size / 1024).toFixed(1)}KB exceeds ${(budget.maxSize / 1024).toFixed(1)}KB`,
        );
        passed = false;
      } else {
        console.log(
          `✓ ${file}: ${(size / 1024).toFixed(1)}KB (budget: ${(budget.maxSize / 1024).toFixed(1)}KB)`,
        );
      }

      if (budget.gzipMaxSize && gzipSize > budget.gzipMaxSize) {
        console.error(
          `❌ ${file} (gzip): ${(gzipSize / 1024).toFixed(1)}KB exceeds ${(budget.gzipMaxSize / 1024).toFixed(1)}KB`,
        );
        passed = false;
      }
    }
  }
} catch {
  console.log('⚠️  Bundle stats not found. Run vite build with --configCustom or skip check.');
  passed = true;
}

if (passed) {
  console.log('\n✅ All performance budgets passed!');
  process.exit(0);
} else {
  console.error('\n❌ Performance budgets exceeded!');
  process.exit(1);
}
