import type { VoiceCommand } from '../types';

export interface VoiceCommandMatch {
  command: VoiceCommand;
  keyword: string;
  argument: string;
}

/** 音乐控制只接管插件自己的活跃会话；定时器查询/取消可在会话停止后继续处理。 */
export function shouldExecuteFixedControl(
  commandType: string,
  playbackState: string | undefined,
  sleepTimerActive = false,
): boolean {
  if (commandType === 'cancel_sleep_timer' || commandType === 'query_sleep_timer') {
    return sleepTimerActive;
  }
  return playbackState === 'playing' || playbackState === 'paused';
}

const COMMAND_PRIORITY: Record<string, number> = {
  play_artist: 1,
  play_song: 1,
  play_playlist: 2,
  set_play_mode: 3,
  set_volume: 4,
  favorite: 5,
  next: 6,
  previous: 7,
  sleep_timer: 7,
  cancel_sleep_timer: 7,
  query_sleep_timer: 7,
  stop: 8,
};

const FUZZY_MAX_GAP = 4;
const FUZZY_MIN_KEYWORD_LEN = 3;

// 这些词也是常见设备动作。只允许整句命中，不能从“停止扫地机器人”等句子中截取。
const EXACT_ONLY_STOP_KEYWORDS = new Set(['停止', '暂停', '关闭', '关机']);
const EXACT_ONLY_CANCEL_TIMER_KEYWORDS = new Set(['取消定时', '取消倒计时']);

function canMatchKeyword(query: string, command: VoiceCommand, keyword: string): boolean {
  const normalizedKeyword = keyword.trim();
  const exactOnly = (command.type === 'stop' && EXACT_ONLY_STOP_KEYWORDS.has(normalizedKeyword))
    || (command.type === 'cancel_sleep_timer' && EXACT_ONLY_CANCEL_TIMER_KEYWORDS.has(normalizedKeyword));
  return !exactOnly || query.trim() === normalizedKeyword;
}

function fuzzySubseqMatch(qRunes: string[], kwRunes: string[]): { lastIdx: number; inserted: number } | null {
  const keywordLength = kwRunes.length;
  if (keywordLength < FUZZY_MIN_KEYWORD_LEN || qRunes.length < keywordLength) return null;

  let best: { lastIdx: number; inserted: number } | null = null;
  for (let start = 0; start <= qRunes.length - keywordLength; start++) {
    if (qRunes[start] !== kwRunes[0]) continue;

    let keywordIndex = 1;
    let queryIndex = start + 1;
    while (queryIndex < qRunes.length && keywordIndex < keywordLength) {
      if (qRunes[queryIndex] === kwRunes[keywordIndex]) keywordIndex++;
      queryIndex++;
    }
    if (keywordIndex < keywordLength) continue;

    const lastIdx = queryIndex - 1;
    const inserted = (lastIdx - start + 1) - keywordLength;
    if (inserted > FUZZY_MAX_GAP) continue;
    if (best === null || inserted < best.inserted) {
      best = { lastIdx, inserted };
    }
  }
  return best;
}

/** 按最长关键词、最少跳字和命令优先级匹配一条已配置语音口令。 */
export function matchVoiceCommand(
  query: string,
  commands: VoiceCommand[],
  allowedTypes?: Set<string>,
): VoiceCommandMatch | null {
  const enabledCommands = commands
    .filter(command => command.enabled && (!allowedTypes || allowedTypes.has(command.type)))
    .map(command => ({ command, priority: COMMAND_PRIORITY[command.type] ?? 99 }));
  if (enabledCommands.length === 0) return null;

  let bestMatch: VoiceCommandMatch | null = null;
  let bestKeywordLength = 0;
  let bestPriority = 99;

  for (const item of enabledCommands) {
    for (const keyword of item.command.keywords) {
      if (!canMatchKeyword(query, item.command, keyword)) continue;
      const index = query.indexOf(keyword);
      if (index < 0) continue;

      const keywordLength = Array.from(keyword).length;
      if (keywordLength > bestKeywordLength || (keywordLength === bestKeywordLength && item.priority < bestPriority)) {
        bestKeywordLength = keywordLength;
        bestPriority = item.priority;
        bestMatch = {
          command: item.command,
          keyword,
          argument: query.slice(index + keyword.length).trim(),
        };
      }
    }
  }
  if (bestMatch) return bestMatch;

  const queryRunes = Array.from(query);
  let bestInserted = Infinity;
  for (const item of enabledCommands) {
    for (const keyword of item.command.keywords) {
      if (!canMatchKeyword(query, item.command, keyword)) continue;
      const match = fuzzySubseqMatch(queryRunes, Array.from(keyword));
      if (!match) continue;

      const keywordLength = Array.from(keyword).length;
      const better = keywordLength > bestKeywordLength
        || (keywordLength === bestKeywordLength && match.inserted < bestInserted)
        || (keywordLength === bestKeywordLength && match.inserted === bestInserted && item.priority < bestPriority);
      if (!better) continue;

      bestKeywordLength = keywordLength;
      bestInserted = match.inserted;
      bestPriority = item.priority;
      bestMatch = {
        command: item.command,
        keyword,
        argument: queryRunes.slice(match.lastIdx + 1).join('').trim(),
      };
    }
  }
  return bestMatch;
}
