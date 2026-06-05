"""
推荐好书 `weread discover`
"""
from ..api import call
from ..formatter import page, print_header, fmt_rating, format_book_short


def add_subparser(subparsers):
    p = subparsers.add_parser("discover", help="推荐好书")
    p.add_argument("--similar", "-s", help="基于某本书 ID 推荐相似书")
    p.add_argument("--count", type=int, default=12, help="推荐数量")
    p.set_defaults(func=run)


def run(args):
    lines = []
    if args.similar:
        data = call("/book/similar", bookId=args.similar, count=args.count)
        books_data = data.get("booksimilar", {}).get("books", [])
        title = "相似推荐"
        for i, b in enumerate(books_data[:args.count], 1):
            info = b.get("book", {}).get("bookInfo", {})
            name = info.get("title", "?")
            author = info.get("author", "?")[:20]
            lines.append(f"  {i:3d}. {name} — {author}")
    else:
        data = call("/book/recommend", count=args.count)
        books_data = data.get("books", [])
        title = "为你推荐"
        for i, b in enumerate(books_data[:args.count], 1):
            name = b.get("title", "?")
            author = b.get("author", "?")[:20]
            rating = b.get("newRating", 0)
            reason = b.get("reason", "")
            rating_str = fmt_rating(rating)
            lines.append(f"  {i:3d}. {name} — {author}  {rating_str}")
            if reason:
                lines.append(f"      推荐: {reason}")

    print_header(title)
    page(lines, page_size=10, title="")
