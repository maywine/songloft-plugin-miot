import assert from 'node:assert/strict';
import { toSafeAccount } from '../src/account/safe_account';
import { buildSearchAuthorization } from '../src/voicecmd/search_auth';
import { redactURLForLog, safeErrorForLog } from '../src/utils/safe_log';
import { ConfigManager } from '../src/config/manager';

const regularStorage = new Map<string, unknown>();
const secretStorage = new Map<string, unknown>();
(globalThis as any).songloft = {
  storage: {
    get: async (key: string) => regularStorage.get(key) ?? null,
    set: async (key: string, value: unknown) => { regularStorage.set(key, value); },
    delete: async (key: string) => { regularStorage.delete(key); },
    keys: async () => Array.from(regularStorage.keys()),
  },
  secrets: {
    get: async (key: string) => secretStorage.get(key) ?? null,
    set: async (key: string, value: unknown) => { secretStorage.set(key, value); },
    delete: async (key: string) => { secretStorage.delete(key); },
    keys: async () => Array.from(secretStorage.keys()),
  },
};

const account = {
  id: 'account-1',
  account: 'user@example.com',
  auth_type: 'password',
  login_method: 'password',
  password: 'raw-password-value',
  pass_token: 'xiaomi-pass-token-value',
  user_id: '12345',
  services: {
    micoapi: {
      service_token: 'xiaomi-service-token-value',
      ssecurity: 'xiaomi-ssecurity-value',
      expires_at: 123456,
    },
  },
  devices: [],
  last_selected_device_id: '',
  created_at: '2026-08-23T00:00:00Z',
  updated_at: '2026-08-23T00:00:00Z',
};

const safe = toSafeAccount(account);
const serialized = JSON.stringify(safe);
for (const secret of [
  account.password,
  account.pass_token,
  account.services.micoapi.service_token,
  account.services.micoapi.ssecurity,
]) {
  assert.equal(serialized.includes(secret), false, `safe account leaked ${secret}`);
}
assert.equal('password' in safe, false);
assert.equal('pass_token' in safe, false);
assert.deepEqual(safe.services, { micoapi: { configured: true, expires_at: 123456 } });

const configManager = new ConfigManager();
await configManager.saveAccounts([account as any]);
const publicAccounts = String(regularStorage.get('accounts'));
const encryptedInput = String(secretStorage.get('accounts-v1'));
for (const secret of [
  account.password,
  account.pass_token,
  account.services.micoapi.service_token,
  account.services.micoapi.ssecurity,
]) {
  assert.equal(publicAccounts.includes(secret), false, `regular storage leaked ${secret}`);
}
assert.equal(encryptedInput.includes(account.pass_token), true);
assert.equal(encryptedInput.includes(account.services.micoapi.service_token), true);
assert.equal(encryptedInput.includes(account.password), false, 'password must never enter secret storage');

const reloadedAccounts = await new ConfigManager().getAccounts();
assert.equal(reloadedAccounts[0].pass_token, account.pass_token);
assert.equal(reloadedAccounts[0].services.micoapi.service_token, account.services.micoapi.service_token);
assert.equal(reloadedAccounts[0].password, '');

assert.equal(
  buildSearchAuthorization('/api/v1/jsplugin/source/search', '', 'plugin-jwt'),
  'Bearer plugin-jwt',
);
assert.equal(
  buildSearchAuthorization('https://search.example/api', '', 'plugin-jwt'),
  '',
);
assert.equal(
  buildSearchAuthorization('https://search.example/api', 'Bearer source-secret', 'plugin-jwt'),
  'Bearer source-secret',
);

assert.equal(
  redactURLForLog('https://example.com/play?access_token=secret&url=https%3A%2F%2Fcdn.example%2Fa'),
  'https://example.com/play?keys=access_token,url',
);
assert.equal(redactURLForLog('http://192.168.110.56:58091'), 'http://192.168.110.56:58091');
assert.equal(redactURLForLog('/api/play?token=secret'), '/api/play?keys=token');
assert.equal(redactURLForLog('javascript:alert(1)'), '<invalid-url>');
const safeError = safeErrorForLog(
  'request https://example.com/play?access_token=secret failed Authorization=Bearer abc.def password=hunter2',
);
assert.equal(safeError.includes('secret'), false);
assert.equal(safeError.includes('abc.def'), false);
assert.equal(safeError.includes('hunter2'), false);

console.log('miot security runtime tests passed');
