"""
书架 `weread shelf`
"""
from ..api import call
from ..formatter import page, print_header, fmt_time, fmt_timestamp


def add_subparser(subparsers):
    p = subparsers.add_parser("shelf", help="查看书架")
    p.add_argument("--category", "-c", help="按分类筛选")
    p.add_argument("--author", "-a", help="按作者筛选")
    p.set_defaults(func=run)


def run(args):
    data = call("/shelf/sync")
    books = data.get("books", [])
    albums = data.get("albums", [])
    mp = data.get("mp")

    total = len(books) + len(albums) + (1 if mp else 0)
    finish = sum(1 for b in books if b.get("finishReading") == 1)
    secret = sum(1 for b in books if b.get("secret") == 1)

    # 筛选
    if args.category:
        books = [b for b in books if args.category in b.get("category", "")]
    if args.author:
        books = [b for b in books if args.author in b.get("author", "")]

    lines = []
    lines.append(f"  书架总条目: {total}")
    lines.append(f"  电子书: {len(books)}本  |  读完: {finish}本  |  私密: {secret}本")
    if albums:
        lines.append(f"  有声书/专辑: {len(albums)}个")
    if mp:
        lines.append(f"  文章收藏: ✓")
    lines.append("")

    lines.append(f"{'#':>3}  {'书名':　<30} {'作者':<20} {'分类':<10} {'状态':<6}")
    lines.append("-" * 75)

    for i, b in enumerate(books, 1):
        title = b.get("title", "?")
        title_short = title[:28] + ".." if len(title) > 28 else title
        author = b.get("author", "?")[:18] if b.get("author") else "?"
        cat = b.get("category", "?")
        cat_short = cat.split("-")[-1] if "-" in cat else cat[:8]
        status = ""
        if b.get("finishReading") == 1:
            status = "✅读完"
        elif b.get("isTop"):
            status = "📌置顶"
        elif b.get("secret") == 1:
            status = "🔒私密"
        else:
            status = "📖在读"
        lines.append(f"{i:>3}  {title_short:　<30} {author:<20} {cat_short:<10} {status:<6}")

    print_header(f"书架 ({len(books)}本)")
    page(lines, page_size=25, title="")
