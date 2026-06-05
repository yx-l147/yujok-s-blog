"""
用户信息 `weread profile`
"""
from ..api import call
from ..formatter import page, print_header, fmt_time, fmt_timestamp


def add_subparser(subparsers):
    p = subparsers.add_parser("profile", help="用户阅读概况")
    p.set_defaults(func=run)


def run(args):
    shelf = call("/shelf/sync")
    stats = call("/readdata/detail", mode="overall", baseTime=0)

    books = shelf.get("books", [])
    albums = shelf.get("albums", [])
    mp = shelf.get("mp")
    total = len(books) + len(albums) + (1 if mp else 0)

    lines = []
    lines.append(f"  【书架】")
    lines.append(f"  总条目: {total}")
    lines.append(f"  电子书: {len(books)}本")
    if albums:
        lines.append(f"  有声书: {len(albums)}个")
    lines.append(f"  读完: {sum(1 for b in books if b.get('finishReading')==1)}本")
    lines.append(f"")

    lines.append(f"  【阅读统计】")
    lines.append(f"  总阅读: {fmt_time(stats.get('totalReadTime', 0))}")
    lines.append(f"  阅读天数: {stats.get('readDays', 0)}天")
    for s in stats.get("readStat", []):
        lines.append(f"  {s['stat']}: {s['counts']}")
    lines.append(f"")

    lines.append(f"  【近期在读】")
    recent = sorted(books, key=lambda b: b.get("readUpdateTime", 0), reverse=True)[:8]
    for b in recent:
        title = b.get("title", "?")[:25]
        ts = fmt_timestamp(b.get("readUpdateTime", 0))
        progress = "✅" if b.get("finishReading") == 1 else "📖"
        lines.append(f"  {progress} {title} — {ts}")

    print_header("用户阅读概况")
    page(lines, page_size=15, title="")
