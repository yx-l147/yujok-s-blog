# My Blog

基于 Astro / Fuwari 改造的个人博客，包含文章、随想、番组、微信读书书架和本地书评。

## 技术栈

- Astro
- Svelte
- Tailwind CSS
- TypeScript
- Markdown / MDX

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
