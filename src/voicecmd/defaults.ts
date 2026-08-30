import type { VoiceCommand } from '../types';

export const VOICE_COMMAND_SCHEMA_VERSION = 1;

const UNSAFE_LEGACY_STOP_KEYWORDS = new Set(['关机', '关闭']);
const UNSAFE_LEGACY_SLEEP_TIMER_KEYWORDS = new Set([
  '分钟后停止',
  '分钟后关闭',
  '小时后停止',
  '小时后关闭',
]);

const LOCAL_PLAY_KEYWORDS: Record<string, string[]> = {
  play_playlist: ['播放本地音乐', '播放本地歌单'],
  play_song: ['播放本地歌曲', '放本地歌曲'],
};

export function getDefaultVoiceCommands(): VoiceCommand[] {
  return [
    { type: 'play_playlist', keywords: ['播放歌单', '放歌单', '播放列表', ...LOCAL_PLAY_KEYWORDS.play_playlist], enabled: true },
    { type: 'play_artist', keywords: ['播放歌手'], enabled: true },
    { type: 'play_song', keywords: ['播放歌曲', '放歌曲', '我想听', ...LOCAL_PLAY_KEYWORDS.play_song], enabled: true },
    { type: 'set_play_mode', keywords: ['随机播放', '随机模式'], param: 'random', enabled: true },
    { type: 'set_play_mode', keywords: ['单曲循环', '循环播放这首'], param: 'single', enabled: true },
    { type: 'set_play_mode', keywords: ['单曲播放', '只播放这首', '播完这首停止'], param: 'singlePlay', enabled: true },
    { type: 'set_play_mode', keywords: ['列表循环', '循环播放'], param: 'loop', enabled: true },
    { type: 'set_play_mode', keywords: ['顺序播放'], param: 'order', enabled: true },
    { type: 'set_volume', keywords: ['设置音量', '音量调到', '音量', '声音', '声音调到'], param: 'absolute', enabled: true },
    { type: 'set_volume', keywords: ['大声一点', '声音大一点', '音量大一点'], param: 'up', enabled: true },
    { type: 'set_volume', keywords: ['小声一点', '声音小一点', '音量小一点'], param: 'down', enabled: true },
    { type: 'next', keywords: ['下一首', '切歌', '换一首', '下一曲'], enabled: true },
    { type: 'previous', keywords: ['上一首', '上一曲'], enabled: true },
    { type: 'stop', keywords: ['暂停播放', '停止播放', '暂停音乐', '停一下', 'pause', 'stop', '停止', '别播了', '关掉音乐', '暂停'], enabled: true },
    { type: 'favorite', keywords: ['收藏歌曲', '收藏这首歌', '喜欢这首歌', '收藏这首'], param: 'add', enabled: true },
    { type: 'favorite', keywords: ['取消收藏', '取消收藏歌曲'], param: 'remove', enabled: true },
    { type: 'sleep_timer', keywords: ['分钟后停止播放', '分钟后暂停播放', '小时后停止播放', '首歌后停止播放', '首歌后停止', '首后停止播放', '首后停止', '首歌后暂停', '首后关闭'], enabled: true },
    { type: 'cancel_sleep_timer', keywords: ['取消定时', '取消倒计时', '取消睡眠定时', '取消定时停止'], enabled: true },
    { type: 'query_sleep_timer', keywords: ['还有多久停', '定时还剩', '倒计时还剩', '还剩多久'], enabled: true },
  ];
}

/** 只迁移本版本明确新增或撤销的默认词，避免覆盖用户自定义配置。 */
export function migrateVoiceCommands(commands: VoiceCommand[]): VoiceCommand[] {
  return commands.map(command => {
    let keywords = command.keywords.filter(keyword => {
      const normalized = keyword.trim();
      if (command.type === 'stop') return !UNSAFE_LEGACY_STOP_KEYWORDS.has(normalized);
      if (command.type === 'sleep_timer') return !UNSAFE_LEGACY_SLEEP_TIMER_KEYWORDS.has(normalized);
      return true;
    });

    const additions = LOCAL_PLAY_KEYWORDS[command.type] || [];
    if (additions.length > 0) {
      const existing = new Set(keywords);
      keywords = [...keywords, ...additions.filter(keyword => !existing.has(keyword))];
    }

    return { ...command, keywords };
  });
}
