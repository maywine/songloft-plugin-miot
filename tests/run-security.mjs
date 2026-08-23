import { build } from 'esbuild';

const result = await build({
  entryPoints: ['tests/security-runtime.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  write: false,
  logLevel: 'silent',
});

const code = result.outputFiles[0].text;
await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
