# MIoT 智能音箱插件安全加固调研

> 状态：调研基线 + 修复实施与树莓派部署记录（真实音箱播放待账号接入）
>
> 日期：2026-08-23
>
> 插件基线：`maywine/songloft-plugin-miot@ab80d351953614682da20f6416895711a04f2aff`（`v2026.8.21`）
>
> 宿主基线：`songloft-org/songloft@4f5c804da74cdcab25a26c0131fc5ec3b1b8537e`（`v2.11.6` 后续提交）

## 1. 目标与范围

本文重新评估 MIoT 插件在家庭树莓派部署中的风险，并给出后续修复边界。

最初调研阶段只产出结论；后续已按本文阶段 A/B 在插件、Songloft 宿主及 Flutter 商店界面实施修复并部署到树莓派。剩余验证状态见第 12 节。

审计覆盖：

- 插件 `plugin.json`、TypeScript 后端、Vue 前端、Release 工作流和依赖锁文件。
- `v2026.8.21` Release 的 `miot.jsplugin.zip` 与其中的 QuickJS 字节码。
- Songloft 宿主的权限桥、命令执行桥、插件 Token、插件存储和注册表安装流程。
- 小米账号登录、设备控制、对话监听、外部搜索、Webhook、AI 分析和播放 URL 生成链路。

## 2. 威胁模型

### 2.1 本轮明确接受的前提

用户确认家庭局域网通常没有恶意参与者，因此以下情况不作为首要修复目标：

- 同一 Wi-Fi/LAN 内恶意终端被动抓取 HTTP 音频流。
- 家庭路由器、交换机或 AP 被控制。
- 树莓派被物理接触、SSH 账号失守或 Docker daemon 被控制。
- 已登录的 Songloft 管理员主动窃取自己的配置。

这会把“LAN 内 HTTP 传输”从高优先级降为已知残余风险，但不代表 HTTP 本身安全，也不影响下面仍然成立的风险。

### 2.2 仍需防范的现实威胁

- GitHub 账号、Release、Actions 或 npm 构建依赖被供应链攻击。
- 插件后续更新引入恶意代码或无意扩大权限。
- 小米云端、外部搜索源、AI 服务或 Webhook 接收超出用户预期的数据。
- Token、密码、语音内容和签名 URL 意外进入本地日志、备份或 API 响应。
- 插件 bug 误改曲库、歌单或设备状态。
- Songloft 插件权限模型被无作用域 Token 或命令桥绕过。

### 2.3 安全目标

- 即使插件更新包被篡改，破坏面也不应自然扩大为容器内任意命令执行。
- 小米凭据只在必要位置持久化，不返回给浏览器、不写日志。
- 绝对地址的第三方服务绝不能自动收到 Songloft 内部 Token。
- 日志可以定位问题，但不包含 JWT、Pass Token、完整播放 URL 或家庭语音正文。
- 发布物应可固定、可校验、不可在同一版本号下静默替换。
- 插件权限应与实际调用保持最小化。

## 3. 审计结论摘要

未发现当前 `v2026.8.21` 含有主动后门、隐藏命令执行或未知域名外传逻辑：

- TypeScript 源码没有 `eval`、`new Function` 或动态远程脚本加载。
- 源码与发布字节码中均未发现 `songloft.command.*` 调用。
- Release ZIP 不含 `bin/` 或原生可执行文件。
- 插件未声明 `fs`、`fs:music`、`net` 或 `publicPaths`。
- 固定运行时域名主要是小米账号、MiNA/MIoT API；Webhook、AI 和外部搜索均为用户主动配置。
- 下载的 Release 原始 SHA-256 与 GitHub Release API 公布的 digest 一致。
- ZIP 内入口哈希和规范化内容哈希与包内清单一致。
- 根目录 `package-lock.json` 执行 `npm audit` 暂无已知漏洞。

本次留档的发布物校验值：

- `miot.jsplugin.zip` SHA-256：`32263f2606f56ca32469a433c3da35f25d75a5db68abbed273b90098aa76b8d1`
- ZIP 内 `entryHash`：`4fd876b399fbb2dcb75b6042cd3229e297cba6897dd1766e6d24ac0620c22b5b`
- ZIP 内 `zipHash`：`7c5e3a2da806037590095968824a472d1583fd612aba7d00b0d80c9abfb5280d`

但当前版本仍不能判定为低风险。最重要的问题不是“现有源码已经做了恶意行为”，而是权限和凭据设计让一次供应链失守可以快速升级为容器内代码执行、Songloft 全 API 控制和小米账号凭据泄露。

建议：先完成第 5 节的插件侧 P0 修复，再考虑在主账号上使用；宿主侧问题另行在 Songloft 父仓库处理。

### 3.1 必须修改 Songloft 宿主的三类能力

下面三类问题无法在 MIoT 插件内通过“自行加密”或删权限彻底解决，必须修改 `/home/wine/songloft`：

| 宿主改造类别 | 合并的发现项 | 必须由宿主提供的能力 | 插件侧临时措施的局限 |
|---|---|---|---|
| 插件身份、权限与媒体鉴权 | `HOST-SEC-001`、`HOST-SEC-002` | 按插件身份签发有 scope、短期、可撤销的 Token；另提供只允许指定媒体 GET/HEAD 的签名 URL | 插件仍需向音箱提供可访问 URL；只做日志脱敏不能阻止全权限 Token 到达小米云端，也不能阻止插件绕过 manifest 直调 REST |
| 宿主秘密存储 | `HOST-SEC-003` | `songloft.secrets` 或等价的宿主加密存储（可作为现有 `storage` 权限下的子能力）；目录 `0700`、文件 `0600`；明确备份与卸载生命周期 | 插件内硬编码密钥、设备 ID 派生密钥或可逆混淆都能被同一插件代码取回，只是安全假象 |
| 安装、更新与权限升级信任链 | `HOST-SEC-004`，以及 registry→ZIP 校验缺口 | 商店展示权限；安装后先保持 inactive；新增高风险权限时人工确认；校验 registry 与 ZIP 的身份、权限、hash/签名；支持固定原始 SHA | fork 可以发布 `.sha256`、禁用同 tag 覆盖，但旧宿主仍会只验证 ZIP 内自报 hash，并在安装后自动启用 |

后文第 7 节给出这三类能力的源码落点和详细方案。阶段 A 的插件修复用于立即缩小风险面；阶段 B 的宿主修复才完成安全边界闭环。

## 4. 发现项与优先级

| ID | 优先级 | 范围 | 结论 |
|---|---|---|---|
| MIOT-SEC-001 | P0 | 插件 | `command` 权限完全未使用，却允许容器内任意命令执行 |
| MIOT-SEC-002 | P0 | 插件 | 绝对 URL 外部搜索源未配置 Token 时，会收到 Songloft 全权限插件 Token |
| MIOT-SEC-003 | P0 | 插件 | 账号 API 遗漏 `pass_token` 脱敏，且密码登录会持久化原始密码 |
| MIOT-SEC-004 | P0 | 插件 | 在线搜索与播放日志会记录完整响应、签名 URL 和 `access_token` |
| MIOT-SEC-005 | P0 | 插件 | 对话监听默认 info 日志记录用户问题与小爱回答正文 |
| MIOT-SEC-006 | P1 | 插件 | 配置 GET 响应返回外部源 Token 与 AI API Key 原值 |
| MIOT-SEC-007 | P1 | 插件/CI | 发布清单哈希未与 Release 包同步，标签/资产允许同版本覆盖 |
| MIOT-SEC-008 | P1 | 插件/CI | 前端无 lockfile，Release 使用 `npm install`，构建不可完全复现 |
| HOST-SEC-001 | P0 | 宿主 | `plugin.getToken()` 返回无作用域、约 100 年有效且不可撤销的 JWT |
| HOST-SEC-002 | P0 | 宿主 | 插件可用上述 JWT 直接调用 REST API，绕过 manifest 权限边界 |
| HOST-SEC-003 | P1 | 宿主 | `songloft.storage` 文件以 `0644` 写入，没有敏感值存储能力 |
| HOST-SEC-004 | P1 | 宿主 | 商店不展示权限、安装后自动启用，更新也没有新增权限确认 |
| MIOT-RISK-001 | 接受/观察 | 外部依赖 | 使用未公开的小米账号、MiNA UBus 与 MIoT RPC，存在风控和失效风险 |

## 5. 插件仓库必须先修复的项目

### 5.1 MIOT-SEC-001：移除未使用的 `command` 权限

证据：

- `plugin.json` 声明 `command`。
- 全仓搜索没有 `songloft.command`、`command.exec`、`command.start` 或 `command.download` 调用。
- 发布 ZIP 只有 `main.jsc` 和静态前端资源，没有 `bin/`。

宿主的命令桥可运行 PATH 程序或任意干净的绝对路径，支持参数、stdin、环境变量并继承 `os.Environ()`。这等价于允许恶意更新执行 `/bin/sh -c ...`。在当前容器中，进程虽然是 UID 1000 而非 root，但仍能读取容器环境变量、`/app/data`、`/app/music`，并访问家庭网络和公网。

修复：

- 从 `plugin.json` 删除 `command`。
- 增加静态测试，禁止源码再次出现 `songloft.command.*` 时未同步更新安全说明。
- 保留 `songs.write`：远程歌曲导入确实属于歌曲写操作；宿主完成 scope 校验后，该声明会成为有效的 REST 授权依据。

涉及文件：

- `plugin.json`
- `frontend/tests/run.mjs` 或新增 `tests/security-contract.test.mjs`

### 5.2 MIOT-SEC-002：禁止把内部 Token 发给绝对地址搜索源

当前逻辑：

1. 相对路径搜索源会拼到 Songloft loopback，属于内部插件调用。
2. 绝对 `http(s)://` URL 属于外部服务。
3. `resolveSourceToken()` 在没有用户自定义 Token 时，对二者一律回退到 `songloft.plugin.getToken()`。

因此管理员只要添加一个没有单独 Token 的外部搜索源，该服务就会收到全权限 Songloft 插件 JWT。可信 LAN 假设无法降低公网绝对 URL 的风险。

修复规则：

- 用户显式配置 `source.token`：保持现有语义，按配置发送。
- 相对路径：使用 `Bearer <pluginToken>` 调用内部插件。
- 绝对 URL 且未配置 Token：完全省略 `Authorization` 头。
- 不发送空的 `Authorization` 头。

涉及文件：

- `src/voicecmd/online_searcher.ts`
- 对应单元测试

必测场景：

- `/api/v1/jsplugin/foo/api/search/topone` 自动使用插件 Token。
- `https://example.com/search` 不自动携带插件 Token。
- 绝对 URL 配置自定义 Token 时只携带该 Token。
- 搜索失败日志不得出现 Authorization 值。

### 5.3 MIOT-SEC-003：收敛小米凭据持久化与 API 返回面

现状：

- 密码登录成功后会把原始密码直接写入账号配置。
- 扫码/手动 Token 登录会保存 `pass_token`。
- `service_token` 与 `ssecurity` 也会持久化，用于重启恢复。
- `GET /accounts` 与 `GET /account` 通过对象展开返回账号字段，只覆盖了 `password` 和 `services`，遗漏了 `pass_token`。
- 类型注释声称 `password` 是“加密后密码”，实际保存的是原值，注释与行为不一致。

插件侧修复：

- 提取唯一的 `toSafeAccount()` DTO，使用字段白名单，不再对敏感对象做 `...spread`。
- API 响应不包含 `password`、`pass_token`、`service_token`、`ssecurity`；仅返回 `has_pass_token`、服务是否已配置等布尔状态。
- 密码登录成功后不再持久化原始密码；优先依赖登录得到的 `passToken` 自动续期。
- 对已存在账号做惰性迁移：成功读到 `pass_token` 后清空历史 `password`。
- `passToken` 续期失败时提示用户重新扫码，不再自动回退到落盘密码。
- 修正 `AccountConfig.password` 的错误注释。

保留的残余风险：

- 为了跨重启续期，`passToken` 仍需持久化。
- 真正的加密静态存储需要宿主提供 secret storage；插件内硬编码密钥或可逆混淆属于安全假象，不采用。

涉及文件：

- `src/auth/service.ts`
- `src/config/manager.ts`
- `src/handlers/account.ts`
- `src/types.ts`
- `frontend/src/types.ts`
- `frontend/src/views/settings/DeviceSettings.vue`

### 5.4 MIOT-SEC-004：禁止记录完整 URL、请求体和响应体

当前高风险日志包括：

- 外部搜索请求体与完整响应体。
- no-import 的完整直推 URL。
- 带 `access_token` 的 `/proxy/transcode` URL。
- 导入后包含 `access_token` 的 `playUrl`。
- 外部源返回的临时签名 CDN URL 和 `source_data`。

这些是写入原始 Docker/文件日志的内容。宿主“导出日志”虽然会二次脱敏，但不会改变已经落盘的原始日志，也不会保护 Docker 日志读取者。

修复：

- 新增统一日志工具：
  - `redactURLForLog()`：保留 scheme/host/path，删除 userinfo，查询参数只保留 key 名。
  - `summarizeSearchResultForLog()`：只保留状态、title/artist 长度、是否有 URL/源数据，不输出内容。
  - `safeErrorForLog()`：避免把远端响应正文和签名 URL原样拼进错误。
- `OnlineSearcher` 不再记录请求/响应 body，不记录 `pushUrl`/`playUrl`。
- 失败日志只记录 source id、HTTP 状态、耗时和是否走转码。
- 禁止任何日志出现 `access_token=`、`Authorization`、`passToken`、`serviceToken`、`ssecurity` 或 AI key。

涉及文件：

- `src/voicecmd/online_searcher.ts`
- `src/utils/` 下新增日志脱敏工具
- 日志契约测试

### 5.5 MIOT-SEC-005：默认日志不记录家庭语音正文

对话监听在每条新消息到达时，即使 `conversation_poll_debug=false`，仍会以 info 级别记录用户问题和小爱回答各最多 80 字。语音引擎还会记录 query、keyword 和 argument。

修复：

- info/warn 仅记录时间戳、设备匿名标识、消息数量、命令类型、匹配来源和耗时。
- 默认不记录用户原始 query、回答正文、歌名参数或 AI 返回正文。
- 调试开关也不应恢复原始 Token/URL；如确需语音正文调试，增加独立、显式、带警告且自动过期的开关，而不是复用轮询 debug。
- Webhook 仍可发送完整消息，但必须由用户显式配置；设置页明确显示“会把语音内容发送到该地址”。
- AI 开启前明确提示“用户语音文本将发送至所配置模型服务”。

涉及文件：

- `src/conversation/monitor.ts`
- `src/voicecmd/engine.ts`
- `src/voicecmd/ai_analyzer.ts`
- `frontend/src/views/settings/VoiceSettings.vue`

## 6. 插件仓库的 P1 加固

### 6.1 MIOT-SEC-006：API 不返回第三方密钥原值

`GET /config` 当前返回：

- `external_search_token`
- `external_search_sources[*].token`
- `ai_config.api_key`

这些接口需要 Songloft 认证，在“唯一可信管理员”模型下不是直接越权，但会扩大浏览器扩展、前端 XSS、截图和调试工具的泄露面。

建议改成 write-only secret 语义：

- GET 只返回 `has_token` / `has_api_key`。
- 更新请求不带该字段表示保留旧值；显式空字符串表示删除。
- UI 显示固定掩码，不把真实值重新填回表单。

### 6.2 MIOT-SEC-007：修复发布物身份与哈希链

本次实际观测：

- 仓库根 `plugin.json`：`entryHash=e64dda...`、`zipHash=b10ed5...`。
- `v2026.8.21` ZIP 内 `plugin.json`：`entryHash=4fd876...`、`zipHash=7c5e3a...`。
- ZIP 内哈希与实际文件相符，但根清单与 Release 不相符。
- 宿主商店安装不比较根清单哈希与下载包，只验证下载包内部自报哈希。
- Release workflow 会删除并重建同名 tag/Release，同一版本资产可被替换。
- `v2026.8.21` 是未签名轻量 tag。

这不证明当前包被篡改，但说明 hash 只能检查包内部一致性，不能证明发布者身份。

建议：

- 同名 tag/Release 已存在时直接失败，禁止覆盖。
- 生成 Release 前把最终 ZIP 内 hash 同步回仓库根 `plugin.json` 并验证一致。
- 为 Release 发布原始 ZIP 的 `.sha256` 文件。
- 使用不可变、签名的 annotated tag；条件允许时增加 GitHub artifact attestation 或 cosign。
- GitHub Actions 引用固定 commit SHA，而不是仅使用 `@v4` 大版本标签。
- 安装文档给出固定版本与 ZIP SHA，不默认指向 `latest`。

### 6.3 MIOT-SEC-008：锁定前端构建依赖

根构建使用 `npm ci`，但 `frontend/` 没有 lockfile，Release workflow 在其中执行 `npm install`，实际 Vue/Vite/WebF 版本可随时间变化，同一源码无法稳定复现同一包。

建议：

- 提交 `frontend/package-lock.json`。
- Release 改为 `cd frontend && npm ci && npm run build`。
- 构建后执行前端测试、插件 validate 和产物哈希检查。
- 记录构建 Node/npm 版本。

## 7. 必须由 Songloft 宿主修复的问题

### 7.1 HOST-SEC-001：使用短时、限用途的媒体 Token

当前 `songloft.plugin.getToken()` 返回 `client_id=plugin-system`、约 100 年过期的 JWT。验证时该身份跳过数据库撤销检查。MIoT 把它放入歌曲播放 URL，再通过小米云端 UBus 下发给音箱。

可信 LAN 只降低音箱拉流阶段被邻居抓包的概率，不能解决：

- URL 会作为控制指令内容到达小米云端。
- 插件 bug 可能把 URL 写入本地日志或外部搜索响应。
- Token 没有 scope，可访问全部受保护 REST API。
- 旧 Token 在持久化 `jwt_secret` 不变时仍可通过签名验证，重启不等于撤销。

宿主建议：

- 增加专用媒体签名 URL，声明 song id/path、允许方法、客户端用途和 5–15 分钟过期时间。
- 媒体 Token 只允许 GET/HEAD 播放、HLS/转码子资源，不允许歌曲写入、配置、插件管理或日志接口。
- 音箱重试需可复用，故不强制一次性，但必须短时和限路径。
- 插件通过专门 bridge 获取媒体 URL，不再取得全局内部 JWT。

涉及父仓库候选文件：

- `internal/services/auth_service.go`
- `internal/middleware/auth.go`
- `internal/handlers/music.go`
- `internal/handlers/proxy.go`
- `internal/jsplugin/api_bridge.go`

### 7.2 HOST-SEC-002：权限不能被 REST + 全局 Token 绕过

旧宿主中的 `plugin.*` 是无声明权限的内置能力，任意插件均可取得全局 Token，再通过 loopback REST 调用超出 manifest 的接口。MIoT 的远程歌曲导入使用 REST 路径，因此新宿主必须把它限制到 manifest 明确声明的 `songs.write` scope。

宿主建议：

- 给每个插件生成带 `entryPath` 与权限 scope 的独立短期 Token。
- REST handler 根据 scope 做二次授权，不能只验证“JWT 签名有效”。
- 优先通过强类型 bridge 暴露所需业务能力，避免插件拿通用管理员 Token。
- 记录并审计插件身份执行的写操作。

### 7.3 HOST-SEC-003：提供 secrets storage

当前普通 `songloft.storage` 是插件命名空间文件，目录 `0755`、文件 `0644`。对家庭单用户树莓派，其他本地用户读取概率较低，但备份、日志打包、误挂载和命令权限仍会暴露内容。

宿主建议：

- 普通 storage 文件至少改为目录 `0700`、文件 `0600`。
- 新增 `songloft.secrets`，由宿主使用本机密钥加密保存，API 只允许插件自身按 key 读写。
- 卸载/清除数据时明确处理 secret 生命周期。
- 不采用插件内硬编码密钥。

### 7.4 HOST-SEC-004：安装和更新时展示权限差异

当前商店条目不包含 permissions，点击安装后插件会自动启用；更新若增加 `command` 等权限，也没有权限升级确认。自动更新虽默认关闭，但一旦开启，会每 6 小时检查、下载并热重载。

宿主建议：

- 商店展示 manifest permissions、publicPaths、externalPaths 和风险分级。
- 新安装默认 inactive，用户确认权限后再启用。
- 更新新增高风险权限时阻塞自动更新并要求确认。
- registry manifest 与 ZIP manifest 必须比较身份、版本、权限和 hash。
- 支持按 Release 原始 SHA-256 固定安装。

## 8. 在可信 LAN 前提下可接受或延后的风险

### 8.1 LAN HTTP 播放

当前树莓派地址为局域网 HTTP。既然家庭 LAN 被视为可信，可以暂不为了音频流强制部署公网证书或复杂内网 PKI。

但前提是完成宿主短期媒体 Token；“LAN 可信”不能成为继续使用 100 年全权限 JWT 的理由。

### 8.2 Webhook / AI / 外部 URL 的内网访问

这些地址由已认证管理员主动配置。在不考虑恶意管理员和前端 XSS 的模型下，SSRF 风险可以延后处理。仍需：

- 设置页明确数据会发送到哪里。
- 日志不记录密钥和完整响应。
- 默认关闭；开启时给出确认提示。

### 8.3 未公开的小米接口

这是功能成立所依赖的残余风险，无法由本 fork 根治。应在 README 明确：

- 与小米无官方隶属或授权关系。
- 账号可能触发验证码、风控或 Token 失效。
- 固件/API 改动可能导致功能随时中断。
- 推荐使用已通过米家共享、能正常枚举音箱的独立账号；不可行时由用户自行权衡主账号风险。

## 9. 建议实施顺序

### 阶段 A：仅修改本 fork，优先完成

1. 最小权限：删除未使用的 `command`，保留实际需要且由新宿主强制执行的 `songs.write`。
2. 修复绝对搜索源泄漏内部 Token。
3. 账号安全 DTO：API 永不返回 `pass_token` 等秘密。
4. 停止持久化小米原始密码，并迁移清理旧值。
5. 清理完整 URL、搜索 body、对话正文和 AI 内容日志。
6. 把外部源 Token / AI key 改为 write-only UI 语义。
7. 补安全契约测试、前端 lockfile 和不可变 Release 流程。

阶段 A 不改变：设备发现、扫码登录、自动续期、播放控制、语音匹配、歌单、定时任务和在线搜索协议。

### 阶段 B：修改 Songloft 父仓库

1. 短期且限路径的媒体 Token。
2. 按插件身份和 manifest scope 限制 REST 权限。
3. `songloft.secrets` 与 `0600` 存储。
4. 商店权限展示、权限升级确认和 registry→ZIP 强校验。

在阶段 B 完成前，即使阶段 A 已完成，仍应保持：

- Songloft 仅在可信 LAN 开放，不映射到公网。
- 插件自动更新关闭。
- 安装固定审计版本并核对原始 ZIP SHA-256。
- Webhook、AI 和外部搜索按需开启。

## 10. 验证矩阵

### 10.1 静态检查

- `plugin.json` 不含 `command`、未使用权限。
- 全仓无 `songloft.command.*`。
- 全仓日志调用不出现完整 JWT、Pass Token、Service Token、API key、Cookie 或带 query 的播放 URL。
- Release 根清单、ZIP 内清单和实际内容 hash 一致。
- tag 不可覆盖且有签名/attestation。

### 10.2 单元测试

- `GET /accounts`、`GET /account` 响应序列化后不含 `pass_token`、`password`、`service_token`、`ssecurity`。
- 密码登录成功后持久化对象中 `password` 为空。
- 旧账号含 password + passToken 时会清空 password 且保持自动登录。
- 相对搜索源自动携带内部 Bearer Token。
- 绝对搜索源无自定义 Token 时没有 Authorization 头。
- 绝对搜索源配置自定义 Token 时仅发送自定义 Token。
- 任何搜索成功/失败日志都不包含 `access_token=` 或原始直链 query。
- 对话监听默认日志不含 question/answer 正文。

### 10.3 集成验证

- 全新安装后扫码登录、重启插件和重启 Songloft，账号仍能自动恢复。
- 本地歌曲播放、暂停、续播、上下曲和音量控制不回归。
- 相对插件搜索源、绝对自建搜索源、no-import 转码三条链路分别通过。
- 检查树莓派原始 Docker 日志，确认无 JWT、Pass Token、完整语音正文和签名 URL。
- 插件卸载并保留/删除数据两种路径符合凭据生命周期预期。
- 自动更新关闭时不会后台替换包。

### 10.4 宿主加固后的验证

- 媒体 Token 过期后播放 URL 返回 401/403。
- 媒体 Token 可 GET/HEAD 指定歌曲，但不能访问 `/configs`、插件管理、歌曲写接口或日志导出。
- 旧插件 Token 可撤销，重启后旧 Token 不再有效。
- 插件更新新增高风险权限时不会自动热加载。

## 11. 已确认决策

用户已确认：

1. 阶段 A 插件修复与阶段 B Songloft 宿主修复全部实施。
2. 原始密码不再持久化；Pass Token 失效后接受重新扫码/交互登录。
3. 树莓派部署使用固定版本与原始 ZIP SHA-256，插件自动更新保持关闭。
4. 家庭 LAN 继续视为可信边界，但该前提不用于放宽 Token scope、有效期或秘密存储。

## 12. 修复实施状态（2026-08-23）

### 12.1 插件阶段 A

- `command` 已从清单移除；保留远程歌曲导入实际需要的 `songs.write`。
- 绝对搜索源未配置专用 Token 时不再携带 Songloft Token；设置页测试请求改由插件后端发起。
- 账号 API 改为安全 DTO；原始密码不落盘，历史密码在启动时清理。
- Pass Token、Service Token、`ssecurity`、外部源 Token 和 AI key 已迁移到 `songloft.secrets`；配置 API/UI 使用 write-only 语义。
- 搜索、播放、MiNA/MIoT、认证、定时任务和对话日志已改为长度、状态、匿名 ID 与脱敏 URL，不记录家庭语音/AI 正文或完整响应。
- 发布工作流固定 Actions commit、使用两级 lockfile + `npm ci`、拒绝复用 tag/Release、生成 `.sha256`、annotated tag 和 GitHub artifact attestation。

本地构建产物 `v2026.8.23`：

- `miot.jsplugin.zip` 原始 SHA-256：`3afdecdbc7b22572913f780898978938d29e2b43d31817020b8abc5a8828879a`
- ZIP 内 `entryHash`：`fec5df1e3b58bb1fcc38bfdb2ed3e54f4c40e123e5dca123580e8f3f804c3cb5`
- ZIP 内 `zipHash`：`42dc06166925a77820b2803b42b01fc9235b3a3e5787ec77425688ff9c6b1490`

GitHub Release `v2026.8.23`：

- `miot.jsplugin.zip` 原始 SHA-256：`1b6facc9dfb30f0e02ad3b6141ecb780fe6e0b87bd70ed8491357205aa543edc`
- ZIP 内 `entryHash`：`fec5df1e3b58bb1fcc38bfdb2ed3e54f4c40e123e5dca123580e8f3f804c3cb5`
- ZIP 内 `zipHash`：`42dc06166925a77820b2803b42b01fc9235b3a3e5787ec77425688ff9c6b1490`
- Release API digest、随附 `.sha256` 文件与独立下载后的本地计算一致。

### 12.2 宿主阶段 B

- `plugin.getToken()` 改为 15 分钟、绑定 `entryPath + scopes + generation` 的 JWT；REST 中间件按方法和路径二次授权，旧 `plugin-system` 无作用域 Token 拒绝。
- MIoT 不再用 scoped Token 读取 `/jsplugins/` 管理清单；搜索提供方状态改走只返回单个 entryPath active 布尔值、且要求 `inter-plugin` 的最小化 bridge。
- 插件静态前端不再接收管理员 JWT：客户端通过专用管理端点取得 scoped Token，最多每分钟在当前页面内存中原地刷新，认证 Token 不读写共享 localStorage，启停/更新时立即重新签发且不周期性重载页面；iframe 属性与 HTML 响应 CSP 都使用不含 `allow-same-origin` 的 sandbox，顶层直开/弹窗同样保持 opaque origin，并禁止 Referer 外带 Token。
- `plugin.getMediaToken()` 只授权指定 song 或 `/proxy/transcode` 的 GET/HEAD，最长 12 小时；`getFileUrl()` 绑定单个插件文件。
- 禁用、卸载、error、恢复和热更新都会撤销当前 generation；每次进程使用随机 issuer，重启后旧特殊 Token 失效。
- 新增 AES-GCM `songloft.secrets`；普通/秘密存储目录和文件分别为 `0700`/`0600`，历史普通文件首次读取时收紧。
- 新安装默认 `inactive`；不同身份覆盖同一 entryPath 也强制停用并卸载旧实例；只有 active 插件的 `publicPaths` 进入免鉴权表。
- 商店不同身份的 entryPath 冲突必须单独确认替换，并明确警告新插件会继承该 entryPath 下的普通数据与加密凭据；未确认时不落盘。
- 商店返回权限、路径、风险、能力差异与完整性字段；Flutter 在商店安装、更新、强制更新和启用前展示确认。
- 商店安装必须命中 5 分钟内的服务端清单缓存；外部清单与 ZIP 的身份、版本、权限、路径、`entryHash`、`zipHash` 必须一致，可选 `downloadSha256` 固定原始 ZIP。
- 更新新增 permission / `publicPaths` / `externalPaths` 时写盘前返回 409；只有显式 `approve_capabilities=true` 且回传展示时的清单摘要才放行，版本、能力或哈希变化会要求重新确认，自动更新不代批准。

### 12.3 已完成验证

- MIoT：`npm test`、根/前端 TypeScript 检查、生产构建、`songloft-plugin validate` 通过。
- Songloft：`make check`（fmt + vet + 全量 Go 测试）、Swagger 生成、2.11.7 完整生产编译通过。
- Flutter：插件商店/前端 Token 链定向 analyze、21 项定向测试、embedded Web 构建通过。
- 本地真实实例：新安装返回 `inactive`；启用后配置 API 不返回 AI key；磁盘秘密不含明文且权限为 `0700/0600`；未确认新增 `net` 权限返回 409 且已装版本/权限未改变。
- 本地真实浏览器：iframe 属性与响应 CSP 都无 `allow-same-origin`，读取 `localStorage` 返回 `SecurityError`；页面只取得 `token_kind=plugin`、绑定 `entryPath=miot` 的 scoped Token，自身配置接口返回 200，宿主管理配置接口在 CORS 预检阶段被阻断。等待一次 60 秒轮换后 JTI 已变化而插件文档导航次数保持 1；顶层直开无 Token 时同样为 opaque origin 且自身 API 返回 401，携 scoped Token 时仅自身 API 返回 200。
- 三个仓库修复已提交并推送：插件主体 `d58a33c`、QuickJS 实机兼容补充 `77f263b`、Player `7ca9878`、宿主 `1c2884c`；宿主另以 `3fa01ee` 修正 Player 子模块 URL，使 fork-only commit 可被全新拉取。
- 树莓派运行 `linux/arm64` 完整版宿主 `2.11.7`（commit `3fa01ee`），容器为 healthy，使用 `/home/pi/songloft/{data,music}` 持久化；升级前快照位于 `/home/pi/songloft/data.backup-20260823-212235`。
- `Release Plugin` workflow run `32643868306` 全部成功，生成 signed-off manifest commit/tag `4d5afe6`、不可变 Release、`.sha256` 和 provenance attestation。
- 树莓派已导入 GitHub Release ZIP，并在重启后保持 ID 2、active；安装文件原始 SHA-256 与 Release 一致，`entryHash`、`zipHash` 与本节 12.1 一致，`command` 权限未再出现。
- 树莓派实测 scoped Token 有效期 900 秒：访问自身 `/jsplugin/miot/accounts` 返回 200，访问宿主 `/configs` 返回 403；页面响应包含不带 `allow-same-origin` 的 CSP sandbox 与 `Referrer-Policy: no-referrer`。
- 树莓派实测插件私有数据目录/文件权限为 `0700/0600`；配置接口对外部搜索 Token 与 AI key 只返回空值和 `has_*` 状态。
- 容器重启后宿主与插件均正常恢复。QuickJS 实机日志确认 URL 脱敏不依赖 WHATWG `URL`，网卡地址为空时跳过失效自检，不再产生“地址失效”的假告警。

### 12.4 尚待完成

- 树莓派当前账号数与设备数均为 0。需先通过插件页面扫码/交互登录小米账号并选择音箱，再执行 TTS、在线音频 URL 播放、暂停/停止和日志复核；不要通过聊天传递小米密码或 Token。
