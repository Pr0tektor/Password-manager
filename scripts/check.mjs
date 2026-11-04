import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
const files = (await readdir('.', { recursive: true })).filter(file => /\.(mjs|js)$/.test(file) && !file.startsWith('.git') && !file.includes('node_modules'));
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Syntax checked: ${files.length} modules.`);
