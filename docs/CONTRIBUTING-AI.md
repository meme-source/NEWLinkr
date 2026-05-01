# 用 AI 改这个项目而不让它变乱（一页纸）

> 这是给**项目所有者**看的。每次开新对话前花 30 秒扫一眼。

## 三个核心动作

### 1. 启动新会话时，让 AI 读 `CLAUDE.md`

`CLAUDE.md` 是项目根目录下的硬规则文件，Claude Code 会自动加载。**不要相信 AI 说"我懂了"**——直接看它的第一次操作是不是按规则来的。

如果它一上来就开始 `interface Creator` 重新定义、或者新建 `lib/mock/` —— 立刻打断它，让它重读 `CLAUDE.md`。

### 2. 提需求时给位置 + 给参考

❌ 模糊提示（容易乱）：

> "加一个达人筛选器"

✅ 精确提示（不会乱）：

> "在 `features/discovery/components/` 新增 `CreatorFilter.tsx`，类型用 `types/api.ts` 的 `Creator`，参考 `features/discovery/components/CreatorList.tsx` 的代码风格。完成后运行 `npm run check`。"

三要素：**目录位置 + 类型来源 + 参考文件**。AI 拿到这三个信息就不会瞎发挥。

### 3. 每改完一个功能，让它跑 `npm run check`

```bash
npm run check
```

这一条命令会跑：

- TypeScript 类型检查（`tsc --noEmit`）
- ESLint（含 react-hooks 严格规则）
- Prettier 格式检查

**任何一项不过都不算改完**。AI 看到失败信息会自己修。如果 AI 想"改 lint 配置让检查通过"——拒绝。它必须改源码而不是改规则。

---

## 警告信号（看到立刻打断）

| AI 写出                                           | 含义                 | 怎么办                                          |
| ------------------------------------------------- | -------------------- | ----------------------------------------------- |
| `interface Creator { ... }` 在 page/component 里  | 在重新定义已有类型   | 让它从 `types/api.ts` import                    |
| `// eslint-disable react-hooks/exhaustive-deps`   | 想绕过 hook 检查     | 让它修依赖数组而非禁用规则                      |
| 单文件超过 500 行                                 | god component 在重生 | 让它先拆再继续                                  |
| `body as XxxRequest` 在 API route 里              | 跳过了输入校验       | 让它用 `zod.parse()`                            |
| 新建了 `lib/mock/` 目录                           | 又在堆 mock 了       | mock 只能去 `features/<feature>/data/`          |
| `catch (e) { console.log(e) }`                    | 在吞错误             | 让它要么 throw，要么用 `console.error` 并向上抛 |
| `next.config.ts` 改了 `eslint.ignoreBuilds: true` | 在掩盖 lint 错误     | 拒绝，要它修源码                                |

---

## 每月 30 分钟轻整理（可选但推荐）

每月找 30 分钟，开 Claude 跑这两条：

```
1. 用 simplify skill review 最近一个月的改动
2. 用 refactor-cleaner agent 找死代码
```

输出会是一份"小修小补清单"，挑你看着顺眼的提交一下。比攒到半年再大重构便宜 10 倍。

---

## 紧急情况：代码已经乱了怎么办

1. **不要慌** —— git 历史还在，怎么乱都能恢复。
2. 让 Claude 跑：「用 simplify skill 全量扫描，输出 Top 10 最乱的文件」
3. 一次只修一个文件，每修完一个跑 `npm run check` + 视觉验证。
4. 单次会话不要修超过 5 个文件，免得 AI 上下文耗尽出错。

---

## 不要做这些

- ❌ 让 AI"顺手"改一堆不相干的文件 —— 让它专注当前任务
- ❌ 多个会话混着改同一文件 —— 容易冲突，先合并再开新会话
- ❌ 信任"我已经测试过了"的口头汇报 —— 一定要看 `npm run check` 输出
- ❌ 关掉 ESLint / TypeScript / config-protection hook —— 它们就是替你监督 AI 的那道墙
