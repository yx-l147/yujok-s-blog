"""
搜索书籍 `weread search <keyword>`
"""
from ..api import call
from ..formatter import page, print_header, fmt_rating, format_book_short


def add_subparser(subparsers):
    p = subparsers.add_parser("search", help="搜索书籍")
    p.add_argument("keyword", help="搜索关键词")
    p.add_argument("--scope", type=int, default=10, choices=[0, 10, 16, 14, 6, 12, 13],
                   help="搜索范围: 0=全部, 10=电子书(默认), 16=网文, 14=听书, 6=作者, 12=全文")
    p.add_argument("--count", type=int, default=15, help="每页数量")
    p.set_defaults(func=run)


def run(args):
    data = call("/store/search", keyword=args.keyword, scope=args.scope, count=args.count)
    lines = []
    results = data.get("results", [])
    total = 0
    for group in results:
        group_title = group.get("title", "搜索结果")
        books = group.get("books", [])
        if not books:
            continue
        lines.append(f"\n  【{group_title}】(共{group.get('scopeCount', '?')}条)")
        for i, b in enumerate(books, 1):
            info = b.get("bookInfo", {})
            title = info.get("title", "?")
            author = info.get("author", "?")[:20]
            rating = info.get("newRating", 0)
            readers = info.get("readingCount", 0)
            rating_str = fmt_rating(rating)
            lines.append(f"  {i:3d}. {title} — {author}")
            lines.append(f"       评分: {rating_str}  在读: {readers}人")
        total += len(books)
    print_header(f"搜索「{args.keyword}」共 {total} 条结果")
    page(lines, page_size=10, title="")
