"""
书籍信息 `weread book <book-id>`
"""
from ..api import call
from ..formatter import page, print_header, fmt_time, fmt_timestamp, fmt_rating, fmt_progress


def add_subparser(subparsers):
    p = subparsers.add_parser("book", help="查看书籍信息")
    p.add_argument("book_id", help="书籍 ID 或书名（书名会自动搜索）")
    p.add_argument("--chapters", "-c", action="store_true", help="显示章节目录")
    p.add_argument("--progress", "-p", action="store_true", help="显示阅读进度")
    p.set_defaults(func=run)


def run(args):
    book_id = args.book_id
    # 如果不是纯数字 ID, 先搜索
    if not book_id.isdigit():
        search = call("/store/search", keyword=book_id, scope=10, count=5)
        results = search.get("results", [])
        if results:
            books = results[0].get("books", [])
            if books:
                info = books[0].get("bookInfo", {})
                book_id = info.get("bookId", book_id)
                print(f"  解析为: {info.get('title')} (bookId: {book_id})")

    data = call("/book/info", bookId=book_id)
    lines = []

    title = data.get("title", "?")
    author = data.get("author", "?")
    intro = data.get("intro", "")
    rating = data.get("newRating", 0)
    rating_count = data.get("newRatingCount", 0)
    word_count = data.get("wordCount", 0)
    publisher = data.get("publisher", "")
    category = data.get("category", "")

    lines.append(f"  书名: {title}")
    lines.append(f"  作者: {author}")
    if data.get("translator"):
        lines.append(f"  译者: {data['translator']}")
    lines.append(f"  分类: {category}")
    lines.append(f"  出版社: {publisher}")
    lines.append(f"  评分: {fmt_rating(rating)} ({rating_count}人评价)")
    if word_count:
        wc = f"{word_count / 10000:.0f}万字" if word_count > 10000 else f"{word_count}字"
        lines.append(f"  字数: {wc}")
    if intro:
        lines.append(f"\n  简介: {intro[:300]}{'...' if len(intro) > 300 else ''}")

    print_header(f"📖 {title}")
    page(lines, page_size=15, title="")

    # 章节目录
    if args.chapters:
        ch_data = call("/book/chapterinfo", bookId=book_id)
        ch_lines = []
        for i, ch in enumerate(ch_data.get("chapters", []), 1):
            indent = "  " * (ch.get("level", 1) - 1)
            ch_title = ch.get("title", f"第{i}章")
            wc = ch.get("wordCount", 0)
            wc_str = f"({wc}字)" if wc else ""
            paid = "💰" if ch.get("paid") == 1 else " "
            ch_lines.append(f"  {indent}{i:3d}. {ch_title} {wc_str}{paid}")
        print_header(f"章节目录 ({len(ch_lines)}章)")
        page(ch_lines, page_size=20)

    # 阅读进度
    if args.progress:
        pg_data = call("/book/getprogress", bookId=book_id)
        pg = pg_data.get("book", {})
        progress = pg.get("progress", 0)
        rtime = pg.get("recordReadingTime", 0)
        pg_lines = [
            f"  进度: {fmt_progress(progress)}",
            f"  阅读时长: {fmt_time(rtime)}",
            f"  最后阅读: {fmt_timestamp(pg.get('updateTime', 0))}",
        ]
        if pg.get("finishTime"):
            pg_lines.append(f"  读完时间: {fmt_timestamp(pg['finishTime'])}")
        print_header("阅读进度")
        page(pg_lines, page_size=10)
