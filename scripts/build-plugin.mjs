import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifestPath = resolve(root, 'plugin.json');
const cliPath = resolve(root, 'node_modules/@songloft/plugin-builder/dist/cli.js');
const original = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(original);

// downloadSha256 固定的是最终 ZIP 原始字节，不能同时放进该 ZIP 内部（会形成
// 自引用哈希）。构建时仅从临时输入清除，结束后原样恢复外部注册表清单。
delete manifest.downloadSha256;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

try {
  const result = spawnSync(process.execPath, [cliPath, 'build'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  writeFileSync(manifestPath, original);
}
