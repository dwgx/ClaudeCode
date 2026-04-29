# 07 · 模型路由

吸收自 [claude-code-router](https://github.com/musistudio/claude-code-router) (MIT)，详见 [ADR-0004](decisions/0004-routing-layer.md)。

## 6 个 scenario

| scenario | 触发条件（伪代码） | 默认建议模型 |
|---|---|---|
| `default` | fallback；或显式 `req.body.model = "provider,model"`；或 subagent tag；或 custom router 返回模型但无 scenario | Anthropic Sonnet |
| `background` | `req.body.model` 同时含 `claude` 和 `haiku`，且全局 `Router.background` 存在 | DeepSeek Coder / GPT-5 |
| `think` | `req.body.thinking` truthy，且 `Router.think` 存在；webSearch 优先于 thinking | Anthropic Opus |
| `longContext` | `Router.longContext` 存在 + `tokenCount > Router.longContextThreshold`（默认 60000）；或上轮 `lastUsage.input_tokens > threshold` 且本轮 `tokenCount > 20000` | Sonnet 1M / GPT-5.5 |
| `webSearch` | `req.body.tools` 任一 tool `type` 以 `web_search` 开头 + `Router.webSearch` 存在 | gpt-5.5-online |
| `image` | 由 server agent 层处理；`Router.image` 存在且当前模型不是 image 模型 → 切到 `Router.image` | gemini-2.5 / gpt-5.5-vision |

## 决策算法

```ts
async function getUseModel(req, tokenCount, configService, lastUsage?) {
  // 1. session/project 级 Router override
  const sessionId = parseSessionId(req.body.metadata?.user_id);
  const sessionRouter = await loadSessionRouter(sessionId);

  // 2. custom router（最高优先级）
  if (CUSTOM_ROUTER_PATH) {
    const m = await customRouter(req, config, ctx);
    if (m) return { model: m, scenarioType: "default" };
  }

  // 3. 显式 provider,model 直通
  if (isProviderModelTag(req.body.model)) {
    return { model: req.body.model, scenarioType: "default" };
  }

  // 4. longContext 检查（含 lastUsage 兜底）
  if (Router.longContext) {
    const long = tokenCount > Router.longContextThreshold
              || (lastUsage?.input_tokens > Router.longContextThreshold && tokenCount > 20000);
    if (long) return { model: Router.longContext, scenarioType: "longContext" };
  }

  // 5. subagent tag
  const tag = parseSubagentTag(req.body.system?.[1]?.text);
  if (tag) {
    stripTagFromSystem(req);
    return { model: tag, scenarioType: "default" };
  }

  // 6. background（haiku 节流）
  if (isClaudeHaiku(req.body.model) && Router.background) {
    return { model: Router.background, scenarioType: "background" };
  }

  // 7. webSearch 优先于 think
  if (hasWebSearchTool(req.body.tools) && Router.webSearch) {
    return { model: Router.webSearch, scenarioType: "webSearch" };
  }

  // 8. think
  if (req.body.thinking && Router.think) {
    return { model: Router.think, scenarioType: "think" };
  }

  // 9. fallback
  return { model: Router.default, scenarioType: "default" };
}
```

## token 估算

```
tokenCount = tokenizerService.countTokens(provider/model tokenizer)
          ?? calculateTokenCount(messages, system, tools, "cl100k_base")
```

- 默认 fallback：`tiktoken` `cl100k_base`
- per-Provider 配置：`tokenizer.default`、`tokenizer.models[name]`
- 类型支持：`tiktoken` / `huggingface` / `api`

## Transformer 协议

```ts
type Transformer = {
  name: string;
  endPoint?: string;                                    // 注册 endpoint，例如 "/v1/messages"
  transformRequestIn?:   (request, provider, ctx) => Promise<any>;
  transformResponseIn?:  (response, ctx?) => Promise<Response>;
  transformRequestOut?:  (request, ctx) => Promise<UnifiedChatRequest>;
  transformResponseOut?: (response, ctx) => Promise<Response>;
  auth?: (request, provider, ctx) => Promise<any>;
  logger?: any;
};
```

### 注册机制

```ts
// 类有静态 TransformerName → 按 name 注册 constructor
class Foo { static TransformerName = "foo"; }
// 否则 new Static() 后按 instance.name 注册

// 自定义：config.transformers[]
[{ "path": "./my-tx.js", "options": { ... } }]
//          require(path) → new module(options) → 必须有 .name
```

### Chain 执行顺序

#### Request

```
endpoint transformer.transformRequestOut       (例如 Anthropic → unified)
provider.transformer.use[].transformRequestIn  (顺序)
provider.transformer[model].use[].transformRequestIn (顺序)
↓ 发送到 Provider
```

#### Response

```
provider.transformer[model].use[].transformResponseOut (反序)
provider.transformer.use[].transformResponseOut         (反序)
endpoint transformer.transformResponseIn                (例如 unified → Anthropic)
```

### Bypass 优化

如果 Provider 只用了一个 transformer 且就是当前 endpoint transformer，model-level 也没有其它，**整段 chain 跳过**——直接调 endpoint transformer 的 `auth()`，原样转发。

## 内置 transformer 清单

| name | 用途 |
|---|---|
| `Anthropic` | Anthropic ↔ unified（含 streaming, tool_use 顺序）|
| `openai` | OpenAI chat completions ↔ unified |
| `openai.responses` | OpenAI Responses API ↔ unified |
| `gemini` | Google Gemini v1beta + `x-goog-api-key` |
| `vertex-gemini` | Vertex Gemini auth/request |
| `vertex-claude` | Vertex Claude auth/request |
| `deepseek` | DeepSeek API |
| `openrouter` | OpenRouter（清理 cache/image, provider routing options, reasoning/tool id stream quirks） |
| `groq` | Groq |
| `cerebras` | Cerebras |
| `vercel` | Vercel/AI gateway |
| `tooluse` | tool choice/use 优化 |
| `enhancetool` | tool-call 参数容错 |
| `reasoning` | `reasoning_content` / thinking 字段 |
| `forcereasoning` | 强制 reasoning |
| `maxtoken` | 截断 `max_tokens` |
| `maxcompletiontokens` | `max_completion_tokens` |
| `cleancache` | 清理 `cache_control` |
| `sampling` | temperature/top_p/top_k/repetition_penalty |
| `streamoptions` | stream options |
| `customparams` | 注入自定义请求参数 |

文件级直接搬（保留 attribution）：`Anthropic`、`gemini`、`openrouter`。其它按本仓 schema 重写。

## Subagent routing tag

子代理 prompt 开头放：

```text
<CCR-SUBAGENT-MODEL>provider,model</CCR-SUBAGENT-MODEL>
具体任务...
```

**实际解析位置**：`packages/core/src/utils/router.ts` `getUseModel()`，**只检查 `system[1].text`** 是否以此 tag 开头。

不在 user message 里扫——这是 catalog 发现的"文档与实现偏差"，我们以实现为准。

## fallback 重试

provider 响应错误时按 `config.fallback[scenarioType]` 列表顺序重试模型。

```jsonc
"fallback": {
  "default":     ["anthropic,claude-sonnet-4-6", "openai,gpt-5"],
  "longContext": ["anthropic,claude-sonnet-4-6@1m"]
}
```

## env 变量插值

详见 [03-config.md](03-config.md)。

## 项目级 Router override

v0.1 **不实现**——先把核心稳住。  
v0.2+ 评估：从 `~/.claude/projects/<project-id>/<sessionId>.json` 与 `claudecode-router.json` 读取覆盖。

## 自定义 router 函数

```javascript
// .claudecode/router.js
module.exports = async function router(req, config, { event }) {
  // 返回 "provider,model" 字符串覆盖；返回 null 走默认逻辑
};
```

`CUSTOM_ROUTER_PATH` 指向此文件。优先级最高。
