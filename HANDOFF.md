# Linkr 5.0 — 本地交接说明

交接时间：2026-05-11
交接来源：本地直接打包（未走 git push）

## 这是什么

Next.js 16 / React 19 / Tailwind 4 项目，包含三个产品入口：

- `app/(plugin)/demo/` — 插件预览
- `app/(workspace)/landing/` — 落地页
- `app/(workspace)/workspace/{discovery,library,outreach,tracking,settings}` — 工作台

后端目前是 stub，跑前端预览不需要任何 `.env`、数据库或 API key。

## 启动

```bash
# 1. 进入项目目录
cd "Linkr 5.0"

# 2. 安装依赖
npm install

# 3. 启动 dev server
npm run dev
```

默认会在 http://localhost:3000 启动（端口被占就自动用 3001）。

## 已知坑：native binding 缺失

如果 `npm run dev` 打开页面后出现红色 Build Error：

```
An error occurred in `next/font`.
Error: Cannot find native binding.
```

或类似的 `Cannot find module '../xxx.darwin-arm64.node'`，这是 npm 的 optional dependency bug（[npm/cli#4828](https://github.com/npm/cli/issues/4828)）—— Apple Silicon Mac 上某些 native `.node` 二进制可能没装上。

**修复方式**：根据报错信息找到缺失的那个包目录，删掉后重装。常见的三个：

```bash
rm -rf node_modules/@next/swc-darwin-arm64 \
       node_modules/lightningcss \
       node_modules/lightningcss-darwin-arm64 \
       node_modules/@tailwindcss/oxide \
       node_modules/@tailwindcss/oxide-darwin-arm64
npm install
```

装完重启 `npm run dev`。

如果想一次性检查所有 native 包是否完整：

```bash
for d in node_modules/*-darwin-arm64 node_modules/@*/*-darwin-arm64; do
  if [ -d "$d" ]; then
    nodes=$(find "$d" -maxdepth 2 -name "*.node" 2>/dev/null | wc -l | tr -d ' ')
    [ "$nodes" = "0" ] && echo "MISSING: $d"
  fi
done
```

输出 `MISSING:` 的包就是要删了重装的。

## 项目规则（重要）

仓库根有 `CLAUDE.md`，里面是这个项目的硬性约定（类型来源、API 验证、文件大小预算、已知 god component 等）。**改任何代码前先读它**，否则容易踩到既有约定。

视觉规范在 `docs/DESIGN.md`，是唯一权威。不要从其他地方搬色值或字号。

## 验证

每次改完代码：

```bash
npm run check    # typecheck → lint → format-check
```

三步都得过。

## 这个包里没有什么

- `node_modules/` —— 你自己 `npm install`
- `.next/` —— dev/build 缓存，会自动重建
- `.git/` —— 没走 git，是直接本地拷贝
- `.env` —— 当前 stub 后端不需要环境变量

## 当前分支状态（仅供参考）

打包前，源代码对应分支 `feat/discovery-1to1-replica`，本地领先 `origin/main` 20 个提交，且工作区还有大量未提交改动。**这份打包包含所有最新本地改动**（包括未提交的部分），不是远端任何一个分支的状态。
