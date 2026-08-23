// MIoT 日志脱敏工具：日志用于定位状态和耗时，不承载凭据、URL query 或家庭语音正文。

const MAX_SAFE_ERROR_LENGTH = 300;

/** 返回文本长度；非字符串按空值处理，避免为了日志隐式序列化敏感对象。 */
export function textLength(value: unknown): number {
  return typeof value === 'string' ? value.length : 0;
}

/**
 * 把 URL 收敛为 scheme/host/path + query key 列表。相对 URL 同样支持。
 * 解析失败时只返回固定占位，绝不回退原文。
 */
export function redactURLForLog(rawURL: unknown): string {
  if (typeof rawURL !== 'string' || !rawURL.trim()) return '<empty-url>';
  const value = rawURL.trim();
  try {
    const absolute = new URL(value, 'http://songloft.invalid');
    const isRelative = !/^https?:\/\//i.test(value);
    const base = isRelative
      ? absolute.pathname
      : `${absolute.protocol}//${absolute.host}${absolute.pathname}`;
    const keys = Array.from(absolute.searchParams.keys()).filter(Boolean).sort();
    return keys.length > 0 ? `${base}?keys=${keys.join(',')}` : base;
  } catch {
    return '<invalid-url>';
  }
}

/**
 * 将异常压缩为有限长度且去凭据的文本。URL 只保留脱敏形态；常见认证键值和
 * Bearer Token 一律替换。该函数只处理字符串，不序列化任意错误对象。
 */
export function safeErrorForLog(error: unknown): string {
  let text = error instanceof Error ? error.message : String(error ?? 'unknown error');
  text = text.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer ***');
  text = text.replace(
    /\b(access_token|refresh_token|pass_?token|service_?token|ssecurity|api_?key|password|secret)(\s*[:=]\s*)([^\s,;]+)/gi,
    '$1$2***',
  );
  text = text.replace(/https?:\/\/[^\s"'<>]+/gi, (url) => redactURLForLog(url));
  return text.length > MAX_SAFE_ERROR_LENGTH
    ? text.slice(0, MAX_SAFE_ERROR_LENGTH) + '...(truncated)'
    : text;
}

/** 生成只用于日志关联的非密码学匿名标识。 */
export function opaqueID(value: unknown): string {
  const input = String(value ?? '');
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `id-${hash.toString(16).padStart(8, '0')}`;
}
