"""
weread — 微信读书命令行工具

用法:
  weread search <keyword>       搜索书籍
  weread shelf                   查看书架
  weread stats [mode]           阅读统计 (weekly/monthly/annually/overall)
  weread book <book-id>         查看书籍信息
  weread notes [book-id]        查看笔记 (省略显示概览)
  weread review <book-id>       查看点评
  weread discover                推荐好书
  weread profile                 阅读概况
  weread analyze [--full]       阅读分析报告
"""
import sys
import argparse

from . import __version__
from .commands import search, shelf, stats, book, notes, review, discover, profile, analyze


def main(argv: list[str] | None = None):
    parser = argparse.ArgumentParser(
        prog="weread",
        description="微信读书 CLI 工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
更多信息: WEREAD_API_KEY 环境变量需要设置为 wrk-xxxxxxxx 格式的 API Key
        """,
    )
    parser.add_argument("--version", "-v", action="version", version=f"weread-cli {__version__}")

    subparsers = parser.add_subparsers(dest="command", help="子命令")
    search.add_subparser(subparsers)
    shelf.add_subparser(subparsers)
    stats.add_subparser(subparsers)
    book.add_subparser(subparsers)
    notes.add_subparser(subparsers)
    review.add_subparser(subparsers)
    discover.add_subparser(subparsers)
    profile.add_subparser(subparsers)
    analyze.add_subparser(subparsers)

    args = parser.parse_args(argv)
    if not args.command:
        parser.print_help()
        sys.exit(1)

    try:
        args.func(args)
    except KeyboardInterrupt:
        print("\n  已取消")
        sys.exit(0)
    except Exception as e:
        print(f"\n  ⚠️  {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
