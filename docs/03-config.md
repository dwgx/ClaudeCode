# 03 · 配置

> **状态：占位 stub**。最终的 schema 由 src/ 移植与路由层落地后定型，由 Codex catalog (`catalog-opencode.md` + `catalog-router.md`) 输出后由主脑综合。

## 计划的优先级链（高 → 低）

```
1. CLI flag                        --model gpt-5.5
2. 环境变量                         CLAUDECODE_MODEL=...
3. private/CLAUDE.md (本地私有覆盖)
4. <repo>/.claudecode/config.json  项目级
5. ~/.claudecode/config.json       用户全局
6. <仓内默认>                       源码自带
```

## 待定 schema 草稿

```jsonc
{
  "$schema": "https://claudecode.dwgx.dev/schema/config.json",
  "version": 1,

  "providers": {
    "anthropic": { "apiKey": "$ANTHROPIC_API_KEY" },
    "openai":    { "apiKey": "$OPENAI_API_KEY" },
    "deepseek":  { "apiKey": "$DEEPSEEK_API_KEY" }
  },

  "router": {
    "default":     "anthropic/claude-sonnet-4-6",
    "background":  "deepseek/deepseek-coder",
    "think":       "anthropic/claude-opus-4-7",
    "longContext": "anthropic/claude-sonnet-4-6@1m",
    "webSearch":   "openai/gpt-5.5-online",
    "longContextThreshold": 60000
  },

  "plugins": {
    "marketplace": ["github:dwgx/claudecode-plugins-curated"],
    "enabled":     ["@dwgx/skill-codex-spark"]
  }
}
```

> 上面是**草稿**；真正字段由 catalog 任务回报后定。

## 待填章节

- [ ] 完整字段表 + 类型 + 默认
- [ ] env 插值规则（参考 claude-code-router 的 `$VAR` / `${VAR}`）
- [ ] preset 系统（导出/安装/分享配置）
- [ ] 校验规则（缺失字段如何 fallback）
- [ ] 文件格式（JSON / JSON5 / TOML？）
- [ ] 配置变更后的 reload 策略
