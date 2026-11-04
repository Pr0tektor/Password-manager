import { spawnSync } from 'node:child_process';
const files = ['app.mjs', 'crypto.mjs', 'csv.mjs', 'vault.mjs', 'server.mjs', 'scripts/check.mjs', 'tests/vault.test.mjs', 'tests/server.test.mjs', 'tests/csv.test.mjs'];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Syntax checked: ${files.length} modules.`);
