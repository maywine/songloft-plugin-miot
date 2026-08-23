export interface MediaTokenOptions {
  songId?: number;
  purpose?: 'proxy-transcode';
  ttlSeconds?: number;
}

interface SecurePluginBridge {
  getMediaToken(options: MediaTokenOptions): Promise<string>;
  isActive(entryPath: string): Promise<boolean>;
}

/**
 * 调用安全宿主新增的媒体 Token bridge。
 * 公开 SDK 尚未发布该类型，集中在这里做一次窄化，避免业务代码散落类型断言。
 */
export function getMediaToken(options: MediaTokenOptions): Promise<string> {
  return (songloft.plugin as unknown as SecurePluginBridge).getMediaToken(options);
}

/** 查询目标插件是否仍安装且为 active；需要本插件声明 inter-plugin。 */
export function isHostPluginActive(entryPath: string): Promise<boolean> {
  return (songloft.plugin as unknown as SecurePluginBridge).isActive(entryPath);
}
