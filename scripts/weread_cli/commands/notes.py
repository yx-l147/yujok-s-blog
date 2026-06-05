"""
笔记划线 `weread notes <book-id>`
"""
from ..api import call, list_all_notebooks
from ..formatter import page, print_header, fmt_time, fmt_timestamp


def add_subparser(subparsers):
    p = subparsers.add_parser("notes", help="查看笔记划线")
    p.add_argument("book_id", nargs="?", default=None, help="书籍 ID（不传时显示笔记本概览）")
    p.add_argument("--all", "-a", action="store_true", help="遍历所有笔记本（概览模式）")
    p.set_defaults(func=run)


def run(args):
    if args.book_id:
        _show_book_notes(args.book_id)
    else:
        _show_notebooks(args.all)


def _show_book_notes(book_id: str):
    """单本书的笔记内容。"""
    # 划线
    bm = call("/book/bookmarklist", bookId=book_id)
    # 想法
    rv = call("/review/list/mine", bookid=book_id, count=50)

    book_info = bm.get("book", {})
    title = book_info.get("title", book_id)
    chapters = {c["chapterUid"]: c["title"] for c in bm.get("chapters", [])}

    lines = []

    # 划线
    marks = bm.get("updated", [])
    if marks:
        lines.append(f"  【划线】共 {len(marks)} 条\n")
        for m in marks:
            ch_name = chapters.get(m.get("chapterUid", 0), f"章节{m.get('chapterUid', '?')}")
            text = m.get("markText", "")
            ct = fmt_timestamp(m.get("createTime", 0))
            lines.append(f"  [{ch_name}]")
            lines.append(f"  > {text}")
            lines.append(f"    划线时间: {ct}\n")

    # 想法
    reviews = rv.get("reviews", [])
    if reviews:
        lines.append(f"  【想法/点评】共 {rv.get('totalCount', len(reviews))} 条\n")
        for r in reviews:
            review = r.get("review", {})
            content = review.get("content", "")
            ch_name = review.get("chapterName", "")
            star = review.get("star", -1)
            star_str = f" ⭐{'⭐' * star}" if star > 0 else ""
            ct = fmt_timestamp(review.get("createTime", 0))
            prefix = f"  [{ch_name}]{star_str}" if ch_name else f"  [书评]{star_str}"
            lines.append(prefix)
            lines.append(f"  {content[:200]}{'...' if len(content) > 200 else ''}")
            lines.append(f"    时间: {ct}\n")

    print_header(f"笔记 — {title} ({len(marks)}划线 + {len(reviews)}想法)")
    page(lines, page_size=10)


def _show_notebooks(all_pages: bool):
    """笔记本概览。"""
    if all_pages:
        books = list_all_notebooks()
    else:
        data = call("/user/notebooks", count=20)
        books = data.get("books", [])

    lines = []
    if all_pages:
        lines.append(f"  共 {len(books)} 本书有笔记\n")
    else:
        lines.append(f"  共 {len(books)} 本书（使用 --all 遍历所有）\n")

    # 按总笔记数降序
    def note_total(b):
        return b.get("reviewCount", 0) + b.get("noteCount", 0) + b.get("bookmarkCount", 0)

    books.sort(key=note_total, reverse=True)

    lines.append(f"{'#':>3}  {'书名':　<28} {'笔记':>4} {'划线':>4} {'想法':>4} {'书签':>4} {'进度':>5}")
    lines.append("-" * 60)
    for i, b in enumerate(books, 1):
        bk = b.get("book", {})
        title = bk.get("title", "?")[:26]
        notes = note_total(b)
        note_c = b.get("noteCount", 0)
        review_c = b.get("reviewCount", 0)
        bm_c = b.get("bookmarkCount", 0)
        progress = b.get("readingProgress", 0)
        lines.append(f"{i:>3}  {title:　<28} {notes:>4} {note_c:>4} {review_c:>4} {bm_c:>4} {progress:>3}%")

    print_header(f"笔记本概览 ({len(books)}本)")
    page(lines, page_size=20)
