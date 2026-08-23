# Songloft 智能音箱（MIoT）插件

通过小米 MiNA / MIoT 接口把 Songloft 中的本地歌曲、网络歌曲和外部搜索结果投放到智能音箱，并提供设备控制、语音口令、定时任务和多房间分组能力。

> ™️ **商标声明**：本插件中提到的 "MIoT" "MiHome" 等协议 / 产品名称均归各自商标权人所有，相关名称的出现仅出于互操作和指示性合理使用目的。本插件**未获得任何商标持有人的授权或背书**，与上述商标持有人**无任何关联**。

## 运行要求

- Songloft `2.11.7` 或更高版本。
- 音箱与 Songloft 服务器之间网络可达。容器部署时，播放地址应填写树莓派 / NAS 的局域网地址，例如 `http://192.168.1.10:58091`，不能使用音箱无法访问的 `127.0.0.1`。
- 插件本身与 CPU 架构无关，可运行在 Songloft 支持的 x86_64、ARM64 和 ARMv7 主机上，包括 Raspberry Pi Docker 部署。
- 小米账号和音箱由用户自行提供；插件不附带音乐内容或第三方音乐会员能力。

## 安装与校验

固定审计版本：[`v2026.8.23`](https://github.com/maywine/songloft-plugin-miot/releases/tag/v2026.8.23)

```bash
curl -fLO https://github.com/maywine/songloft-plugin-miot/releases/download/v2026.8.23/miot.jsplugin.zip
curl -fLO https://github.com/maywine/songloft-plugin-miot/releases/download/v2026.8.23/miot.jsplugin.zip.sha256

# 只采用校验文件首列的摘要，因此兼容校验文件中的构建目录前缀。
expected="$(awk 'NR == 1 {print $1}' miot.jsplugin.zip.sha256)"
printf '%s  %s\n' "$expected" miot.jsplugin.zip | sha256sum -c -
```

校验成功后，在 Songloft「插件管理」中上传 `miot.jsplugin.zip`。新安装默认保持停用；核对插件身份、权限和完整性信息后再手动启用。需要可复现部署时应关闭插件自动更新，每次升级都重新检查权限变化与 Release 摘要。

不要使用可变的 `latest` 下载地址固定生产部署。完整安全边界、威胁模型和实机验证证据见 [安全加固评估](docs/security-hardening-assessment.md)。

## 首次配置

1. 打开插件页面，在「服务器地址」中选择音箱能够访问的 Songloft 局域网地址。
2. 通过插件页面扫码或交互登录小米账号，再选择需要管理的音箱。不要通过聊天、Issue 或日志传递密码、Pass Token、Service Token、`ssecurity` 等凭据。
3. 本地曲库没有目标歌曲时，可在「外部搜索」中选择已安装的搜索提供方或配置兼容的搜索接口。插件本身不内置或分发第三方音乐内容。
4. 先用 TTS 或单个音频 URL 验证设备连通，再启用语音口令、定时任务和设备分组。

## 权限与凭据安全

| 权限 | 用途 |
|------|------|
| `storage` | 保存普通配置，并通过宿主 `songloft.secrets` 加密保存小米会话和第三方密钥 |
| `songs.read` / `songs.write` | 搜索曲库，并在用户选择远程搜索结果时写入网络歌曲 |
| `playlists.read` / `playlists.write` | 构建播放队列、同步收藏和歌单状态 |
| `inter-plugin` | 发现并调用用户启用的外部搜索提供方 |
| `websocket` | 推送播放状态与对话状态 |

插件不需要 `command`、通用网络 socket 或宿主管理员 Token。插件页面只获得绑定 `entryPath=miot` 的短期 scoped Token；小米凭据和外部服务密钥使用宿主 AES-GCM secrets 存储，配置接口仅返回 `has_*` 状态，不回传秘密原值。

## 设备分组（多房间同步）

把多台音箱归入同一「设备分组」后，对组内**任一**音箱的播放控制会自动同步给组内**其他**成员，实现多房间同步播放。

实现方式很简单：**一个分组共用一套播放列表**——同一份队列、播放索引、播放模式、切歌定时器与随机序列，所有指令一次性下发给组内全部音箱。

- **覆盖操作**：播放歌单、暂停、继续、停止、上一首、下一首、切换播放模式、调节音量，以及单曲 URL 推送。
- **命令入口全覆盖**：无论从插件网页的播放控制按钮、对音箱说语音口令（如「下一首」「停止」「调大音量」），还是定时任务触发，都会带动全组。
- **切歌与自动续播都同步**：因为全组只有一份队列/一个定时器/一次随机选择，无论手动切歌还是一首播完自动续播，全组始终是同一首，**随机模式下也不会各放各的**。
- **容错**：组内某台离线/失败只记录告警，其余音箱照常播放；离线的音箱恢复后，下一条指令（含自动切歌）会自然覆盖到它。
- **成员互斥**：一台设备最多属于一个组。把设备加入新组时会自动从其它组移除。删除分组或移出成员后，相关设备恢复独立播放。

配置入口：插件页 → 设置 → 设备 → **设备分组**。点「新建分组」，填名称并勾选至少 2 台已启用管理的设备即可。分组信息持久化在插件本地存储，跨重启保留。

> 说明：智能音箱各自独立接收云端指令，不存在帧级同步协议，成员之间可能有轻微起播时差，属正常现象。

## 定时任务 - 法定节假日

定时任务的「每周」调度支持中国法定节假日感知,有三种模式:

- **忽略节假日**(默认):完全按勾选的星期触发,行为与节假日无关。
- **仅法定节假日触发**:今天必须是法定放假日(春节、国庆等)才触发,且星期也需在勾选范围内。适合「节假日早晨播音乐迎接好心情」这类场景。
- **真·工作日(跳过节假日,含调休补班)**:勾选「周一到周五」后开启此模式,则节假日跳过、调休补班的周末强制触发,符合「真正上班日的闹钟」语义。

节假日数据来自 [NateScarlet/holiday-cn](https://github.com/NateScarlet/holiday-cn)(MIT 协议),由 `npm run build`(或 `dev`)的 `prebuild` 钩子从 jsDelivr / GitHub raw 下载,覆盖当前年和下一年,并通过 esbuild 编入插件 bundle。运行时不需要网络访问。

注意事项:
- 国务院通常每年 11 月公布次年安排,在此之前下一年的节假日数据为空,此时会按「平常日」处理(不影响普通调度,但「仅法定节假日触发」模式将不会触发)。
- 每次发版会自动滚动到最新数据;长期未更新的插件版本可能缺失最新节假日,建议定期升级插件。
- 数据下载产物已 commit 入库,本地无网络也可构建。

## 发版节奏

版本号就是发版日期(如 `2026.7.27`,无前导零)。CI 每天北京时间 08:17 自动检查一次:

- **自上次发版以来有会进入插件工件的源码或清单变化** → 构建并发布 `v<当天日期>`,即「今天的修改明天出新包」。
- **只有 README、审计文档或 CI 配置变化** → 跳过,不产生空版本。

所以版本号会跳日(比如 `2026.7.25` 的下一版是 `2026.7.27`),这是正常的——中间那天没有改动。需要立刻出包时,维护者可在 Actions 页手动触发,手动触发不受上述门禁限制。

同一版本的 tag 或 Release 已存在时，工作流会直接拒绝发布，绝不覆盖既有资产。需要再次发版时必须使用新的版本号。

## 作为搜索源接入 miot（供插件开发者）

miot 在本地曲库搜不到歌时,会调用用户配置的「外部搜索源」把歌找回来推给音箱。任何插件只要实现了搜索接口,就能把自己**登记为候选**,出现在 miot 配置页的搜索源下拉里供用户一键选用——不必再靠 miot 写死内置列表。

接入分两步:

### 1. 实现搜索接口 `/api/search/topone`

`POST`,请求/响应遵循 topone 规范(完整定义见 miot 配置页「外部搜索」区的**「接口规范」**对话框):

- 请求体 `{ keyword, hint?: { title, artist, duration }, quality? }`
- 成功响应 `{ code: 0, msg, data: { title, artist, album?, duration?, cover_url?, url?, plugin_entry_path?, source_data?, dedup_key?, lyric?, lyric_source? } }`
- 未命中 / 失败返回 `code != 0`、`data: null`;**超时 6 秒**

内置的 `ytdlp` / `bili` / `subsonic` 即此规范的参考实现。

### 2. 经插件间通信(`songloft.comm`)注册为候选

在你的 `plugin.json` 声明 `inter-plugin` 权限,并在 `onInit` 里向 miot 注册:

```ts
// 延迟 + 重试,规避与 miot 同时启动的竞态;
// miot 未安装 / 旧版 host 无 comm 时静默跳过,绝不阻塞自身功能。
function registerToMiot() {
  let attempts = 0;
  const tryRegister = async () => {
    attempts++;
    try {
      if (!songloft.comm || typeof songloft.comm.call !== 'function') return;
      await songloft.comm.call('miot', 'register-search-provider', {
        name: '我的音源',                  // 下拉显示名
        searchPath: '/api/search/topone',  // 你的搜索路由(默认即此,可省)
        icon: '',                          // 可选
      });
    } catch (e) {
      if (attempts < 5) setTimeout(tryRegister, 3000);
    }
  };
  setTimeout(tryRegister, 2000);
}
```

| action | 说明 |
|--------|------|
| `register-search-provider` | 注册 / 更新候选(幂等,按 entryPath 覆盖,每次 onInit 重复调用即可) |
| `unregister-search-provider` | 注销候选(可选,一般在 onDeinit 调用;payload 传空即可) |

要点:

- **不用传 entryPath**:miot 以宿主注入的**可信调用方身份**为准(`from`),插件无法把自己伪造成别的插件。
- **payload 字段**:`name`(显示名,缺省用 entryPath)、`searchPath`(默认 `/api/search/topone`)、`icon`(可选)。
- **纯增强、无副作用**:注册只是让你出现在候选下拉;是否启用由用户在配置页决定。miot 通过要求 `inter-plugin` 权限、且只返回单个 entryPath active 布尔值的宿主 bridge 校验状态，不读取插件管理清单；你被停用或卸载后会自动从列表消失。
- **向后兼容**:内置 `ytdlp/bili/subsonic` 也走这套注册流程,同时保留在 miot 的内置 fallback 列表中,兼容尚未接入的旧版本。

## 开发

```bash
npm ci
npm --prefix frontend ci
npm test
npm run build       # 生成 dist/miot.jsplugin.zip
npm run validate    # 校验清单与构建哈希
```

开发模式可运行 `npm run dev`，监听源码变化并自动上传到本地 Songloft。发布构建必须使用 lockfile 与 `npm ci`；详细发布约束见 [Release workflow](.github/workflows/release.yml)。

## Author

hanxi

## 免责声明

- 本项目**仅供个人学习研究技术使用**，严禁任何形式的商业用途，不得使用本代码进行任何形式的牟利 / 贩卖 / 传播。
- 本项目为实现设备互操作会调用第三方账号与设备接口，但不提供第三方账号、音乐内容或服务权益；通信产生的数据和账号凭据均由使用者自行提供与管理，本项目不拥有这些数据。
- 本项目完全免费，仅供个人私下范围研究交流学习技术使用，对于使用者在违反当地法律法规情况下使用本项目所造成的任何违法违规行为，由使用者自行承担。
- 若你使用了本项目，即代表你接受以上声明。

## License

Apache-2.0 © 2026 hanxi
