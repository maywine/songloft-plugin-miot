import '@songloft/plugin-sdk';

interface SongloftSecrets {
  get(key: string): Promise<unknown | null>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

// 本插件需要先于公开 SDK 版本使用本次宿主新增能力，因此在本地做模块增强；
// SDK 发布对应声明后，这段仍可安全合并。
declare module '@songloft/plugin-sdk' {
  interface Songloft {
    /** 宿主使用持久化密钥加密落盘的插件私密存储。 */
    secrets: SongloftSecrets;
  }
}
