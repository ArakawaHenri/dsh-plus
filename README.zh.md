# DSH Plus

<img src="icon.svg" width="64" height="64" alt="DSH Plus">

[English](README.md) | 中文

几个顺手的 DSH 个人小插件，保持原生的界面和交互体验。

可以直接安装这个总包一次启用全部功能，也可以只挑需要的单装：

| 插件 | 包名 | 作用 |
| --- | --- | --- |
| [原生搜索](https://github.com/ArakawaHenri/dshplus-native-search) | `@dshplus/native-search` | 优先调用当前模型自带的联网搜索（Claude / OpenAI），不支持或失败时自动回退 |
| [会话编辑](https://github.com/ArakawaHenri/dshplus-session-edit) | `@dshplus/session-edit` | 在当前会话里直接修改、重试历史消息，中断后一键继续 |
| [会话删除](https://github.com/ArakawaHenri/dshplus-session-delete) | `@dshplus/session-delete` | 在归档列表菜单中彻底删除不需要的旧会话 |
| [Fake-IP 抓取](https://github.com/ArakawaHenri/dshplus-fake-ip) | `@dshplus/fake-ip` | 解决 Clash / mihomo / sing-box 开启 TUN fake-IP 时 `web_fetch` 报错的问题 |

## 安装

打开 DSH 插件管理器，输入包名即可：

```text
@dshplus/bundle
```

或者通过命令行安装：

```sh
dsh plugin --profile web add @dshplus/bundle
```

## 功能一览

### 原生搜索 (`@dshplus/native-search`)
使用 Anthropic Messages 或 OpenAI Responses 协议的模型时，`web_search` 会优先走模型自带的原生搜索工具，自动复用当前会话的模型与密钥；如果当前模型不支持原生搜索或请求失败，会自动回退到 DSH 默认的普通搜索（如 `deepseek-official`）。

### 会话编辑 (`@dshplus/session-edit`)
在用户消息下方提供**编辑**和**重试**按钮，改完直接留在原会话里重新生成，不用每次重开分支。遇到回答中途手动停止、报错或触发长度上限时，只要输入框为空，发送键就会变成**继续**按钮，点一下就能接着往下写。

### 会话删除 (`@dshplus/session-delete`)
在侧边栏已归档会话的 `…` 菜单里加上了**永久删除…**，用来清理不再需要的对话日志（不会动工作区里的代码文件和附件）。

### Fake-IP 抓取 (`@dshplus/fake-ip`)
开启 Clash / mihomo / sing-box 的 TUN fake-IP 后，域名会被解析到 `198.18.0.0/15` 保留网段，从而被 DSH 默认的公网地址检查拦下（`WEB_BLOCKED_URL`）。这个插件接管了默认的 HTTP 抓取，在保留本地回环和局域网拦截的前提下放行 Fake-IP 网段。

## 开关与配置

安装后四个组件默认全部开启，可以在插件管理器里随时单独开关：
- 如果关掉 **Fake-IP 抓取**，记得把内置的 `web-fetch-http` 重新打开。
- 如果关掉 **原生搜索**，记得把 `web.searchProvider` 改回普通搜索源。

各个插件的高级配置（比如按路由关闭原生搜索、或者给 Fake-IP 追加 `fc00::/18` 等 IPv6 网段）可以看对应子仓库的说明。如果之前装过旧版的独立插件，装总包前先在插件管理器里关掉或卸载旧插件即可。

## 许可

MIT
