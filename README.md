# DSH Plus

<img src="icon.svg" width="64" height="64" alt="DSH Plus">

English | [中文](README.zh.md)

A small collection of quality-of-life plugins for DeepSeek Harness (DSH) that fit right into the native UI.

You can install this repo to get all four at once, or install only the individual plugins you want:

| Plugin | Package | What it does |
| --- | --- | --- |
| [Native Search](https://github.com/ArakawaHenri/dshplus-native-search) | `@dshplus/native-search` | Uses the current model's built-in web search (Anthropic / OpenAI), falling back to standard search when unavailable |
| [Session Edit](https://github.com/ArakawaHenri/dshplus-session-edit) | `@dshplus/session-edit` | Edit or retry earlier messages in place, and continue interrupted turns with one click |
| [Session Delete](https://github.com/ArakawaHenri/dshplus-session-delete) | `@dshplus/session-delete` | Permanently delete archived sessions from the sidebar menu |
| [Fake-IP Fetch](https://github.com/ArakawaHenri/dshplus-fake-ip) | `@dshplus/fake-ip` | Lets `web_fetch` work under Clash / mihomo / sing-box TUN fake-IP (`198.18.0.0/15`) |

## Install

Install `@dshplus/bundle` in the DSH Plugin Manager:

```text
@dshplus/bundle
```

Or add it from the CLI:

```sh
dsh plugin --profile web add @dshplus/bundle
```

## What You Get

### Native Search (`@dshplus/native-search`)
When you chat with Claude (Messages API) or OpenAI models (Responses API), `web_search` will use that model's own native search tool first. If you're on a model/gateway that doesn't support native search—or if the upstream search call fails—it automatically falls back to DSH's standard search provider (`deepseek-official` by default).

### Session Edit (`@dshplus/session-edit`)
Adds **Edit** and **Retry** buttons under your messages so you can tweak a prompt and regenerate in the same conversation instead of branching into a new session. When a turn stops early (manual stop, network error, or token limit) and the input box is empty, the send button turns into a **Continue** button so the model can pick up where it left off.

### Session Delete (`@dshplus/session-delete`)
Adds **Delete permanently…** to the `…` menu of archived sessions in the sidebar, removing the session's JSONL logs and cleaning up its workspace/archive entry (while leaving your workspace files and attachments untouched).

### Fake-IP Fetch (`@dshplus/fake-ip`)
If you run Clash, mihomo, or sing-box in TUN fake-IP mode, domains resolve to `198.18.0.0/15`, which DSH's default SSRF check blocks as a reserved range. This plugin replaces the default HTTP fetch provider and allows `198.18.0.0/15` while keeping loopback and LAN addresses blocked.

## Configuration & Toggling

All four plugins are enabled out of the box, and you can toggle them individually in the Plugin Manager:
- If you disable **Fake-IP Fetch**, re-enable the built-in `web-fetch-http` plugin.
- If you disable **Native Search**, switch `web.searchProvider` back to your regular provider.

For per-plugin options (such as custom search routes or extra IPv6 fake-IP CIDRs like `fc00::/18`), see each component's README.

If you're upgrading from the older standalone repos (`dsh-plugin-search`, `dsh-session-edit`, `dsh-plugin-session-delete`, `dsh-plugin-web-fetch-fake-ip`), disable or remove them before installing `@dshplus/bundle`.

## License

MIT
