本地书评

这个目录用于维护书架里的个人书评和策展信息。

微信读书同步数据负责书名、封面、阅读进度、笔记数量等事实信息；这里负责作者自己的判断、短评、主题标签、精选引用和正文。两者通过 frontmatter 里的 bookId 关联。

生成草稿：

  pnpm draft-book-reviews

预览但不写入：

  pnpm draft-book-reviews -- --dry-run

脚本会读取 src/data/weread/shelf.json，为有划线、有评分或已读完的书生成 draft: true 的 Markdown 草稿，并跳过已经存在相同 bookId 的书评。

本地开发时，pnpm dev 会在 /book 书架和书籍详情页显示草稿，并带有“草稿”标识。生产构建会隐藏 draft: true 的书评；写完后把 draft 改成 false 即可正式公开。

Frontmatter 示例：

---
title: "《百年孤独》读后"
bookId: "935536"
published: 2026-06-20
summary: "一句会显示在书架卡片和书籍详情页里的短评。"
verdict: "recommend"
rating: 9
topics: ["文学", "家族叙事"]
quotes:
  - text: "你想在书架底部精选展示的句子。"
    chapter: "可选章节名"
relatedPosts: []
draft: false
---

正文会作为完整书评页面内容。
