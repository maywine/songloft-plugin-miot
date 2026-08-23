/** 外部搜索 URL 是否直接指向宿主之外的 HTTP(S) 服务。 */
export function isAbsoluteSearchURL(url: string): boolean {
  const value = (url || '').trim();
  return value.startsWith('http://') || value.startsWith('https://');
}

/**
 * 纯函数形式的搜索源鉴权策略，便于单测锁定安全边界。
 * configuredToken 保持历史语义（调用方决定是否带 Bearer 前缀）。
 */
export function buildSearchAuthorization(
  sourceURL: string,
  configuredToken: string,
  pluginToken: string,
): string {
  const explicit = (configuredToken || '').trim();
  if (explicit) return explicit;
  if (isAbsoluteSearchURL(sourceURL)) return '';
  const internal = (pluginToken || '').trim();
  return internal ? `Bearer ${internal}` : '';
}
