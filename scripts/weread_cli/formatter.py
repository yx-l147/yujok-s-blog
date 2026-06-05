"""
格式化输出与分页工具。
"""
import sys
import shutil
from typing import Any


def fmt_time(seconds: int) -> str:
    """将秒转为 X小时Y分钟 格式。"""
    if not seconds:
        return "未读"
    h = seconds // 3600
    m = (seconds % 3600) // 60
    if h > 0 and m > 0:
        return f"{h}小时{m}分钟"
    elif h > 0:
        return f"{h}小时"
    elif m > 0:
        return f"{m}分钟"
    return f"{seconds}秒"


def fmt_timestamp(ts: int) -> str:
    """Unix 时间戳 → YYYY-MM-DD。"""
    import datetime
    if not ts:
        return "未知"
    return datetime.datetime.fromtimestamp(ts).strftime("%Y-%m-%d")


def fmt_rating(rating: int) -> str:
    """百分制评分 → 星级 + 数字。"""
    if not rating:
        return "暂无评分"
    stars = "⭐" * (rating // 20)
    return f"{stars} {rating / 10:.1f}"


def fmt_progress(progress: int) -> str:
    """阅读进度整数 → 百分比。"""
    return f"{progress}%"


def page(items: list[str], page_size: int = 20, title: str = ""):
    """
    分页输出。每显示 page_size 条后暂停等待回车。

    Args:
        items: 待输出的字符串列表
        page_size: 每页显示条数
        title: 页面标题
    """
    if title:
        print(f"\n{'=' * 60}")
        print(f"  {title}")
        print(f"{'=' * 60}")

    if not items:
        print("  (无数据)")
        return

    # 非交互模式（管道/重定向/测试）：一次性全部输出
    if not sys.stdout.isatty():
        for line in items:
            print(line)
        return

    total = len(items)
    for i in range(0, total, page_size):
        chunk = items[i:i + page_size]
        for line in chunk:
            print(line)

        remaining = total - (i + page_size)
        if remaining > 0:
            try:
                input(f"\n-- 还有 {remaining} 条，按回车继续 (q 退出) -- ")
            except (KeyboardInterrupt, EOFError):
                print("\n-- 已退出 --")
                break
    print()


def print_item(label: str, value: Any, indent: int = 0):
    """打印带标签的单行。"""
    prefix = "  " * indent
    print(f"{prefix}{label}: {value}")


def print_separator(char: str = "=", width: int = 60):
    """打印分隔线。"""
    print(char * width)


def print_header(title: str, width: int = 60):
    """打印标题块。"""
    print(f"\n{'=' * width}")
    print(f"  {title}")
    print(f"{'=' * width}")


def input_select(prompt: str) -> str:
    """带提示的输入，捕获异常。"""
    try:
        return input(prompt).strip()
    except (KeyboardInterrupt, EOFError):
        print()
        return ""


def format_book_short(b: dict) -> str:
    """格式化简短书籍信息。"""
    title = b.get("title", "?")
    author = b.get("author", "?")[:20]
    rating = b.get("newRating", 0)
    tag = b.get("newRatingDetail", {}).get("title", "")
    rating_str = fmt_rating(rating) if rating else tag
    return f"  {title} — {author}  {rating_str}"
