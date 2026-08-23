import type { AccountConfig } from '../types';

/** 浏览器可见的账号 DTO；凭据字段只暴露是否存在，不暴露原值或掩码。 */
export function toSafeAccount(account: AccountConfig): Record<string, unknown> {
  return {
    id: account.id,
    account: account.account,
    auth_type: account.auth_type,
    login_method: account.login_method,
    user_id: account.user_id,
    devices: account.devices,
    last_selected_device_id: account.last_selected_device_id,
    created_at: account.created_at,
    updated_at: account.updated_at,
    has_pass_token: !!account.pass_token,
    services: Object.fromEntries(
      Object.entries(account.services || {}).map(([name, service]) => [name, {
        configured: !!service.service_token,
        expires_at: service.expires_at,
      }]),
    ),
  };
}
