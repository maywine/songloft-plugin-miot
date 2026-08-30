import assert from 'node:assert/strict';
import { getDefaultVoiceCommands, migrateVoiceCommands } from '../src/voicecmd/defaults';
import { matchVoiceCommand, shouldExecuteFixedControl } from '../src/voicecmd/matcher';
import { buildCurrentSongPrewarmPath } from '../src/player/url_builder';
import type { VoiceCommand } from '../src/types';

const defaults = getDefaultVoiceCommands();
const stop = defaults.find(command => command.type === 'stop');
assert.ok(stop);
assert.equal(stop.keywords.includes('关闭'), false);
assert.equal(stop.keywords.includes('关机'), false);

assert.equal(matchVoiceCommand('关闭客厅灯', defaults), null);
assert.equal(matchVoiceCommand('停止扫地机器人', defaults), null);
assert.equal(matchVoiceCommand('十分钟后关闭空调', defaults), null);
assert.equal(matchVoiceCommand('十分钟后停止扫地机器人', defaults), null);
assert.equal(matchVoiceCommand('取消定时开灯', defaults), null);
assert.equal(matchVoiceCommand('暂停', defaults)?.command.type, 'stop');
assert.equal(matchVoiceCommand('请暂停播放音乐', defaults)?.command.type, 'stop');
assert.equal(matchVoiceCommand('十分钟后停止播放', defaults)?.command.type, 'sleep_timer');
assert.equal(matchVoiceCommand('取消定时', defaults)?.command.type, 'cancel_sleep_timer');
assert.equal(shouldExecuteFixedControl('stop', undefined), false);
assert.equal(shouldExecuteFixedControl('set_volume', 'stopped'), false);
assert.equal(shouldExecuteFixedControl('next', 'playing'), true);
assert.equal(shouldExecuteFixedControl('stop', 'paused'), true);
assert.equal(shouldExecuteFixedControl('cancel_sleep_timer', 'stopped', true), true);

const localSong = matchVoiceCommand('播放本地歌曲测试歌', defaults);
assert.equal(localSong?.command.type, 'play_song');
assert.equal(localSong?.argument, '测试歌');
const fuzzySong = matchVoiceCommand('我今天想听测试歌', defaults);
assert.equal(fuzzySong?.command.type, 'play_song');
assert.equal(fuzzySong?.argument, '测试歌');
const localLibrary = matchVoiceCommand('播放本地音乐', defaults);
assert.equal(localLibrary?.command.type, 'play_playlist');
assert.equal(localLibrary?.argument, '');

const legacy: VoiceCommand[] = [
  { type: 'stop', keywords: ['停止播放', '关闭', '关机'], enabled: true },
  { type: 'sleep_timer', keywords: ['分钟后停止播放', '分钟后停止', '分钟后关闭'], enabled: true },
  { type: 'play_song', keywords: ['播放歌曲'], enabled: true },
  { type: 'play_playlist', keywords: ['播放歌单'], enabled: true },
];
const migrated = migrateVoiceCommands(legacy);
const migratedStop = migrated.find(command => command.type === 'stop');
assert.deepEqual(migratedStop?.keywords, ['停止播放']);
assert.deepEqual(
  migrated.find(command => command.type === 'sleep_timer')?.keywords,
  ['分钟后停止播放'],
);
assert.equal(migrated.find(command => command.type === 'play_song')?.keywords.includes('播放本地歌曲'), true);
assert.equal(migrated.find(command => command.type === 'play_playlist')?.keywords.includes('播放本地音乐'), true);

const legacyClose: VoiceCommand[] = [
  { type: 'stop', keywords: ['关闭', '关机'], enabled: true },
];
assert.equal(matchVoiceCommand('关闭客厅灯', legacyClose), null);
assert.equal(matchVoiceCommand('关闭', legacyClose)?.command.type, 'stop');

assert.equal(
  buildCurrentSongPrewarmPath(
    { type: 'local', url: '/api/v1/songs/1/play' },
    { forceMp3: true },
  ),
  '/api/v1/songs/1/play?format=mp3',
);
assert.equal(
  buildCurrentSongPrewarmPath(
    { type: 'local', url: '/api/v1/songs/1/play?quality=192' },
    { normalize: true },
  ),
  '/api/v1/songs/1/play?quality=192&format=mp3&normalize=1',
);
assert.equal(
  buildCurrentSongPrewarmPath({ type: 'local', url: '/api/v1/songs/1/play' }, {}),
  '',
);
assert.equal(
  buildCurrentSongPrewarmPath({ type: 'radio', url: '/api/v1/songs/1/play' }, { forceMp3: true }),
  '',
);
assert.equal(
  buildCurrentSongPrewarmPath({ type: 'local', url: 'https://example.com/song.flac' }, { forceMp3: true }),
  '',
);

console.log('miot unit runtime tests passed');
