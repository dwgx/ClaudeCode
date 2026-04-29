# Codex 任务：从 opencode 搬代码到 src/ 并 rebrand

**层级**：codex-deep
**目的**：把 opencode 里被主脑选中的 packages 搬进我们的 `src/`，做 opencode→claudecode 字符串替换、调整 package.json 元信息、保留所有 LICENSE。
**预期耗时**：15–25 分钟（看选中包数量）
**输出**：实际文件改动 + 一份 `_codex-out/rebrand-report.md`

> ⚠️ 这是 **execution 任务**，不是调研。改动会落到 `src/`。开干前确认主脑已经把"keep 清单"喂给你（在 prompt 的"输入"里）。

---

## 你是谁

ClaudeCode 项目的 codex-deep 执行工人。主脑给你一份"keep 清单"，你按清单把 `ReferenceSource/opencode/packages/<x>` 复制到 `src/<x>`，做以下变换。

## 输入（主脑会在每次 dispatch 时填具体值）

- cwd：`D:/Project/ClaudeCode/`
- 源：`ReferenceSource/opencode/packages/`
- 目标：`src/`
- keep 清单：
  ```
  <主脑会列出来；如果还没列就停下来报告主脑>
  ```
- rebrand 字符串映射：
  ```
  opencode      → claudecode
  OpenCode      → ClaudeCode
  OPENCODE_     → CLAUDECODE_
  opencode-ai   → @dwgx/claudecode
  anomalyco     → dwgx
  https://opencode.ai          → https://github.com/dwgx/ClaudeCode
  https://github.com/anomalyco → https://github.com/dwgx
  ```
  > **大小写敏感**，不要用 `tr` 批替；只在标识符与字符串里替换。

## 步骤

1. **预检**
   - 确认 `src/` 不存在或为空（如非空，停下报告主脑）
   - 确认主脑给了 keep 清单（如没有，停下报告）

2. **复制**
   对清单里每个 package：
   ```
   cp -r ReferenceSource/opencode/packages/<x> src/<x>
   ```
   保留所有文件（包括 LICENSE / README）。**不复制** `node_modules/`、`dist/`、`.turbo/`、`.cache/`。

3. **保留 attribution**
   把 opencode 顶层 LICENSE 复制为 `src/LICENSE-opencode`（不覆盖根 LICENSE）。

4. **重命名标识符**
   逐文件做字符串替换（按上面映射）。**白名单文件类型**：
   `.ts .tsx .js .jsx .mjs .cjs .json .json5 .toml .yaml .yml .md .sh .ps1 .nix .lock`
   
   **不要替换**：
   - 二进制文件
   - 内嵌的 third-party LICENSE 文本
   - 上游 commit hash / SHA
   - URL 中作者已用 attribution 的部分

5. **package.json 元信息**
   每个 `src/<x>/package.json`：
   - `name`：`opencode-*` → `@dwgx/claudecode-*`，`opencode` → `@dwgx/claudecode`
   - `version`：重置为 `0.0.1`
   - `repository`：改 `dwgx/ClaudeCode`
   - `homepage`：`https://github.com/dwgx/ClaudeCode`
   - `bugs`：`https://github.com/dwgx/ClaudeCode/issues`
   - `author`：`dwgx <dwgx1337@outlook.com>`
   - `license`：保持 `MIT`
   - 删除 `publishConfig` 里指向 opencode 私域的字段（如有）

6. **顶层 package.json**（创建于 `D:/Project/ClaudeCode/package.json`，如已存在则不动并报告）
   合并 opencode 顶层的 workspaces / scripts / catalog，重命名同上。

7. **不要装依赖**
   只生成新 package.json + lockfile 已存在则跳过。**不跑 `pnpm install` / `bun install`**。

8. **报告**
   写到 `_codex-out/rebrand-report.md`：
   - 实际复制了哪些 package
   - 每个 package 的 file count
   - 全文替换命中数（每条映射规则）
   - 没改的特殊文件清单（你跳过的）
   - 任何 LICENSE 文件的去向
   - 任何 你拿不准的（写到 Open）

## 红线（除 footer 外特有）

- ✘ 不创建 `private/` 任何文件
- ✘ 不替换 LICENSE 文件本身的版权信息
- ✘ 不替换 NOTICE.md / 任何 attribution 文件
- ✘ 不替换 third-party 子目录里被嵌入的 LICENSE 头注释
- ✘ 不替换上游 commit hash / SHA / 路径中的归属（例如 `https://github.com/anomalyco/opencode` 在 NOTICE/CREDITS 中要保留）

---

<!-- footer -->
