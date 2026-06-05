"""
书籍点评 `weread review <book-id>`
"""
from ..api import call
from ..formatter import page, print_header, fmt_time, fmt_timestamp


def add_subparser(subparsers):
    p = subparsers.add_parser("review", help="查看书籍点评")
    p.add_argument("book_id", help="书籍 ID")
    p.add_argument("--type", "-t", type=int, default=0, choices=[0, 1, 2, 3, 4],
                   help="筛选: 0=全部, 1=推荐, 2=不行, 3=最新, 4=一般")
    p.set_defaults(func=run)


def run(args):
    data = call("/review/list", bookId=args.book_id, reviewListType=args.type)

    lines = []
    reviews = data.get("reviews", [])
    lines.append(f"  点评总数: {data.get('reviewsCnt', 0)}")
    deep_v = data.get("deepVRecommendInfo", {})
    if deep_v:
        lines.append(f"  资深会员: {deep_v.get('title', '')}")
    lines.append(f"  好友点评: {data.get('friendCommentCount', 0)}人")
    lines.append("")

    stars_map = {100: "⭐⭐⭐⭐⭐", 80: "⭐⭐⭐⭐", 60: "⭐⭐⭐", 40: "⭐⭐", 20: "⭐"}
    for i, r in enumerate(reviews[:20], 1):
        outer = r.get("review", {})
        inner = outer.get("review", {})
        author = outer.get("author", {})
        name = author.get("name", "匿名")
        star = inner.get("star", 0)
        star_str = stars_map.get(star, "")
        content = inner.get("content", "")
        is_finish = inner.get("isFinish", 0)
        finish_str = " ✅读完" if is_finish else ""
        ct = fmt_timestamp(inner.get("createTime", 0))

        lines.append(f"  {i}. {name} {star_str}{finish_str}")
        lines.append(f"    {content[:300]}{'...' if len(content) > 300 else ''}")
        lines.append(f"    {ct}\n")

    print_header(f"点评 ({len(reviews)}条)")
    page(lines, page_size=10)
