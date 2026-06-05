"""
阅读统计 `weread stats [mode]`
"""
from ..api import call
from ..formatter import page, print_header, fmt_time, fmt_timestamp


def add_subparser(subparsers):
    p = subparsers.add_parser("stats", help="阅读统计")
    p.add_argument("mode", nargs="?", default="monthly",
                   choices=["weekly", "monthly", "annually", "overall"],
                   help="统计维度: weekly/monthly(默认)/annually/overall")
    p.add_argument("--base-time", type=int, default=0, help="基准时间戳")
    p.set_defaults(func=run)


def run(args):
    data = call("/readdata/detail", mode=args.mode, baseTime=args.base_time)
    lines = []

    mode_names = {"weekly": "本周", "monthly": "本月", "annually": "本年", "overall": "总计"}
    mode_name = mode_names.get(args.mode, args.mode)

    total_time = data.get("totalReadTime", 0)
    read_days = data.get("readDays", 0)
    day_avg = data.get("dayAverageReadTime", 0)
    compare = data.get("compare")

    lines.append(f"  周期: {mode_name}")
    lines.append(f"  阅读时长: {fmt_time(total_time)}")
    lines.append(f"  阅读天数: {read_days}天")
    if day_avg:
        lines.append(f"  日均阅读: {fmt_time(day_avg)}/天")
    if compare is not None:
        direction = "增长" if compare >= 0 else "下降"
        lines.append(f"  环比: {direction} {abs(compare) * 100:.0f}%")
    lines.append("")

    # 阅读统计摘要
    for s in data.get("readStat", []):
        lines.append(f"  {s['stat']}: {s['counts']}")

    lines.append("")
    lines.append(f"  【阅读排行】")
    for i, r in enumerate(data.get("readLongest", [])[:8], 1):
        b = r.get("book", {})
        title = b.get("title", "?")
        t = fmt_time(r.get("readTime", 0))
        tags = r.get("tags", [])
        tag_str = f" ✨{', '.join(tags)}" if tags else ""
        lines.append(f"  {i}. {title} — {t}{tag_str}")

    # 偏好分类
    cats = data.get("preferCategory", [])
    if cats:
        lines.append("")
        lines.append(f"  【偏好分类】")
        for c in cats:
            lines.append(f"  {c['categoryTitle']}: {c.get('readingCount', 0)}本 ({fmt_time(c.get('readingTime', 0))})")

    # 偏好时段
    pt = data.get("preferTimeWord", "")
    if pt:
        lines.append(f"  阅读时段: {pt}")

    print_header(f"阅读统计 — {mode_name}")
    page(lines, page_size=20, title="")
