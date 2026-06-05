"""
阅读分析 `weread analyze` — 主人专属的深度阅读画像
"""
from collections import Counter
from ..api import call
from ..formatter import page, print_header, fmt_time


def add_subparser(subparsers):
    p = subparsers.add_parser("analyze", help="阅读深度分析")
    p.add_argument("--full", "-f", action="store_true", help="完整分析报告（含藏书清单）")
    p.set_defaults(func=run)


def fmt(sec):
    return fmt_time(sec)


# 思想传统关键词
TRADITIONS = [
    ("自由主義_古典", ["论自由", "liberty", "On Liberty", "政府论", "洛克", "Locke",
                      "社会契约", "契约论", "卢梭", "Rousseau", "利维坦", "霍布斯",
                      "Hobbes", "国富论", "斯密", "密尔", "穆勒", "Mill"]),
    ("自由主義_当代", ["开放社会", "波普尔", "Popper", "猜想与反驳", "通往奴",
                      "奴隶之路", "哈耶克", "Hayek", "无政府", "诺奇克",
                      "知识分子", "鸦片", "Aron", "国家为什么", "纳瓦尔", "金钱心理学"]),
    ("反极权_自由民主", ["极权", "阿伦特", "Arendt", "1984", "一九八四", "奥威尔",
                        "美丽新世界", "赫胥黎", "我们", "扎米亚", "第三帝国",
                        "罪孽的报应", "乌合之众", "动物农场"]),
    ("存在主义_现象学", ["存在", "西西弗", "加缪", "Camus", "局外人", "鼠疫",
                        "萨特", "Sartre", "恶心", "海德格尔", "Heidegger",
                        "弗兰克尔", "Frankl", "亚隆", "Yalom", "存在主义"]),
    ("尼采_生命哲学", ["尼采", "Nietzsche", "查拉图斯特拉", "悲剧的诞生",
                       "善恶的彼岸", "快乐的科学", "叔本华", "Schopenhauer"]),
    ("弗洛姆_社会心理", ["弗洛姆", "Fromm", "逃避自由", "占有还是存在", "爱的艺术", "健全的社会"]),
    ("精神分析", ["弗洛伊德", "Freud", "荣格", "Jung", "红书", "阿德勒", "Adler", "津巴多",
                 "自恋", "心理学"]),
    ("批判理论", ["福柯", "Foucault", "规训", "惩罚", "疯癫", "马尔库塞", "Marcuse",
                 "布尔迪厄", "Bourdieu", "景观社会", "消费社会"]),
    ("韦伯_社会学", ["韦伯", "Weber", "新教伦理", "资本主义精神", "社会分工"]),
    ("分析哲学", ["维特根斯坦", "Wittgenstein", "哲学研究", "分析哲学", "索姆斯",
                  "罗素", "Russell", "逻辑学", "批判性思维", "语言哲学"]),
    ("古希腊哲学", ["柏拉图", "Plato", "理想国", "伊壁鸠鲁", "塞涅卡", "Seneca",
                    "亚里士多德", "亚里士多德", "斯多", "stoic"]),
    ("科技_AI", ["机器学习", "人工智能", "深度", "算法", "计算机",
                 "物理", "量子", "微积分", "概率", "统计", "编程",
                 "Python", "数据", "算法导论", "程序", "数学"]),
]

# 文学版图 — 按地域/语言
LIT_REGIONS = {
    "德语文学": ["卡夫卡", "Kafka", "黑塞", "Hesse", "歌德", "Goethe", "尼采",
                 "里尔克", "Rilke", "托马斯·曼", "Mann", "本雅明", "荷尔德林"],
    "法语文学": ["加缪", "Camus", "萨特", "Sartre", "普鲁斯特", "Proust", "福柯",
                 "纪德", "波伏娃", "Beauvoir", "罗兰·巴特", "鲍德里亚",
                 "兰波", "马拉美", "瓦雷里"],
    "英语文学": ["伍尔夫", "Woolf", "乔伊斯", "Joyce", "奥威尔", "Orwell",
                 "艾略特", "Eliot", "莎士比亚", "弥尔顿", "华兹华斯",
                 "叶芝", "Yeats", "麦克尤恩", "石黑一雄", "村上春树"],
    "俄语文学": ["陀思妥耶夫斯基", "托尔斯泰", "契诃夫", "Chekhov",
                 "纳博科夫", "Nabokov", "布罗茨基", "巴别尔", "帕斯捷尔纳克"],
    "中国文学": ["鲁迅", "史铁生", "余华", "莫言", "王小波",
                 "张爱玲", "沈从文", "老舍", "阿城", "北岛", "顾城",
                 "韩寒", "刘慈欣", "陈春成"],
    "拉美文学": ["马尔克斯", "Márquez", "博尔赫斯", "Borges", "聂鲁达",
                 "科塔萨尔", "略萨", "波拉尼奥"],
}

# 诗歌传统
POETRY_TRADITIONS = {
    "西方诗歌": ["里尔克", "Rilke", "艾略特", "Eliot", "叶芝", "Yeats",
                 "聂鲁达", "纪伯伦", "博尔赫斯", "兰波", "辛波斯卡",
                 "策兰", "保罗·策兰", "荷尔德林"],
    "中国古典诗词": ["李白", "杜甫", "诗经", "楚辞", "宋词", "唐诗",
                    "苏轼", "辛弃疾", "李清照", "陶渊明", "王维",
                    "白居易", "李商隐", "纳兰性德", "古诗"],
    "中国现代诗": ["海子", "徐志摩", "北岛", "顾城", "卞之琳",
                   "穆旦", "食指", "舒婷", "余光中", "郑愁予",
                   "洛夫", "痖弦", "周梦蝶"],
}


def tag_book(book):
    txt = book.get("title", "") + " " + book.get("author", "")
    tags = []
    for name, kws in TRADITIONS:
        for kw in kws:
            if kw in txt:
                tags.append(name)
                break
    return tags


def lit_region(book):
    txt = book.get("title", "") + " " + book.get("author", "")
    hits = []
    for region, authors in LIT_REGIONS.items():
        for a in authors:
            if a in txt:
                hits.append(region)
                break
    return hits


def poetry_tag(book):
    txt = book.get("title", "") + " " + book.get("author", "")
    hits = []
    for trad, poets in POETRY_TRADITIONS.items():
        for p in poets:
            if p in txt:
                hits.append(trad)
                break
    return hits


def category_group(cat: str) -> str:
    """将平台分类归并为大组。"""
    if not cat:
        return "未分类"
    if cat.startswith("哲学宗教"):
        return "哲学"
    if cat.startswith("文学"):
        return "文学"
    if cat.startswith("心理"):
        return "心理学"
    if cat.startswith("社会文化"):
        return "社科"
    if cat.startswith("经济"):
        return "经济"
    if cat.startswith("科学技术") or cat.startswith("计算机"):
        return "科技"
    if cat.startswith("个人成长"):
        return "个人成长"
    if cat.startswith("艺术"):
        return "艺术"
    if cat.startswith("教育"):
        return "教育"
    if cat.startswith("精品小说"):
        return "小说"
    if cat.startswith("历史"):
        return "历史"
    if cat.startswith("政治"):
        return "政治"
    if cat.startswith("医学"):
        return "医学"
    return cat.split("-")[0] if "-" in cat else cat


def run(args):
    shelf_data = call("/shelf/sync")
    overall = call("/readdata/detail", mode="overall", baseTime=0)
    annual = call("/readdata/detail", mode="annually", baseTime=0)
    yearly_prev = call("/readdata/detail", mode="annually", baseTime=1735689600)  # 2024
    monthly = call("/readdata/detail", mode="monthly", baseTime=0)

    books = shelf_data.get("books", [])
    rt = {}  # bookId -> readTime
    for r in overall.get("readLongest", []):
        b = r.get("book", {})
        rt[b.get("bookId", "")] = r.get("readTime", 0)

    lines = []

    # ── 基础数据 ──
    lines.append("  📊 阅读基础数据")
    lines.append(f"  书架: {len(books)}本")
    lines.append(f"  读过: {overall.get('readStat', [{}])[0].get('counts', '?') if overall.get('readStat') else '?'}")
    lines.append(f"  写完: {sum(1 for b in books if b.get('finishReading') == 1)}本")
    lines.append(f"  总阅读: {fmt(overall.get('totalReadTime', 0))} / {overall.get('readDays', 0)}天")
    lines.append(f"  今年阅读: {fmt(annual.get('totalReadTime', 0))} / {annual.get('readDays', 0)}天")
    lines.append("")

    # ── 年度趋势 ──
    prev_time = yearly_prev.get("totalReadTime", 0)
    prev_days = yearly_prev.get("readDays", 0)
    if prev_time:
        lines.append("  📈 年度趋势")
        lines.append(f"  2024: {fmt(prev_time)} / {prev_days}天")
        lines.append(f"  2025: {fmt(annual.get('totalReadTime', 0))} / {annual.get('readDays', 0)}天")
        months_data = monthly.get("monthly", [])
        recent = [m for m in months_data if m.get("totalReadTime", 0) > 0][-6:]
        if recent:
            parts = []
            for m in recent:
                mon = m.get("month", "")
                t = m.get("totalReadTime", 0)
                parts.append(f"{mon[-2:]}月{fmt(t)}")
            lines.append(f"  近6月: {' | '.join(parts)}")
        lines.append("")

    # ── 分类视角（平台分类） ──
    cc = Counter()
    for b in books:
        grp = category_group(b.get("category", ""))
        cc[grp] += 1
    lines.append("  📂 平台分类分布")
    for grp in sorted(cc, key=lambda g: -cc[grp]):
        if cc[grp] < 3:
            continue
        bar = "█" * max(1, cc[grp] // 3)
        lines.append(f"  {grp:　<8} {cc[grp]:>3}本 {bar}")
    lines.append("")

    # ── 思想传统分布 ──
    tc = Counter()
    tt = Counter()
    for b in books:
        tags = tag_book(b)
        for tag in tags:
            tc[tag] += 1
            tt[tag] += rt.get(b.get("bookId", ""), 0)

    lines.append("  📚 思想传统（关键词匹配）")
    for name in sorted(tc, key=lambda n: -tc[n]):
        if tc[name] < 2:
            continue
        pct = tc[name] / len(books) * 100
        bar = "█" * max(1, tc[name] // 2)
        lines.append(f"  {name:　<12} {tc[name]:>3}本 ({pct:>4.0f}%) {bar}")
    lines.append("")

    # ── 阅读时间分布 ──
    lines.append("  ⏱ 阅读时间投入 TOP")
    for name in sorted(tt, key=lambda n: -tt[n]):
        if tt[name] < 1800:
            continue
        bar = "█" * max(1, tt[name] // 3600)
        lines.append(f"  {name:　<12} {fmt(tt[name]):>8} {bar}")
    lines.append("")

    # ── 文学版图 ──
    lr = Counter()
    for b in books:
        for r in lit_region(b):
            lr[r] += 1
    if lr:
        lines.append("  🌍 文学版图（按地域）")
        for r in sorted(lr, key=lambda x: -lr[x]):
            bar = "█" * lr[r]
            lines.append(f"  {r:　<8} {lr[r]:>2}本 {bar}")
        lines.append("")

    # ── 诗歌传统 ──
    pc = Counter()
    for b in books:
        for t in poetry_tag(b):
            pc[t] += 1
    if pc:
        lines.append("  🎭 诗歌传统")
        for t in sorted(pc, key=lambda x: -pc[x]):
            bar = "█" * pc[t]
            lines.append(f"  {t:　<10} {pc[t]:>2}本 {bar}")
        lines.append("")

    # ── 花费时间最长的书 TOP10 ──
    read_books = [(bid, sec) for bid, sec in rt.items() if sec > 3600]
    read_books.sort(key=lambda x: -x[1])
    if read_books:
        lines.append("  📖 耗时最长 TOP10")
        # build a lookup: bookId -> title
        book_titles = {b.get("bookId", ""): b.get("title", "?") for b in books}
        for i, (bid, sec) in enumerate(read_books[:10], 1):
            title = book_titles.get(bid, "?")
            lines.append(f"  {i:>2}. {fmt(sec):>8}  {title[:30]}")
        lines.append("")

    # ── 身份画像 ──
    lines.append("  🔍 身份画像（4 维模型）")

    lib_trads = ["自由主義_古典", "自由主義_当代", "反极权_自由民主"]
    exist_trads = ["存在主义_现象学", "尼采_生命哲学", "弗洛姆_社会心理"]
    lib_books = sum(tc[t] for t in lib_trads if t in tc)
    exist_books = sum(tc[t] for t in exist_trads if t in tc)
    lit_books = lr.total() if lr else 0
    poetry_n = pc.total() if pc else 0
    tech_n = tc.get("科技_AI", 0)

    lib_time = sum(tt[t] for t in lib_trads if t in tt)
    exist_time = sum(tt[t] for t in exist_trads if t in tt)

    lines.append(f"  ① 政治哲学（自由主义）: {lib_books}本 / {fmt(lib_time)}")
    lines.append(f"  ② 存在/生命哲学: {exist_books}本 / {fmt(exist_time)}（阅读时间主导）")
    lines.append(f"  ③ 人文审美（文学+诗歌）: {lit_books + poetry_n}本")
    lines.append(f"  ④ 科技素养: {tech_n}本")

    # Genres that are present
    genres_present = []
    if cc.get("心理学", 0) >= 5:
        genres_present.append("心理学")
    if cc.get("经济", 0) >= 5:
        genres_present.append("经济/财经")
    if cc.get("艺术", 0) >= 3:
        genres_present.append("艺术")
    if cc.get("历史", 0) >= 3:
        genres_present.append("历史")
    if genres_present:
        lines.append(f"  扩展涉猎: {'、'.join(genres_present)}")

    lines.append("")
    if lib_books > 0:
        lines.append("  >> 政治坐标: 自由主义")
        lines.append("     （古典自由 + 当代自由 + 反极权，构成一脉相承的自由谱系）")
    if exist_time > lib_time and exist_time > 3600 * 5:
        lines.append("  >> 精神坐标: 存在主义深度探索者")
        lines.append("     （阅读时间远超政治哲学，显示自由对你而言不仅是政治信念，更是存在方式）")
    if lit_books + poetry_n >= 30:
        lines.append("  >> 审美坐标: 人文主义审美")
        lit_regions_present = [r for r in lr if lr[r] >= 3]
        if lit_regions_present:
            lines.append(f"     （深耕{'、'.join(lit_regions_present[:3])}，兼及诗歌{poetry_n}本）")
    if tech_n >= 10:
        lines.append("  >> 技能坐标: 技术理性")
        lines.append("     （科技/AI 藏书丰富，文理兼备）")

    lines.append("")
    if lib_books > 0 and exist_time > lib_time:
        lines.append("  ★ 总体判断")
        lines.append("    你是一位「自由存在主义者」—— 以古典自由主义为政治基底，")
        lines.append("    以存在主义为精神探索的纵深维度，以文学诗歌为审美栖居，")
        lines.append("    以科技理性为实践工具。自由对你而言，")
        lines.append("    不是抽象的政治理念，而是需要在每一个具体处境中活出来的存在方式。")

    # ── 阅读建议 ──
    lines.append("")
    lines.append("  💡 阅读建议")
    finish = sum(1 for b in books if b.get("finishReading") == 1)
    finish_rate = finish / len(books) * 100 if books else 0
    lines.append(f"  写完率: {finish_rate:.0f}% ({finish}/{len(books)})")
    if finish_rate < 20:
        lines.append("  每季设定1-2本必完目标，体验「完整消化」的满足感")

    # 基于阅读比例的建议
    if tech_n < 5 and cc.get("科技", 0) < 3:
        lines.append("  科技类偏少，建议每半年补充1-2本前沿科技/思维类读物")
    if lib_books > 0 and exist_books > 0 and exist_time > lib_time * 2:
        lines.append("  存在主义阅读很深入了，可考虑横向拓展到现象学/认知科学")

    # ── Full 模式：藏书清单 ──
    if args.full:
        lines.append("")
        lines.append("  📖 哲学/思想类藏书清单")
        for b in books:
            for t in TRADITIONS:
                if t[0] in ["自由主義_古典", "自由主義_当代", "反极权_自由民主",
                            "存在主义_现象学", "尼采_生命哲学", "弗洛姆_社会心理",
                            "分析哲学", "古希腊哲学", "批判理论", "精神分析"]:
                    txt = b.get("title", "") + " " + b.get("author", "")
                    for kw in t[1]:
                        if kw in txt:
                            finish_mark = " ✅" if b.get("finishReading") == 1 else ""
                            secret_mark = " 🔒" if b.get("secret") == 1 else ""
                            t2 = rt.get(b.get("bookId", ""), 0)
                            tm = f" [{fmt(t2)}]" if t2 else ""
                            lines.append(f"  {b.get('title', '?')}{finish_mark}{secret_mark}{tm}")
                            break
                    else:
                        continue
                    break

        lines.append("")
        lines.append("  📖 文学/诗歌类藏书清单")
        for b in books:
            if lit_region(b) or poetry_tag(b):
                finish_mark = " ✅" if b.get("finishReading") == 1 else ""
                secret_mark = " 🔒" if b.get("secret") == 1 else ""
                t2 = rt.get(b.get("bookId", ""), 0)
                tm = f" [{fmt(t2)}]" if t2 else ""
                lines.append(f"  {b.get('title', '?')}{finish_mark}{secret_mark}{tm}")

    print_header("📊 阅读分析报告")
    page(lines, page_size=20)
