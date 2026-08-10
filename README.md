# Yujok's Blog

基于 Astro / Fuwari 改造的个人博客，包含文章、随想、番组、微信读书书架和本地书评。

## 技术栈

- 框架： Astro
- 交互：Svelte
- 样式：Tailwind CSS
- 开发语言：TypeScript
- 内容格式：Markdown / MDX
- 包管理：pnpm

### 🚀 快速开始

```
### 环境要求

- Node.js 18+
- pnpm 9+

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览构建结果

```bash
pnpm preview
```

## 📝 使用指南

### 创建新文章

使用内置脚本快速创建文章：

```bash
pnpm new-post hello-world
```

文章默认存放在 `src/content/posts/` 目录下。

### 创建新随想

使用内置脚本快速创建随想：

```bash
pnpm new-thought my-first-thought
```

随想默认存放在 `src/content/thoughts/` 目录下。

### 文章格式

文章使用 Markdown 或 MDX 格式，并支持以下 Frontmatter：

```markdown
---
title: 文章标题
published: 2026-01-01
description: 文章描述
image: ''
tags: []
category: ''
draft: false
lang: zh_CN
---

# 文章内容

这里是文章正文。
```

### 微信读书书架

书架页面位于 `/book`，使用本地数据展示书籍、阅读进度、阅读统计和精选划线。

首次使用：

1. 复制 `.env.example` 为 `.env.local`。
2. 在 `.env.local` 中填入 `WEREAD_API_KEY`。
3. 运行数据同步命令：

```bash
pnpm fetch-weread
```

如果没有配置真实数据，书架页面会自动回退到 `src/data/mock-shelf.ts` 中的示例数据。

### 本地书评

本地书评存放在 `src/content/book-reviews/` 目录下，并通过 Frontmatter 中的 `bookId` 与书架数据关联。

生成书评草稿：

```bash
pnpm draft-book-reviews
```

预览将要生成的草稿，但不写入文件：

```bash
pnpm draft-book-reviews -- --dry-run
```

本地开发时，`draft: true` 的书评也会显示在书架和书籍详情页中。生产构建会自动隐藏草稿，完成书评后将 `draft` 改为 `false` 即可正式发布。

### 其他页面

- `/thoughts`：随想
- `/book`：微信读书书架
- `/bangumi`：番组记录
- `/schedule`：课程表
- `/archive`：文章归档
- `/about`：关于页面

## 📁 项目结构

```text
├── public/                         # 静态资源
├── scripts/                        # 内容管理和数据同步脚本
├── src/
│   ├── assets/images/              # 图片资源
│   ├── components/                 # Astro 和 Svelte 组件
│   │   ├── book/                   # 书架和书评相关组件
│   │   ├── bangumi/                # 番组相关组件
│   │   ├── schedule/               # 课程表相关组件
│   │   └── widget/                 # 侧边栏和页面小组件
│   ├── content/                    # Markdown / MDX 内容
│   │   ├── posts/                  # 博客文章
│   │   ├── thoughts/               # 随想
│   │   ├── book-reviews/           # 本地书评
│   │   └── spec/                   # 关于等特殊页面
│   ├── data/                       # 本地数据和示例数据
│   │   ├── weread/                 # 微信读书数据
│   │   ├── mock-shelf.ts           # 书架示例数据
│   │   └── schedule.ts             # 课程表数据
│   ├── layouts/                    # 页面布局
│   ├── pages/                      # 页面路由
│   ├── styles/                     # 全局和主题样式
│   ├── config.ts                   # 站点配置
│   └── content.config.ts           # 内容集合配置
├── .env.example                    # 环境变量模板
├── astro.config.mjs                # Astro 配置
├── package.json                    # 项目配置和命令
└── pnpm-lock.yaml                  # 依赖版本锁定文件
``` 
```

## 常用命令

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

## 内容命令

```bash
pnpm new-post <slug>
pnpm fetch-weread
pnpm draft-book-reviews
```

## 微信读书书架

书架页面使用 `src/data/weread/shelf.json` 作为本地数据源。它由 `pnpm fetch-weread` 生成，包含公开书架、阅读进度、统计、精选划线等信息。私密书籍会在拉取阶段过滤，不会写入 `shelf.json`。

首次使用：

1. 复制 `.env.example` 为 `.env.local`。
2. 在 `.env.local` 填入 `WEREAD_API_KEY`。
3. 运行 `pnpm fetch-weread`。
4. 运行 `pnpm dev` 查看 `/book`。

如果没有真实数据，页面会回退到 `src/data/mock-shelf.ts`。

## 本地书评草稿

本地书评存放在 `src/content/book-reviews/*.md`，通过 frontmatter 里的 `bookId` 和书架数据关联。重新运行 `pnpm fetch-weread` 不会覆盖这里的内容。

生成草稿：

```bash
pnpm draft-book-reviews
```

脚本会读取 `src/data/weread/shelf.json`，为满足任一条件的书生成草稿：

- 有划线：`bookmarkCount > 0`，或 `shelf.notes` 中存在对应 `bookId`。
- 有评分：存在 `rating`、`userRating`、`personalRating` 或 `publicRating`。
- 已读完：`finishReading === 1` 或 `status === "finished"`。

为了避免覆盖已经写过的书评，脚本会扫描 `src/content/book-reviews/**/*.md(x)` 的 frontmatter。只要发现相同 `bookId`，就会跳过该书。

草稿会自动填入：

- `bookId`
- 标题
- `summary` 占位
- `topics` 占位
- `quotes` 占位，若书架里已有精选划线，会优先带入最多 3 条
- `draft: true`

预览将要生成的草稿但不写入文件：

```bash
pnpm draft-book-reviews -- --dry-run
```

本地开发时，`pnpm dev` 会把草稿也关联到 `/book` 书架和书籍详情页，并显示“草稿”标识，方便边看边补。生产构建会隐藏 `draft: true` 的书评；写完后把 frontmatter 里的 `draft` 改成 `false`，并补完 `summary`、`topics`、`quotes` 和正文，即可在正式站点中展示。


## 📦 部署

构建后的静态文件位于 dist/ 目录，可部署到任何静态托管平台。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](https://github.com/chuzouX/fuwari/blob/main/LICENSE)


🙏 致谢

感谢所有为这个项目做出贡献的开发者们！尤其感谢[上游仓库](https://github.com/saicaca/fuwari)



