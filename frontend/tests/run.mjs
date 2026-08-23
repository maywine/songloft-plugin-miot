import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const frontendRoot = path.resolve(new URL('..', import.meta.url).pathname);
const sourceRoot = path.join(frontendRoot, 'src');
const read = (file) => fs.readFileSync(path.join(sourceRoot, file), 'utf8');

const api = read('api.ts');
const store = read('store.ts');
const style = read('style.css');
const mainPage = read('views/MainPage.vue');
const settingsPage = read('views/SettingsPage.vue');
const rootApp = read('App.vue');
const runtime = read('runtime.ts');
const appBar = read('views/AppBar.vue');
const publicIcon = fs.readFileSync(path.join(frontendRoot, 'public/icon.svg'), 'utf8');
const switchComponent = read('ui/SlSwitch.vue');
const sliderComponent = read('ui/SlSlider.vue');
const iconFont = read('ui/iconFont.ts');
const nativeProps = read('ui/nativeProps.ts');
const mainEntry = read('main.ts');
const viteConfig = fs.readFileSync(path.join(frontendRoot, 'vite.config.ts'), 'utf8');
const selectComponent = read('ui/SlSelect.vue');
const slListView = read('ui/SlListView.vue');
const slButton = read('ui/SlButton.vue');
const slIcon = read('ui/SlIcon.vue');
const playerBar = read('views/PlayerBar.vue');
const fullscreenPlayer = read('views/FullscreenPlayer.vue');
const voiceSettings = read('views/settings/VoiceSettings.vue');
const scheduleSettings = read('views/settings/ScheduleSettings.vue');
const modePopup = read('views/PlayerModePopup.vue');
const speedPopup = read('views/PlayerSpeedPopup.vue');
const toolboxSettings = read('views/settings/ToolboxSettings.vue');
const volumePopup = read('views/PlayerVolumePopup.vue');
const sleepTimerPopup = read('views/PlayerSleepTimerPopup.vue');
const progress = read('views/PlayerProgress.vue');
const songRow = read('views/SongRow.vue');
const covers = read('covers.ts');
const playlistHandler = fs.readFileSync(path.join(frontendRoot, '../src/handlers/playlist.ts'), 'utf8');
const lyricHandler = fs.readFileSync(path.join(frontendRoot, '../src/handlers/lyric.ts'), 'utf8');
const voiceCommandHandler = fs.readFileSync(path.join(frontendRoot, '../src/handlers/voice_command.ts'), 'utf8');
const voiceEngine = fs.readFileSync(path.join(frontendRoot, '../src/voicecmd/engine.ts'), 'utf8');
const playerManager = fs.readFileSync(path.join(frontendRoot, '../src/player/manager.ts'), 'utf8');
const indexingManager = fs.readFileSync(path.join(frontendRoot, '../src/indexing/manager.ts'), 'utf8');
const pluginTypes = fs.readFileSync(path.join(frontendRoot, '../src/types.ts'), 'utf8');
const favorites = fs.readFileSync(path.join(frontendRoot, '../src/utils/favorites.ts'), 'utf8');
const authService = fs.readFileSync(path.join(frontendRoot, '../src/auth/service.ts'), 'utf8');
const accountHandler = fs.readFileSync(path.join(frontendRoot, '../src/handlers/account.ts'), 'utf8');
const safeAccount = fs.readFileSync(path.join(frontendRoot, '../src/account/safe_account.ts'), 'utf8');
const configHandler = fs.readFileSync(path.join(frontendRoot, '../src/handlers/config.ts'), 'utf8');
const deviceHandler = fs.readFileSync(path.join(frontendRoot, '../src/handlers/device.ts'), 'utf8');
const onlineSearcher = fs.readFileSync(path.join(frontendRoot, '../src/voicecmd/online_searcher.ts'), 'utf8');
const searchAuth = fs.readFileSync(path.join(frontendRoot, '../src/voicecmd/search_auth.ts'), 'utf8');
const conversationMonitor = fs.readFileSync(path.join(frontendRoot, '../src/conversation/monitor.ts'), 'utf8');
const aiAnalyzer = fs.readFileSync(path.join(frontendRoot, '../src/voicecmd/ai_analyzer.ts'), 'utf8');
const safeLog = fs.readFileSync(path.join(frontendRoot, '../src/utils/safe_log.ts'), 'utf8');
const pluginMain = fs.readFileSync(path.join(frontendRoot, '../src/main.ts'), 'utf8');
const configManager = fs.readFileSync(path.join(frontendRoot, '../src/config/manager.ts'), 'utf8');
const urlBuilder = fs.readFileSync(path.join(frontendRoot, '../src/player/url_builder.ts'), 'utf8');
const hostSecurity = fs.readFileSync(path.join(frontendRoot, '../src/utils/host_security.ts'), 'utf8');
const releaseWorkflow = fs.readFileSync(path.join(frontendRoot, '../.github/workflows/release.yml'), 'utf8');
const scheduler = fs.readFileSync(path.join(frontendRoot, '../src/schedule/scheduler.ts'), 'utf8');
const taskExecutor = fs.readFileSync(path.join(frontendRoot, '../src/schedule/executor.ts'), 'utf8');
const app = fs.readFileSync(path.join(frontendRoot, '../static/js/app.js'), 'utf8');
const html = fs.readFileSync(path.join(frontendRoot, '../static/index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(frontendRoot, '../plugin.json'), 'utf8'));

function collectTypeScriptFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(full);
    return entry.isFile() && entry.name.endsWith('.ts') ? [full] : [];
  });
}

const serverLogLines = collectTypeScriptFiles(path.join(frontendRoot, '../src'))
  .flatMap((file) => fs.readFileSync(file, 'utf8').split('\n').map((line) => ({ file, line })))
  .filter(({ line }) => /songloft\.log|console\.(log|warn|error)/.test(line));

assert.equal(manifest.renderEngine, 'webf');
assert.match(html, /static\/js\/app\.js/);
assert.match(html, /static\/css\/style\.css/);
assert.match(api, /apiGet\(path\)/);
assert.match(api, /postEnvelope/);
assert.match(store, /status\/ws/);
assert.match(store, /startStatusPolling/);
assert.match(store, /external_search_sources/);
assert.match(store, /selectCurrentPlaylistOnEntry/);
assert.match(store, /await selectCurrentPlaylistOnEntry\(\)/);
assert.match(store, /pendingConfigPatch/);
assert.match(store, /while \(pendingConfigPatch\)/);
assert.doesNotMatch(switchComponent, /flutter-cupertino-switch/);
assert.match(selectComponent, /getBoundingClientRect\(\)/);
assert.match(selectComponent, /sl-select-option-on/);
assert.match(selectComponent, /sl-select-wrap-open/);
assert.match(selectComponent, /sl-select-panel-fixed/);
assert.match(selectComponent, /sl-select-backdrop/);
assert.match(selectComponent, /addEventListener\('pointerdown', onPointerDown, true\)/);
assert.match(selectComponent, /addEventListener\('keydown', onKeydown, true\)/);
// 面板定位：优先向下 + 高度夹到该侧可用空间 + 下方不够时滚动让位，且滚动产生的
// scroll 回调必须被 repositioning 吞掉。旧逻辑恒用 320px 算空间，在 APP 的 ~520px
// 视口里必然翻到上方盖住表单（songloft-org/songloft-plugin-miot#80）。
assert.match(selectComponent, /function scrollNearestBy/);
assert.match(selectComponent, /positionPanel\(allowScroll = false\)/);
assert.match(selectComponent, /nextTick\(\(\) => positionPanel\(true\)\)/);
assert.match(selectComponent, /if \(!opened\.value \|\| repositioning\) return;/);
// fixed 的面板本体不能自己滚动：WebF 会把它自己的 scrollTop 计入 fixed 的绘制补偿
// （box_model.dart:1807），一滚面板就整体下移（songloft-org/songloft#397）。
// 滚动必须落在内层，且 window 上的 capture scroll 监听要忽略面板内部的滚动。
assert.doesNotMatch(style, /\.sl-select-panel \{[^}]*overflow(-y)?: (auto|scroll)/);
assert.match(style, /\.sl-select-panel \{[^}]*overflow: hidden/);
assert.match(style, /\.sl-select-panel-scroll \{[^}]*overflow-y: auto/);
assert.match(selectComponent, /class="sl-select-panel-scroll"/);
assert.match(selectComponent, /scrollStyle\.value = \{ maxHeight: `\$\{Math\.round\(height\) - 2\}px` \}/);
assert.doesNotMatch(selectComponent, /maxHeight: `\$\{Math\.round\(height\)\}px`/);
assert.match(selectComponent, /if \(target && panel\.value\?\.contains\(target\)\) return;/);
assert.match(mainPage, /openSelect\.value = null/);
assert.match(mainPage, /@click="openDevicePicker"/);
assert.match(style, /\.sl-select-wrap-open\s*\{\s*z-index: 80/);
assert.match(style, /\.miot-main-appbar[\s\S]*position: fixed/);
assert.match(style, /html\.webf-engine \.miot-app \* \{ transform-origin: 0 0; \}/);
assert.match(style, /html\.webf-engine \.player-volume-slider[^}]*transform: none/);
assert.match(style, /\.settings-scroll-body[^}]*height: calc\(100dvh - 56px\)[^}]*overflow: hidden/);
assert.match(style, /\.switch-track::after[^}]*transition: transform/);
assert.match(style, /\.switch input:checked ~ \.switch-track::after[^}]*translateX\(20px\)/);
assert.match(settingsPage, /class="settings-scroll-body"/);
assert.match(settingsPage, /openSelect\.value = null/);
assert.match(settingsPage, /<AppBar :title="appbarTitle" back @back="back"/);
assert.match(settingsPage, /window\.innerWidth < 600/);
assert.match(style, /--miot-nav-width: 280px/);
assert.match(style, /\.settings-nav-item[^}]*min-height: 60px[^}]*padding: 10px 16px/);
assert.match(style, /\.settings-mobile-menu \.settings-nav-title[^}]*font-size: 16px[^}]*line-height: 24px/);
assert.match(runtime, /page: 'main' as AppPage/);
assert.match(runtime, /export function openPage/);
assert.match(runtime, /export function closePage/);
assert.match(runtime, /devicePickerOpen/);
assert.match(runtime, /if \(state\.confirm\.open\) \{[\s\S]*resolveConfirm\(false\)/);
assert.match(runtime, /navigation\.devicePickerOpen = false/);
assert.match(rootApp, /v-if="navigation\.page === 'settings'"/);
// 刻意不套 KeepAlive：WebF 重新挂载缓存子树时不重排，第二次打开播放器整块不可见
// （songloft-org/songloft-plugin-miot#81）。
assert.match(rootApp, /<FullscreenPlayer v-if="navigation\.page === 'player'" \/>/);
assert.doesNotMatch(rootApp, /<KeepAlive>/);
assert.doesNotMatch(rootApp, /FullscreenPlayer v-show/);
assert.doesNotMatch(rootApp, /settingsOpen|playerOpen/);
assert.doesNotMatch(style, /\.page-overlay/);
assert.doesNotMatch(appBar, /<SlIcon|name="speaker"/);
assert.match(publicIcon, /viewBox="0 0 256 256"/);
assert.match(publicIcon, /<circle[^>]+fill="#E3EEFF"/);
assert.match(publicIcon, /<path[^>]+fill="#3B6FE0"/);
assert.match(publicIcon, /M680-80H280/);
assert.match(mainPage, /icon="speaker_group" title="选择设备"/);
assert.doesNotMatch(mainPage, /title="URL 播放"|title="文字播报"/);
assert.match(mainPage, /measureListHeight/);
assert.match(mainPage, /listBottom - listTop/);
assert.match(mainPage, /window\.addEventListener\('resize', remeasureList\)/);
assert.match(mainPage, /miot-page-with-player/);
assert.match(style, /--miot-list-height: clamp\(240px, calc\(100vh - 254px\), 720px\)/);
assert.match(style, /\.sl-list-view\s*\{[^}]*height: var\(--miot-list-height\)/);
assert.match(slListView, /class="sl-list-view sl-list-view-html"/);
assert.doesNotMatch(slListView, /webf-list-view/);
assert.doesNotMatch(mainPage, /:height="'var\(--miot-list-height\)'"/);
assert.match(mainPage, /songRenderLimit = ref\(20\)/);
assert.match(mainPage, /visibleSongs\.value\.slice\(0, songRenderLimit\.value\)/);
assert.match(mainPage, /songRenderLimit\.value = Math\.min\(songRenderLimit\.value \+ songRenderBatchSize/);
// #374 回归测试：定位当前播放歌曲前必须校验 WebF 是否已完成布局（否则 scrollTop 会被计算成 0，
// 表现为“定位功能始终回第一屏”），不允许在拿到零尺寸测量值时直接应用 scrollTop。
assert.match(mainPage, /rowRect\.height <= 0 \|\| list\.clientHeight <= 0/);
assert.match(mainPage, /locateTimer = setTimeout\(\(\) => scrollToCurrentSong\(attempt \+ 1\)/);
assert.match(slListView, /defineEmits<\{ scroll/);
assert.match(style, /\.player-bar-shell[\s\S]*position: fixed/);
assert.match(style, /\.song-cover[^}]*width: 48px[^}]*height: 48px/);
assert.match(songRow, /class="song-cover-img"/);
assert.match(songRow, /acquireCoverSlot/);
assert.match(covers, /access_token/);
assert.match(covers, /MAX_CONCURRENT_COVERS = 3/);
assert.match(playerBar, /songCoverUrl\(state\.player\.current_song, 96\)/);
assert.match(fullscreenPlayer, /songCoverUrl\(state\.player\.current_song, 768\)/);
assert.match(playerBar, /@error="coverFailed = true"/);
assert.match(fullscreenPlayer, /@error="coverFailed = true"/);
assert.match(voiceSettings, /class="command-keywords"/);
assert.match(voiceSettings, /addKeyword\(command, index\)/);
assert.match(voiceSettings, /removeKeyword\(command, index, keywordIndex\)/);
assert.match(voiceSettings, /setCommandEnabled\(index, \$event\)/);
assert.match(voiceSettings, /saveVoiceCommands\(\[\]\)/);
assert.match(voiceSettings, /device_id: state\.currentDeviceId/);
assert.match(voiceSettings, /account_id: state\.currentAccountId/);
assert.match(voiceSettings, /commandInputVersions/);
assert.match(style, /\.inline-fields\s*\{[^}]*flex-wrap: wrap/);
assert.match(style, /\.card\.miot-card\s*\{[^}]*padding: 0/);
assert.match(style, /\.player-mini-progress[\s\S]*height: 2px/);
// 1a7a63a 起播放条不再复用 <PlayerProgress mini>，改成自带的 player-bar-progress，
// 这条断言当时漏改、一直是红的。
assert.match(playerBar, /class="player-bar-progress"[\s\S]*player-bar-progress-fill/);
assert.match(playerBar, /@click="openPlayer"/);
// 1a7a63a 起宽屏播放条带上了「播放模式 / 音量 / 延迟停止 / 停止」工具区，窄屏由
// media query 隐藏。原来那两条 doesNotMatch 已与设计相反、一直是红的，改成正向断言。
assert.match(playerBar, /class="player-bar-tools"/);
assert.match(playerBar, /@change="setVolume"/);
assert.match(style, /@media \(max-width: 760px\)[\s\S]*\.player-bar-tools \{ display: none; \}/);
assert.doesNotMatch(playerBar, /mini-mode-control|mini-stop-control/);
assert.match(modePopup, /value: 'single'/);
assert.match(modePopup, /value: 'random'/);
assert.match(modePopup, /value: 'singlePlay'.*label: '单曲播放'.*icon: 'looks_one'/);
assert.doesNotMatch(modePopup, /value: 'repeat_one'|value: 'shuffle'/);
assert.match(modePopup, /const panelWidth = mobile \? 140 : 160/);
assert.match(modePopup, /height: `\$\{panelHeight\}px`/);
assert.match(modePopup, /Math\.max\(edgeInset, Math\.min\(centeredLeft/);
assert.match(modePopup, /aboveTop < edgeInset \? rect\.bottom \+ gap : aboveTop/);
assert.match(style, /\.player-mode-popup\s*\{[^}]*position: fixed[^}]*width: 160px/);
assert.match(style, /@media \(max-width: 599px\)[\s\S]*\.player-mode-popup\s*\{[^}]*width: 140px/);
assert.match(style, /@media \(max-width: 599px\)[\s\S]*\.player-mode-option\s*\{[^}]*height: 44px/);
assert.match(toolboxSettings, /ref\('https:\/\/lhttp\.qtfm\.cn\/live\/4915\/64k\.mp3'\)/);
assert.doesNotMatch(toolboxSettings, /sendUrl[\s\S]*url\.value = ''[\s\S]*catch/);
assert.match(pluginTypes, /'singlePlay'/);
assert.match(playerManager, /case 'singlePlay'[\s\S]*return 'singlePlay'/);
assert.match(playerManager, /this\.playMode === 'singlePlay'[\s\S]*this\.currentIndex \+ 1/);
assert.match(playerManager, /Single-play completed, pausing on current song/);
assert.match(fullscreenPlayer, /<PlayerModePopup/);
assert.match(fullscreenPlayer, /<PlayerVolumePopup/);
assert.match(fullscreenPlayer, /<PlayerSleepTimerPopup/);
assert.match(fullscreenPlayer, /action: next \? 'add' : 'remove'/);
assert.match(fullscreenPlayer, /isFavorite\.value = next/);
assert.match(fullscreenPlayer, /class="player-favorite-button"/);
assert.match(fullscreenPlayer, /class="fullscreen-tool-desktop player-favorite-button"/);
assert.equal((fullscreenPlayer.match(/player-icon/g) || []).length, 11);
assert.match(slButton, /playerIcon\?: boolean/);
assert.match(slButton, /:player-icon="playerIcon"/);
assert.match(slIcon, /favorite: 0xe25b/);
assert.match(slIcon, /looks_one: 0xf19e/);
assert.match(slIcon, /uiIconCodePoints/);
assert.match(slIcon, /props\.playerIcon \? playerIconCodePoints : uiIconCodePoints/);
assert.match(slIcon, /settings: 0xe8b8/);
assert.match(slIcon, /construction: 0xea3c/);
assert.match(slIcon, /'sl-icon-ui'/);
assert.doesNotMatch(modePopup, /looks_one_outlined/);
assert.match(style, /\.player-favorite-button\.player-control-active \.sl-icon[^}]*font-variation-settings: 'FILL' 1/);
assert.match(slIcon, /String\.fromCodePoint/);
assert.match(style, /\.material-symbols-outlined\.sl-icon-material-player[^}]*font-family: 'Material Icons Player'/);
assert.match(style, /\.material-symbols-outlined\.sl-icon-ui[^}]*font-family: 'Miot UI Icons'/);
assert.match(style, /miot-ui-icons\.otf/);
assert.match(style, /\.sl-select-backdrop[^}]*position: fixed/);
assert.match(style, /material-icons-player\.otf/);
assert.match(style, /\.player-favorite-button\.player-control-active[^}]*#f44336/);
assert.match(sleepTimerPopup, /status\.active \? 'alarm_on' : 'alarm'/);
assert.match(sleepTimerPopup, /choose\('time', 15\)/);
assert.match(sleepTimerPopup, /choose\('songs', 5\)/);
assert.match(style, /\.player-sleep-popup[^}]*width: 280px[^}]*max-width: calc\(100vw - 32px\)/);
// PlayerBar 工具区弹层右对齐，防止右侧溢出视口（#388）
assert.match(style, /\.player-bar-tools \.player-sleep-popup \{ left: auto; right: 0; transform: none; \}/);
assert.match(style, /html\.webf-engine \.player-bar-tools \.player-sleep-popup \{ left: auto; right: 0; \}/);
// WebF 下遮罩必须与弹层同一个挂载父级，否则透明遮罩会压住整个弹层、弹层内一切都点不到。
// WebF 按包含块挂载 widget：fixed 挂到 <html>，absolute 留在最近的定位祖先里，于是
// 遮罩的 z-index 231 在 <html> 层排序，而弹层的 232 只在 .player-popup-anchor 内有效，
// 其子树高度由祖先（.fullscreen-playback 220 / .player-bar-shell 80）决定，双双输给 231。
// 实测（Android WebF）点音量弹层里的静音按钮不会静音、只把弹层关掉。
assert.match(style, /\.player-popup-dismiss \{ position: fixed; z-index: 231; inset: 0;/);
assert.match(
  style,
  /html\.webf-engine \.player-popup-dismiss \{ position: absolute; inset: auto; top: -100vh; right: -100vw; bottom: -100vh; left: -100vw; \}/,
);
assert.match(sleepTimerPopup, /navigation\.playerPopup = props\.popupId;\s*emit\('refresh'\)/);
assert.match(style, /\.fullscreen-stage\s*\{\s*flex: 1 1 0%/);
assert.match(style, /\.fullscreen-mobile-slide \.fullscreen-cover-frame[^}]*height: 72vw[^}]*max-height: 320px/);
assert.match(style, /\.fullscreen-layout[^}]*padding-bottom: calc\(228px \+ var\(--sl-safe-bottom/);
assert.match(style, /\.fullscreen-playback[^}]*position: fixed[^}]*bottom: var\(--sl-safe-bottom[^}]*height: 228px/);
assert.match(fullscreenPlayer, /@seek="seekPlayer"/);
assert.match(fullscreenPlayer, /class="fullscreen-desktop-stage"/);
assert.match(fullscreenPlayer, /class="fullscreen-mobile-pager"/);
assert.match(fullscreenPlayer, /currentPager\.scrollLeft = target/);
assert.match(fullscreenPlayer, /pager\.scrollLeft = pager\.clientWidth \* index/);
assert.match(fullscreenPlayer, /mobileSettledPage === 0[\s\S]*ratio >= 0\.12[\s\S]*ratio <= 0\.88/);
assert.match(fullscreenPlayer, /@scroll\.passive="syncMobilePage"/);
assert.match(fullscreenPlayer, /icon="keyboard_arrow_down"/);
assert.doesNotMatch(fullscreenPlayer, /AppBar|正在播放/);
assert.match(fullscreenPlayer, /@touchstart\.passive="startMobileSwipe"/);
assert.match(fullscreenPlayer, /@touchend="finishMobileSwipe"/);
assert.doesNotMatch(fullscreenPlayer, /scrollIntoView/);
assert.match(fullscreenPlayer, /panel\.scrollTo\(\{ top:/);
assert.match(fullscreenPlayer, /result\.lyric \|\| result\.lxlyric/);
assert.match(lyricHandler, /success: true,[\s\S]*data: \{[\s\S]*lyric:/);
assert.match(fullscreenPlayer, /showMobilePage\(1\)/);
assert.match(fullscreenPlayer, /class="fullscreen-controls fullscreen-controls-desktop"/);
assert.match(fullscreenPlayer, /class="fullscreen-controls fullscreen-controls-mobile"/);
assert.match(style, /\.fullscreen-player\s*\{[^}]*height: 100dvh[^}]*overflow: hidden/);
assert.match(style, /\.fullscreen-desktop-stage\s*\{[^}]*grid-template-columns/);
assert.match(style, /\.fullscreen-mobile-pager\s*\{[^}]*scroll-behavior: auto/);
assert.match(modePopup, /player-mode-popup/);
assert.match(volumePopup, /player-volume-popup/);
assert.match(volumePopup, /orientation="vertical"/);
assert.match(sliderComponent, /orientation: props\.orientation/);

// WebF 字体迟到竞态（songloft-org/songloft-plugin-miot#81）：
// 图标必须能在字体到货后重建，原生滑块必须走 attribute 而不是 property。
assert.match(iconFont, /export const iconFontReady/);
assert.match(iconFont, /export const iconFontEpoch/);
assert.match(iconFont, /getBoundingClientRect\(\)\.width/);
assert.match(iconFont, /String\.fromCodePoint\(0xe88e\)/);
assert.match(iconFont, /String\.fromCodePoint\(0xe25b\)/);
assert.match(slIcon, /:key="iconFontEpoch"/);
assert.match(slIcon, /iconFontReady\.value/);
assert.match(mainEntry, /installIconFontWatch\(\);\s*\n\s*\ncreateApp\(App\)/);
assert.match(nativeProps, /export function bindNativeAttrs/);
assert.match(nativeProps, /removeAttribute\(key\)/);
assert.match(sliderComponent, /bindNativeAttrs\(native/);
assert.doesNotMatch(sliderComponent, /bindNativeProps/);
// PlayerProgress 也驱动 <songloft-slider>，同样只能走 attribute，否则 min/max
// 恒为 0/100，拖动进度条 seek 到的位置是错的。
assert.match(progress, /bindNativeAttrs\(nativeSlider/);
assert.doesNotMatch(progress, /bindNativeProps/);
// 原生滑块的 input 事件把新值放在 InputEvent.data 里（不是 CustomEvent.detail），
// valueFrom 必须优先读 event.data，否则 UIEvent.detail（恒为 0）会被 ?? 当作有效值。
assert.match(sliderComponent, /\(event as InputEvent\)\.data/);
assert.match(progress, /\(event as InputEvent\)\.data/);
assert.match(style, /html\.webf-engine \.player-volume-slider \.sl-slider-native[^}]*width: 28px[^}]*height: 112px/);
assert.match(viteConfig, /assetsInlineLimit: 16 \* 1024/);
assert.match(volumePopup, /function clampVolume\(value: number\)/);
assert.match(volumePopup, /ref\(clampVolume\(props\.modelValue\)\)/);
assert.match(progress, /player-seek-input/);
assert.match(playlistHandler, /router\.post\('\/player\/seek'/);
assert.match(playlistHandler, /router\.post\('\/player\/speed'/);
assert.match(speedPopup, /player-speed-button/);
assert.match(speedPopup, /const SPEEDS = \[0\.5, 0\.75, 1, 1\.25, 1\.5, 1\.75, 2\]/);
assert.match(fullscreenPlayer, /PlayerSpeedPopup[\s\S]*popup-id="full-speed"/);
assert.match(store, /export async function setPlaybackSpeed/);
// setVolume 不能走 playerCommand（会整体覆盖 state.player 导致音量归零 #382/#388）
assert.doesNotMatch(store, /setVolume[\s\S]*playerCommand/);
assert.match(store, /setVolume[\s\S]*await post\('\/mina\/volume'/);
assert.match(store, /setVolume[\s\S]*requestStatusRefresh/);
assert.match(playerManager, /playbackSpeed[\s\S]*getPlaybackSpeed/);
assert.match(pluginTypes, /play_speed: number/);
assert.match(pluginTypes, /speed: number;\s*\/\/ 当前播放倍速/);
assert.match(playlistHandler, /songloft\.playlists\.addSongs\(favPlaylist\.id, \[songId\]\)/);
assert.match(playlistHandler, /songloft\.playlists\.removeSongs\(favPlaylist\.id, \[songId\]\)/);
assert.match(favorites, /playlist\.id === 1/);

// 安全契约：权限、凭据、外部搜索鉴权和日志脱敏不能回退。
assert.ok(!manifest.permissions.includes('command'), 'MIoT 不使用命令桥，不得声明 command');
assert.ok(manifest.permissions.includes('songs.write'), '远程歌曲导入必须显式声明 songs.write');
assert.ok(manifest.permissions.includes('storage'), '小米凭据必须声明宿主 storage 权限以使用加密 secrets 存储');
assert.equal(manifest.version, '2026.8.23');
assert.match(manifest.updateUrl, /raw\.githubusercontent\.com\/maywine\/songloft-plugin-miot/);
assert.match(manifest.downloadSha256, /^[a-f0-9]{64}$/);
assert.doesNotMatch(authService, /updates:\s*Record<string, any>\s*=\s*\{[^}]*password[,}]/);
assert.doesNotMatch(authService, /autoLoginWithPassword/);
assert.match(authService, /removed \$\{scrubbedPasswords\} persisted password/);
assert.doesNotMatch(accountHandler, /\.\.\.a,|\.\.\.acc,/);
assert.match(safeAccount, /function toSafeAccount/);
assert.match(safeAccount, /has_pass_token: !!account\.pass_token/);
assert.doesNotMatch(safeAccount, /pass_token:\s*account\.pass_token/);
assert.match(searchAuth, /if \(isAbsoluteSearchURL\(sourceURL\)\) return ''/);
assert.match(onlineSearcher, /if \(authorization\) headers\.Authorization = authorization/);
assert.doesNotMatch(onlineSearcher, /Authorization:\s*authToken/);
assert.doesNotMatch(onlineSearcher, /body=' \+ text|url="' \+ pushUrl|playUrl="' \+ playUrl/);
assert.match(voiceSettings, /external-search-test/);
assert.doesNotMatch(voiceSettings, /source\.token\.trim\(\) \|\| window\.SongloftPlugin\?\.getAuthToken/);
assert.match(configHandler, /has_external_search_token/);
assert.match(configHandler, /has_api_key/);
assert.match(configHandler, /clear_token/);
assert.match(configHandler, /clear_api_key/);
assert.doesNotMatch(conversationMonitor, /q="\$\{q\.substring|a="\$\{a\.substring/);
assert.doesNotMatch(aiAnalyzer, /API response: \$\{content\.slice/);
assert.match(safeLog, /function redactURLForLog/);
assert.match(safeLog, /function safeErrorForLog/);
assert.match(pluginMain, /if \(validAddrs\.length === 0\)/);
assert.match(configManager, /songloft\.secrets\.get/);
assert.match(configManager, /songloft\.secrets\.set/);
assert.match(configManager, /password: ''/);
assert.match(urlBuilder, /getMediaToken\(\{ songId: song\.id, ttlSeconds \}\)/);
assert.match(hostSecurity, /purpose\?: 'proxy-transcode'/);
assert.match(hostSecurity, /function isHostPluginActive/);
assert.doesNotMatch(configHandler, /\/api\/v1\/jsplugins\//);
assert.doesNotMatch(indexingManager, /「\$\{songName\}|"\$\{bestGlobal\.(title|artist)\}|\$\{bestDirectLoc\.(songTitle|playlistName)\}/);
assert.doesNotMatch(deviceHandler, /account_id=\$\{account_id|device_id=\$\{device_id/);
assert.doesNotMatch(scheduler, /name=\$\{task\.name\}/);
assert.doesNotMatch(taskExecutor, /定时任务执行失败[^\n]*error=\$\{safeErrorForLog\(e\)\}/);
assert.match(releaseWorkflow, /delete manifest\.downloadSha256/);
assert.match(releaseWorkflow, /root\.downloadSha256 = crypto\.createHash\('sha256'\)/);
assert.match(releaseWorkflow, /paths:\s*\n\s*- '\.github\/release-request'/);
assert.match(releaseWorkflow, /VERSION="\$\(sed -n .* \.github\/release-request \| head -n 1 \| tr -d '\[:space:\]'\)"/);
assert.match(releaseWorkflow, /lock\.packages\[''\]\.version = version/);
assert.match(releaseWorkflow, /git add plugin\.json package\.json package-lock\.json/);
assert.match(releaseWorkflow, /git commit -s -m/);
for (const { file, line } of serverLogLines) {
  assert.doesNotMatch(
    line,
    /String\((e|error)\)/,
    `日志异常必须经 safeErrorForLog: ${path.relative(frontendRoot, file)}: ${line.trim()}`,
  );
  assert.doesNotMatch(
    line,
    /\$\{(pushUrl|playUrl|directUrl|query|question|answer)\}/,
    `日志不得直接插入 URL/语音正文: ${path.relative(frontendRoot, file)}: ${line.trim()}`,
  );
}
assert.match(voiceCommandHandler, /router\.post\('\/voice-commands\/sleep-timer'/);
assert.match(voiceEngine, /setSleepTimer\(/);
assert.match(playlistHandler, /status\.state === 'stopped'/);
assert.match(app, /MIoT/);
assert.ok(app.length > 50000, '生产 bundle 过小，可能没有包含 Vue 页面');

// WebF 只实现了 calc() / clamp()；CSS min() / max() 会被解析成 unknown 并当成 0，
// 元素在 APP 里直接消失而浏览器完全正常。整份样式表不允许出现这两个函数。
// minmax() 是 grid 轨道语法、由 grid.dart 解析，不受影响，要排除掉。
const cssMathFunctions =
  style.replace(/\/\*[\s\S]*?\*\//g, '').match(/(?<![-\w])(?<!min)(?:min|max)\(/g) || [];
assert.deepEqual(cssMathFunctions, [], `style.css 里不允许用 CSS min()/max()：${cssMathFunctions}`);
assert.match(style, /\.qr-box img[^}]*width: 100%; max-width: 200px/);
assert.match(style, /\.toast \{[^}]*max-width: 520px/);
assert.match(style, /\.toast-host[^}]*padding: 0 16px/);

// WebF 会把这两个表单容器「算出布局但不绘制」：探针里 getBoundingClientRect 返回
// 正常的 309x42，屏幕上和 uiautomator 里却整行都不存在
//（songloft-org/songloft-plugin-miot#79）。同页的 flex 容器一直正常，故必须用 flex。
assert.match(style, /\.field-grid \{ display: flex; flex-wrap: wrap; gap: 0 16px; \}/);
assert.match(style, /\.field-grid > \* \{ flex: 1 1 calc\(50% - 8px\); min-width: 0; \}/);
assert.match(style, /\.field-grid > \* \{ flex-basis: 100%; \}/);
assert.match(style, /\.sleep-timer-custom \{ display: flex;/);
const gridClasses = [...style.matchAll(/^\.([\w-]+)[^{]*\{[^}]*display: grid/gm)].map((m) => m[1]);
assert.ok(
  !gridClasses.includes('field-grid') && !gridClasses.includes('sleep-timer-custom'),
  `表单两列容器不能退回 display:grid：${gridClasses}`,
);
// 余下的 grid 容器（纯 button/section 子项）仍受「直接子项不能是 Sl* 控件」约束
gridClasses.push('field-grid', 'sleep-timer-custom');
const vueSources = fs
  .readdirSync(path.join(sourceRoot, 'views'), { recursive: true })
  .filter((f) => String(f).endsWith('.vue'))
  .map((f) => [String(f), read(path.join('views', String(f)))]);
for (const [name, source] of vueSources) {
  for (const gridClass of gridClasses) {
    const offenders = source.match(
      new RegExp(`class="[^"]*\\b${gridClass}\\b[^"]*"[^>]*>\\s*<Sl[A-Za-z]+`, 'g'),
    );
    assert.equal(
      offenders,
      null,
      `views/${name}：.${gridClass} 的直接子项不能是原生控件，要包一层 div：${offenders}`,
    );
  }
}
assert.match(voiceSettings, /field-grid"><div class="field"><SlInput v-model="sourceDrafts\[source\.id\]\.name"/);
assert.match(voiceSettings, /field-grid"><div class="field"><SlInput v-model="newSourceName"/);
assert.match(style, /\.grid-cell \{ min-width: 0; \}/);
assert.match(sleepTimerPopup, /sleep-timer-custom">\s*<div class="grid-cell"><SlInput/);

// 歌单下拉统一显示歌曲数（songloft-org/songloft-plugin-miot#79 评论）
assert.match(store, /export function playlistLabel/);
assert.match(store, /\$\{playlist\.name\} \(\$\{playlist\.song_count \?\? 0\}\)/);
for (const [name, source] of [
  ['MainPage', mainPage],
  ['ScheduleSettings', scheduleSettings],
  ['VoiceSettings', voiceSettings],
]) {
  assert.match(source, /playlistLabel\(/, `${name} 的 playlistOptions 应使用 playlistLabel`);
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
assert.equal(clamp(120, 0, 100), 100);
assert.equal(clamp(-1, 0, 100), 0);
assert.equal(clamp(42, 0, 100), 42);

console.log('miot frontend contract tests passed');
