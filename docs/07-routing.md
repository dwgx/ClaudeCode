# 07 · 模型路由

> **状态：占位 stub**。最终内容由 `catalog-router.md` 输出后填。

吸收自 [claude-code-router](https://github.com/musistudio/claude-code-router)（MIT）。

## 计划支持的 scenario

| scenario | 触发条件 | 默认模型（草稿） |
|---|---|---|
| `default` | 兜底 | Anthropic Sonnet |
| `background` | 沉默/低优先 | DeepSeek Coder |
| `think` | Plan Mode / 显式深思 | Anthropic Opus |
| `longContext` | 输入 > `longContextThreshold` token | Sonnet 1M / GPT-5.5 |
| `webSearch` | 含 web 工具调用 | gpt-5.5-online |
| `image` | 含图像输入 | gemini-2.5 / gpt-5.5-vision |

## Transformer 系统

每个 Provider 可以挂多个 transformer 来对齐请求/响应格式：
- `anthropic` / `openai` / `gemini` / `deepseek` / `openrouter` / `groq`
- `maxtoken`（限/扩 max_tokens）
- `tooluse`（统一 tool 协议）
- `reasoning`（处理 reasoning_content）
- `enhancetool`

## Sub-agent routing tag

兼容 claude-code-router：

```
<CCR-SUBAGENT-MODEL>provider,model</CCR-SUBAGENT-MODEL>
请帮我分析...
```

## 待填章节

- [ ] 路由决策算法
- [ ] Provider 配置 schema
- [ ] Transformer 注册机制
- [ ] preset 系统（export / install / list）
- [ ] 自定义路由 hook（`CUSTOM_ROUTER_PATH`）
- [ ] 项目级覆盖：`.claudecode/router.json`
