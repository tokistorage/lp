#!/usr/bin/env python3
"""Generate TokiStorage NDL Newsletter PDFs (国立国会図書館寄贈用ニュースレター).

Numbering scheme (designed for 1000+ years, 式年遷宮型):
  - Volume (巻): 20-year cycle from 2026 (Vol.1 = 2026–2045, Vol.2 = 2046–2065, ...)
  - Number (号): Sequential within volume (resets each 遷宮 cycle)
  - Serial (通巻): Overall sequential number across all volumes
  - File naming: YYYY-MM (publication month, e.g., 2026-02, 2026-06, 2027-01)

Layout: A4 landscape (297mm × 210mm) — matches TokiQR print output.

Usage:
  python3 generate-newsletter.py              # Generate Vol.1 No.1
  python3 generate-newsletter.py 2026 2 2     # Generate 2026, No.2, serial #2
"""

import os
import sys
import textwrap
from fpdf import FPDF

# ── Paths ──────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(SCRIPT_DIR, "newsletter")
ICON_PATH = os.path.join(SCRIPT_DIR, "asset", "tokistorage-icon-circle.png")
TOKIQR_DIR = os.path.join(SCRIPT_DIR, "tokiqr")

# Font detection: macOS → Linux fallback
FONT_CANDIDATES = [
    # macOS Hiragino Kaku Gothic
    "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
    "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",
    # Linux IPA Gothic (GitHub Actions, etc.)
    "/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf",
    "/usr/share/fonts/truetype/ipafont-gothic/ipagp.ttf",
]

FONT_BOLD_CANDIDATES = [
    "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",
    "/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf",
    "/usr/share/fonts/truetype/ipafont-gothic/ipagp.ttf",
]


def find_font(candidates):
    for path in candidates:
        if os.path.exists(path):
            return path
    return None


FONT_PATH = find_font(FONT_CANDIDATES)
FONT_BOLD_PATH = find_font(FONT_BOLD_CANDIDATES)

if not FONT_PATH:
    print("ERROR: No Japanese font found. Install IPA Gothic or run on macOS.")
    sys.exit(1)

# ── Colors (matching TokiStorage brand) ────────────────────────────────
TOKI_BLUE = (37, 99, 235)       # #2563EB
DARK = (30, 41, 59)             # #1e293b
SECONDARY = (71, 85, 105)       # #475569
MUTED = (148, 163, 184)         # #94a3b8
BORDER = (226, 232, 240)        # #e2e8f0
BG_LIGHT = (248, 250, 252)      # #f8fafc
WHITE = (255, 255, 255)
EMERALD = (22, 163, 74)         # #16a34a

# ── Publication constants ──────────────────────────────────────────────
INAUGURAL_YEAR = 2026
VOLUME_SPAN = 20  # 式年遷宮型: 1巻 = 20年
PUBLICATION_NAME = "TokiStorage Newsletter"
PUBLICATION_NAME_JA = "トキストレージ ニュースレター"
PUBLISHER = "TokiStorage（佐藤卓也）"
PUBLISHER_ADDRESS = "〒279-0014 千葉県浦安市明海2-11-13"
PUBLISHER_URL = "https://tokistorage.github.io/lp/"
PUBLISHER_EMAIL = "tokistorage1000@gmail.com"


# ── Layout constants (A4 landscape: 297mm × 210mm) ───────────────────
PAGE_W = 297
PAGE_H = 210
MARGIN = 15
CONTENT_W = PAGE_W - MARGIN * 2   # 267mm


# ── PDF Class ──────────────────────────────────────────────────────────
class NewsletterPDF(FPDF):
    """Newsletter PDF with Japanese font support and consistent styling."""

    def __init__(self):
        super().__init__(orientation="L", format="A4")
        self.add_font("JP", "", FONT_PATH)
        self.add_font("JP", "B", FONT_BOLD_PATH or FONT_PATH)
        self.set_auto_page_break(auto=True, margin=20)

    def _footer_line(self, text):
        self.set_y(-15)
        self.set_draw_color(*BORDER)
        self.line(MARGIN, self.get_y(), PAGE_W - MARGIN, self.get_y())
        self.ln(3)
        self.set_font("JP", "", 6.5)
        self.set_text_color(*MUTED)
        self.cell(0, 3.5, text, align="C")

    def accent_bar(self):
        """Top accent bar in TokiStorage blue."""
        self.set_fill_color(*TOKI_BLUE)
        self.rect(0, 0, PAGE_W, 3.5, "F")

    def section_heading(self, title):
        self.ln(3)
        self.set_font("JP", "B", 11)
        self.set_text_color(*DARK)
        y = self.get_y()
        self.set_fill_color(*TOKI_BLUE)
        self.rect(MARGIN, y, 3, 7, "F")
        self.set_x(MARGIN + 7)
        self.cell(0, 7, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def body(self, text):
        self.set_font("JP", "", 9)
        self.set_text_color(*SECONDARY)
        self.set_x(MARGIN)
        self.multi_cell(CONTENT_W, 5.5, text)
        self.ln(2)

    def body_bold(self, text):
        self.set_font("JP", "B", 9)
        self.set_text_color(*DARK)
        self.set_x(MARGIN)
        self.multi_cell(CONTENT_W, 5.5, text)
        self.ln(1)

    def meta_row(self, label, value, label_w=42):
        self.set_font("JP", "", 8)
        self.set_text_color(*MUTED)
        self.set_x(MARGIN)
        self.cell(label_w, 6, label, align="L")
        self.set_font("JP", "", 9)
        self.set_text_color(*DARK)
        self.cell(0, 6, value, new_x="LMARGIN", new_y="NEXT")

    def divider(self):
        self.ln(2)
        self.set_draw_color(*BORDER)
        self.line(MARGIN, self.get_y(), PAGE_W - MARGIN, self.get_y())
        self.ln(4)

    def info_box(self, text):
        """Light-background information box."""
        y = self.get_y()
        self.set_fill_color(*BG_LIGHT)
        self.set_draw_color(*BORDER)
        self.set_font("JP", "", 8.5)
        lines = len(text) / 55 + text.count("\n")
        h = max(lines * 5 + 8, 16)
        self.rect(MARGIN, y, CONTENT_W, h, "DF")
        self.set_xy(MARGIN + 5, y + 3)
        self.set_text_color(*SECONDARY)
        self.multi_cell(CONTENT_W - 10, 5, text)
        self.set_y(y + h + 2)


def generate_vol1():
    """Generate Vol.1 No.1 (創刊号) — February 2026."""
    year = 2026
    month = 2
    issue_num = 1   # 巻内通し番号 (resets each 遷宮 cycle)
    serial = 1      # 全巻通し番号 (never resets)
    volume = (year - INAUGURAL_YEAR) // VOLUME_SPAN + 1  # Vol.1 = 2026–2045

    pdf = NewsletterPDF()

    # PDF metadata
    pdf.set_title(f"TokiStorage Newsletter Vol.{volume} No.{issue_num} — 創刊号")
    pdf.set_author("TokiStorage（佐藤卓也）")
    pdf.set_subject("存在証明の民主化")
    pdf.set_keywords("存在証明, QRコード, 国立国会図書館, 逐次刊行物, 三層分散保管")
    pdf.set_creator("generate-newsletter.py")

    # ═══════════════════════════════════════════════════════════════════
    # PAGE 1: Cover
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.accent_bar()
    pdf.set_auto_page_break(auto=False)

    # Icon
    if os.path.exists(ICON_PATH):
        pdf.image(ICON_PATH, x=(PAGE_W - 50) / 2, y=12, w=50)

    # Publication name
    pdf.set_y(68)
    pdf.set_font("JP", "", 10)
    pdf.set_text_color(*TOKI_BLUE)
    pdf.cell(0, 6, PUBLICATION_NAME, align="C", new_x="LMARGIN", new_y="NEXT")

    # Volume info
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5, f"第{volume}巻 第{issue_num}号（通巻第{serial}号）", align="C",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    # Title
    pdf.set_font("JP", "B", 28)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 18, "創刊号", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.set_font("JP", "", 11)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(0, 7, "── 声を、国家の永久保存記録にする ──", align="C",
             new_x="LMARGIN", new_y="NEXT")

    pdf.ln(12)

    # Date and issue info
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(0, 6, "2026年2月", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.cell(0, 6, f"Vol.{volume}  No.{issue_num}  Serial #{serial:05d}", align="C",
             new_x="LMARGIN", new_y="NEXT")

    pdf.ln(15)

    # Publisher info box
    box_w = 160
    box_x = (PAGE_W - box_w) / 2
    pdf.set_draw_color(*BORDER)
    box_y = pdf.get_y()
    pdf.rect(box_x, box_y, box_w, 35, "D")
    pdf.set_xy(box_x + 5, box_y + 4)
    pdf.set_font("JP", "B", 9)
    pdf.set_text_color(*DARK)
    pdf.cell(box_w - 10, 6, "発行者", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(box_x + 5)
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(box_w - 10, 6, PUBLISHER, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(box_x + 5)
    pdf.cell(box_w - 10, 6, PUBLISHER_ADDRESS, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(box_x + 5)
    pdf.cell(box_w - 10, 6, PUBLISHER_URL, align="C", new_x="LMARGIN", new_y="NEXT")

    # Footer
    pdf._footer_line(f"{PUBLICATION_NAME_JA}　第{volume}巻 第{issue_num}号（通巻第{serial}号）　2026年2月")

    # ═══════════════════════════════════════════════════════════════════
    # PAGE 2: Colophon (奥付) — Required for NDL deposit
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.accent_bar()
    pdf.set_auto_page_break(auto=False)

    pdf.set_y(15)
    pdf.set_font("JP", "B", 14)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 10, "奥付（Colophon）", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(2)
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5, "国立国会図書館法に基づく納本に必要な刊行情報", align="C",
             new_x="LMARGIN", new_y="NEXT")

    pdf.ln(5)

    # Colophon data table
    colophon_data = [
        ("刊行物名", PUBLICATION_NAME_JA),
        ("英題", PUBLICATION_NAME),
        ("巻号", f"第{volume}巻 第{issue_num}号（通巻第{serial}号）"),
        ("発行年月日", "2026年（令和8年）2月13日"),
        ("発行者", "佐藤卓也"),
        ("屋号", "TokiStorage（トキストレージ）"),
        ("発行者住所", PUBLISHER_ADDRESS),
        ("URL", PUBLISHER_URL),
        ("連絡先", PUBLISHER_EMAIL),
        ("刊行頻度", "不定期（年複数回の刊行を予定）"),
        ("フォーマット", "PDF（電子書籍等・オンライン資料）"),
        ("根拠法", "国立国会図書館法 第25条・第25条の4"),
        ("採番体系", "式年遷宮型（1巻＝20年） ※1000年発行を想定"),
        ("ISSN", "未申請（今後申請予定）"),
    ]

    pdf.set_fill_color(*BG_LIGHT)
    for i, (label, value) in enumerate(colophon_data):
        y = pdf.get_y()
        fill = i % 2 == 0
        if fill:
            pdf.set_fill_color(*BG_LIGHT)
            pdf.rect(MARGIN, y, CONTENT_W, 8, "F")
        pdf.set_xy(MARGIN + 3, y)
        pdf.set_font("JP", "B", 8)
        pdf.set_text_color(*MUTED)
        pdf.cell(50, 8, label)
        pdf.set_font("JP", "", 9)
        pdf.set_text_color(*DARK)
        pdf.cell(0, 8, value, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(3)
    pdf.divider()

    # Numbering system explanation
    pdf.set_font("JP", "B", 9)
    pdf.set_text_color(*DARK)
    pdf.set_x(MARGIN)
    pdf.cell(0, 6, "採番体系について", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*SECONDARY)
    pdf.set_x(MARGIN)
    numbering_text = (
        "本ニュースレターは、式年遷宮に倣い1巻＝20年の周期で採番しています。\n"
        "・巻（Volume）＝ 20年周期（第1巻＝2026–2045年、第2巻＝2046–2065年…）\n"
        "・号（Number）＝ 巻内の通し番号（遷宮ごとにリセット）\n"
        "・通巻（Serial）＝ 全巻を通じた連番（5桁、最大99,999号）\n"
        "・ファイル名＝ YYYY-MM形式（発行月。例：2026-02, 3026-12）\n"
        "1000年で50巻。伊勢神宮の遷宮と同じ周期で、記録を次世代に受け渡していきます。"
    )
    pdf.multi_cell(CONTENT_W, 4.5, numbering_text)

    pdf._footer_line(f"{PUBLICATION_NAME_JA}　奥付")

    # ═══════════════════════════════════════════════════════════════════
    # PAGE 3–4: Content (本文)
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.accent_bar()
    pdf.set_auto_page_break(auto=True, margin=20)

    pdf.set_y(12)

    # Section 1: 発刊にあたって
    pdf.section_heading("発刊にあたって")
    pdf.body(
        "このニュースレターは、トキストレージが発行する逐次刊行物です。"
        "国立国会図書館法（第25条・第25条の4）に基づき、電子書籍等として納本されます。"
    )
    pdf.body(
        "「私が存在した」ことを永久に残す——その手段が、すべての人に開かれる時代が来ました。"
        "記録が積み重なるほど、世代を越えた対話が生まれます。"
        "あなたの曾祖父母の顔と声、わかりますか？"
    )
    pdf.body(
        "トキストレージは「存在証明の民主化」を使命に掲げ、"
        "すべての人の声と存在を国家永久保存にする唯一の無料・デジタル完結の手段を提供します。"
        "本ニュースレターは、その活動記録であり、同時にそれ自体が国立国会図書館に永久保存される"
        "「存在証明」でもあります。"
    )

    pdf.divider()

    # Section 2: トキストレージとは
    pdf.section_heading("トキストレージとは")
    pdf.body_bold("ミッション：あなたが物語になる")
    pdf.body(
        "トキストレージは、物理・国家・民間の三層分散保管によって、"
        "あなたの存在証明を永続化するサービスです。個人事業として2026年2月に創業しました。"
    )

    pdf.body_bold("三層分散保管アーキテクチャ")

    # Three-layer table
    layers = [
        ("物理層", "石英ガラス／UV耐性ラミネート", "電源・サーバー不要。手元に届き、触れられる存在証明"),
        ("国家層", "国立国会図書館（法定納本）", "国の法制度による制度的永久保存"),
        ("民間層", "GitHub（Arctic Code Vault）", "世界中に分散されたサーバー＋北極圏アーカイブ"),
    ]

    y = pdf.get_y()
    pdf.set_fill_color(*BG_LIGHT)
    pdf.set_draw_color(*BORDER)

    # Header — columns sized for landscape
    col_layer = 35
    col_medium = 80
    col_desc = CONTENT_W - col_layer - col_medium
    pdf.set_x(MARGIN)
    pdf.set_font("JP", "B", 8)
    pdf.set_text_color(*DARK)
    pdf.set_fill_color(*TOKI_BLUE)
    pdf.set_text_color(*WHITE)
    pdf.cell(col_layer, 7, "  層", fill=True)
    pdf.cell(col_medium, 7, "  媒体", fill=True)
    pdf.cell(col_desc, 7, "  特徴", fill=True)
    pdf.ln()

    for i, (layer, medium, desc) in enumerate(layers):
        fill = i % 2 == 0
        if fill:
            pdf.set_fill_color(*BG_LIGHT)
        pdf.set_x(MARGIN)
        pdf.set_font("JP", "B", 8)
        pdf.set_text_color(*DARK)
        pdf.cell(col_layer, 7, "  " + layer, fill=fill)
        pdf.set_font("JP", "", 8)
        pdf.set_text_color(*SECONDARY)
        pdf.cell(col_medium, 7, "  " + medium, fill=fill)
        pdf.cell(col_desc, 7, "  " + desc, fill=fill)
        pdf.ln()

    pdf.ln(3)
    pdf.body(
        "この設計は、データ保全の世界標準「3-2-1ルール」"
        "——3つのコピー、2種類の媒体、1つはオフサイト——を満たします。"
        "単一障害点がなく、どれかひとつが残れば、存在証明は失われません。"
    )

    pdf.divider()

    # Section 3: 技術概要
    pdf.section_heading("技術概要：声を国家の永久保存記録にする")

    pdf.body_bold("パイプライン：声 → QRコード → PDF → 国会図書館")
    pdf.body(
        "音声は本来、再生機器やサーバーがなければ消えてしまう揮発性の高いメディアです。"
        "トキストレージは、独自データ圧縮技術により、"
        "データサイズ制約の多いQRコードの仕様内でより多くの声を記録します。"
        "音声をQRコードに変換し、PDFに埋め込み、ニュースレター（本誌）として"
        "国立国会図書館に納本します。"
    )

    # Flow diagram as text
    pdf.ln(1)
    pdf.set_font("JP", "B", 10)
    pdf.set_text_color(*TOKI_BLUE)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 8, "[声]  ->  [QRコード]  ->  [PDF]  ->  [国会図書館]", align="C",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    pdf.body_bold("なぜ、この方法しかないのか")
    pdf.body(
        "国立国会図書館のオンライン資料収集が受け付けるフォーマットは "
        "PDF・EPUB・DAISYの3種のみ。MP3やWAVなどの音声ファイルは"
        "「図書又は逐次刊行物に相当するもの」に該当せず、制度上、納本できません。\n\n"
        "物理メディア（CD/DVD）に焼いて納本する方法はありますが、製造費・郵送費がかかり、"
        "デジタルで完結しません。\n\n"
        "音声→QRコード→PDF→ニュースレター（逐次刊行物）という変換は、"
        "無料・デジタル完結・可逆的（元の音声に復元可能）・制度的に適格"
        "——この4条件をすべて満たす唯一の方法です。"
    )

    pdf.divider()

    # Section 4: このニュースレター自体が存在証明
    pdf.section_heading("このニュースレター自体が存在証明")
    pdf.body(
        "ここに重要な自己言及があります。"
        "このPDFは、国立国会図書館に納本されます。つまり、今あなたが読んでいるこの文書自体が、"
        "制度的に永久保存される「存在証明」です。"
    )
    pdf.body(
        "トキストレージのニュースレターは、単なる広報ではありません。"
        "顧客の声（TokiQRコード）を掲載し、それを国家保存に届ける「媒体」であると同時に、"
        "トキストレージという事業そのものの存在証明でもあります。"
    )

    pdf.divider()

    # Section 5: エッセイ紹介
    pdf.section_heading("エッセイ紹介 ── なぜ、こう設計したのか")
    pdf.body(
        "トキストレージの設計思想は、一連のエッセイとして公開しています。"
        "創刊号に関連する3本をご紹介します。"
    )

    base_url = "https://tokistorage.github.io/lp/"
    essays = [
        ("30秒音声の世界",
         "QRコードに音声を刻める時間が2秒から30秒に拡張されたとき、"
         "変わったのは数字ではなく、体験の質だった。"
         "2秒では「声が出た」という技術実証。30秒では「想いを残せた」という存在証明。",
         f"{base_url}30seconds.html"),
        ("3-2-1ルール ── 三層分散保管の根拠",
         "「3-2-1ルール」はデータバックアップの世界標準であり、"
         "半世紀にわたり実証されてきた原則である。"
         "トキストレージの三層分散保管は、この原則を「データ保全」から「存在証明」へと拡張した設計である。",
         f"{base_url}backup-rule.html"),
        ("公開主義 ── 構造的に隠せない設計",
         "組織は秘密を持つと、その管理にリソースを奪われる。"
         "トキストレージは「隠さない」のではなく「構造的に隠せない」設計を採用した。"
         "QRコードを石英に刻むという行為自体が、公開性の物理的な宣言である。",
         f"{base_url}openness.html"),
    ]

    # Disable auto page break during essay boxes to prevent mid-box splits
    pdf.set_auto_page_break(auto=False)

    for title, excerpt, url in essays:
        # Measure box height: title (7mm) + text + padding
        pdf.set_font("JP", "", 8.5)
        text_w = CONTENT_W - 10
        chars_per_line = int(text_w / 3)  # ~8.5pt Japanese ≈ 3mm per char
        n_lines = 0
        for paragraph in excerpt.split("\n"):
            n_lines += max(1, -(-len(paragraph) // chars_per_line))
        text_h = n_lines * 4.5
        box_h = 3 + 7 + text_h + 5  # top pad + title + text + bottom pad

        # Force page break if box won't fit
        if pdf.get_y() + box_h > PAGE_H - 18:
            pdf.add_page()
            pdf.accent_bar()

        y = pdf.get_y()
        pdf.set_fill_color(*BG_LIGHT)
        pdf.set_draw_color(*BORDER)
        pdf.rect(MARGIN, y, CONTENT_W, box_h, "DF")
        pdf.set_xy(MARGIN + 5, y + 3)
        pdf.set_font("JP", "B", 9)
        pdf.set_text_color(*TOKI_BLUE)
        pdf.cell(text_w, 7, title, new_x="LMARGIN", new_y="NEXT", link=url)
        pdf.set_x(MARGIN + 5)
        pdf.set_font("JP", "", 8.5)
        pdf.set_text_color(*SECONDARY)
        pdf.multi_cell(text_w, 4.5, excerpt)
        pdf.set_y(y + box_h + 3)

    # Re-enable auto page break
    pdf.set_auto_page_break(auto=True, margin=20)

    pdf.ln(1)
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 5,
             f"全エッセイは {PUBLISHER_URL} からお読みいただけます。",
             new_x="LMARGIN", new_y="NEXT")

    pdf.divider()

    # Section 6: 今後の予定
    pdf.section_heading("今後の予定")
    pdf.body(
        "次号以降、以下の内容を予定しています：\n\n"
        "・ご利用者さまの声（許諾をいただいたTokiQRの掲載）\n"
        "・佐渡島 物理保管拠点の構築報告\n"
        "・パートナー・協賛者のご紹介"
    )

    pdf.ln(4)

    # ═══════════════════════════════════════════════════════════════════
    # TokiQR Cover Page (扉ページ) — before the actual TokiQR print page
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.accent_bar()
    pdf.set_auto_page_break(auto=False)

    pdf.set_y(30)

    # Section number + title
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*TOKI_BLUE)
    pdf.cell(0, 6, "── 巻末セクション ──", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    pdf.set_font("JP", "B", 20)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 14, "TokiQR：代表メッセージ", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    desc_w = 220
    desc_x = (PAGE_W - desc_w) / 2
    pdf.set_font("JP", "", 9.5)
    pdf.set_text_color(*SECONDARY)
    pdf.set_x(desc_x)
    pdf.multi_cell(desc_w, 6, (
        "創刊号の巻末として、トキストレージ代表 佐藤卓也による最初のTokiQRを掲載します。\n"
        "次のページに印刷されたQRコードをスマートフォンでスキャンすると、"
        "代表の肉声を再生できます。"
    ), align="C")

    pdf.ln(6)

    # Key message box
    box_w = 240
    box_x = (PAGE_W - box_w) / 2
    box_y = pdf.get_y()
    pdf.set_fill_color(*BG_LIGHT)
    pdf.set_draw_color(*BORDER)
    pdf.rect(box_x, box_y, box_w, 30, "DF")
    pdf.set_xy(box_x + 10, box_y + 5)
    pdf.set_font("JP", "B", 9)
    pdf.set_text_color(*DARK)
    pdf.multi_cell(box_w - 20, 6, (
        "サーバーは不要です。データはQRコード内に完全に埋め込まれています。\n"
        "インターネット接続があればスマートフォンだけで再生可能。\n"
        "100年後でも、このQRコードが残っていれば声は蘇ります。"
    ), align="C")

    pdf.set_y(box_y + 36)
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5, "読み取りのコツ：カメラを3倍ズームにして、少し離してスキャンすると認識しやすくなります。",
             align="C", new_x="LMARGIN", new_y="NEXT")

    pdf._footer_line(f"{PUBLICATION_NAME_JA}　巻末 TokiQR")

    # ═══════════════════════════════════════════════════════════════════
    # LAST PAGE: Back Cover (must be last — merge inserts TokiQR before this)
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.accent_bar()
    pdf.set_auto_page_break(auto=False)

    pdf.set_y(35)

    # NDL deposit declaration
    pdf.set_font("JP", "B", 12)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 8, "国立国会図書館 納本宣言", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    decl_w = 200
    decl_x = (PAGE_W - decl_w) / 2
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.set_x(decl_x)
    pdf.multi_cell(decl_w, 6, (
        "本誌は、国立国会図書館法（第25条の4）に基づき、"
        "オンライン資料として国立国会図書館に納本されます。\n\n"
        "This publication is deposited with the National Diet Library "
        "of Japan under Article 25-4 of the National Diet Library Law."
    ), align="C")

    pdf.ln(12)
    pdf.divider()

    # Next issue preview
    pdf.ln(4)
    pdf.set_font("JP", "B", 10)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 7, "次号予告", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.set_x(decl_x)
    pdf.multi_cell(decl_w, 6, (
        f"第{volume}巻 第{issue_num + 1}号（通巻第{serial + 1}号）は、"
        "ご利用者さまの声（TokiQR）の掲載と、佐渡島物理保管拠点の進捗報告を予定しています。"
    ), align="C")

    pdf.ln(12)

    # Copyright
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5, "© 2026 TokiStorage（佐藤卓也）. All rights reserved.", align="C",
             new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 5, PUBLISHER_URL, align="C", new_x="LMARGIN", new_y="NEXT")

    pdf._footer_line(f"{PUBLICATION_NAME_JA}　第{volume}巻 第{issue_num}号　裏表紙")

    # ═══════════════════════════════════════════════════════════════════
    # Output — generate base PDF, then merge TokiQR page before back cover
    # ═══════════════════════════════════════════════════════════════════
    os.makedirs(OUT_DIR, exist_ok=True)
    filename = f"{year}-{month:02d}.pdf"
    out_path = os.path.join(OUT_DIR, filename)

    # Find TokiQR representative PDF
    tokiqr_pdf_path = None
    if os.path.isdir(TOKIQR_DIR):
        for f in sorted(os.listdir(TOKIQR_DIR)):
            if f.endswith(".pdf"):
                tokiqr_pdf_path = os.path.join(TOKIQR_DIR, f)
                break

    if tokiqr_pdf_path:
        # Write base newsletter to temp file, then merge with TokiQR
        from pypdf import PdfReader, PdfWriter

        tmp_path = out_path + ".tmp"
        pdf.output(tmp_path)
        print(f"  Base PDF: {tmp_path}")

        newsletter = PdfReader(tmp_path)
        tokiqr = PdfReader(tokiqr_pdf_path)
        writer = PdfWriter()

        # All pages except the last (back cover) — includes the TokiQR cover page
        for i in range(len(newsletter.pages) - 1):
            writer.add_page(newsletter.pages[i])

        # Insert TokiQR print page(s) after the cover page
        for page in tokiqr.pages:
            writer.add_page(page)
        print(f"  TokiQR merged: {tokiqr_pdf_path}")

        # Append back cover
        writer.add_page(newsletter.pages[-1])

        with open(out_path, "wb") as f:
            writer.write(f)
        os.remove(tmp_path)
    else:
        pdf.output(out_path)
        print("  (No TokiQR PDF found — skipped merge)")

    size_kb = os.path.getsize(out_path) / 1024
    print(f"  -> {out_path} ({size_kb:.1f} KB)")
    return out_path


def generate_issue(year, month, issue_num, serial):
    """Generate newsletter for any issue based on manifest data.

    Usage: python3 generate-newsletter.py 2026 4 2 2
           (year=2026, month=4, issue_num=2, serial=2)
    """
    import json

    volume = (year - INAUGURAL_YEAR) // VOLUME_SPAN + 1
    month_str = f"{year}-{month:02d}"
    manifest_path = os.path.join(SCRIPT_DIR, "newsletter", "materials", month_str, "manifest.json")

    if not os.path.exists(manifest_path):
        print(f"  ERROR: manifest not found: {manifest_path}")
        sys.exit(1)

    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)

    pdf = NewsletterPDF()
    pdf.set_title(f"TokiStorage Newsletter Vol.{volume} No.{issue_num}")
    pdf.set_author("TokiStorage（佐藤卓也）")
    pdf.set_subject("存在証明の民主化")
    pdf.set_creator("generate-newsletter.py")

    footer_text = f"{PUBLICATION_NAME_JA}　第{volume}巻 第{issue_num}号（通巻第{serial}号）　{year}年{month}月"

    # ═══════════════════════════════════════════════════════════════════
    # PAGE 1: Cover
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.accent_bar()
    pdf.set_auto_page_break(auto=False)

    if os.path.exists(ICON_PATH):
        pdf.image(ICON_PATH, x=(PAGE_W - 50) / 2, y=12, w=50)

    pdf.set_y(68)
    pdf.set_font("JP", "", 10)
    pdf.set_text_color(*TOKI_BLUE)
    pdf.cell(0, 6, PUBLICATION_NAME, align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5, f"第{volume}巻 第{issue_num}号（通巻第{serial}号）", align="C",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    title_ja = manifest["issue"].get("title_ja", f"第{issue_num}号")
    pdf.set_font("JP", "B", 24)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 18, title_ja, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(12)

    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(0, 6, f"{year}年{month}月", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.cell(0, 6, f"Vol.{volume}  No.{issue_num}  Serial #{serial:05d}", align="C",
             new_x="LMARGIN", new_y="NEXT")

    pdf.ln(15)
    box_w = 160
    box_x = (PAGE_W - box_w) / 2
    pdf.set_draw_color(*BORDER)
    box_y = pdf.get_y()
    pdf.rect(box_x, box_y, box_w, 35, "D")
    pdf.set_xy(box_x + 5, box_y + 4)
    pdf.set_font("JP", "B", 9)
    pdf.set_text_color(*DARK)
    pdf.cell(box_w - 10, 6, "発行者", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(box_x + 5)
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(box_w - 10, 6, PUBLISHER, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(box_x + 5)
    pdf.cell(box_w - 10, 6, PUBLISHER_ADDRESS, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(box_x + 5)
    pdf.cell(box_w - 10, 6, PUBLISHER_URL, align="C", new_x="LMARGIN", new_y="NEXT")

    pdf._footer_line(footer_text)

    # ═══════════════════════════════════════════════════════════════════
    # PAGE 2: Colophon
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.accent_bar()
    pdf.set_auto_page_break(auto=False)

    pdf.set_y(15)
    pdf.set_font("JP", "B", 14)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 10, "奥付（Colophon）", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5, "国立国会図書館法に基づく納本に必要な刊行情報", align="C",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    colophon_data = [
        ("刊行物名", PUBLICATION_NAME_JA),
        ("英題", PUBLICATION_NAME),
        ("巻号", f"第{volume}巻 第{issue_num}号（通巻第{serial}号）"),
        ("発行年月日", f"{year}年（令和{year - 2018}年）{month}月"),
        ("発行者", "佐藤卓也"),
        ("屋号", "TokiStorage（トキストレージ）"),
        ("発行者住所", PUBLISHER_ADDRESS),
        ("URL", PUBLISHER_URL),
        ("連絡先", PUBLISHER_EMAIL),
        ("刊行頻度", "不定期（年複数回の刊行を予定）"),
        ("フォーマット", "PDF（電子書籍等・オンライン資料）"),
        ("根拠法", "国立国会図書館法 第25条・第25条の4"),
        ("採番体系", "式年遷宮型（1巻＝20年） ※1000年発行を想定"),
    ]

    pdf.set_fill_color(*BG_LIGHT)
    for i, (label, value) in enumerate(colophon_data):
        y = pdf.get_y()
        if i % 2 == 0:
            pdf.set_fill_color(*BG_LIGHT)
            pdf.rect(MARGIN, y, CONTENT_W, 8, "F")
        pdf.set_xy(MARGIN + 3, y)
        pdf.set_font("JP", "B", 8)
        pdf.set_text_color(*MUTED)
        pdf.cell(50, 8, label)
        pdf.set_font("JP", "", 9)
        pdf.set_text_color(*DARK)
        pdf.cell(0, 8, value, new_x="LMARGIN", new_y="NEXT")

    pdf._footer_line(f"{PUBLICATION_NAME_JA}　奥付")

    # ═══════════════════════════════════════════════════════════════════
    # PAGE 3+: Content
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.accent_bar()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.set_y(12)

    # ── Section 1: Essays ──
    essays = manifest.get("essays", [])
    if essays:
        pdf.section_heading("エッセイ紹介")
        pdf.body(
            "TokiQRの技術と設計思想に関連するエッセイを厳選してご紹介します。"
        )

        base_url = "https://tokistorage.github.io/lp/"
        pdf.set_auto_page_break(auto=False)

        for essay in essays:
            title = essay.get("title_ja", "")
            excerpt = essay.get("excerpt_ja", "")
            url = f"{base_url}{essay['id']}.html"

            # Measure box height
            pdf.set_font("JP", "", 8.5)
            text_w = CONTENT_W - 10
            chars_per_line = int(text_w / 3)
            n_lines = 0
            for paragraph in excerpt.split("\n"):
                n_lines += max(1, -(-len(paragraph) // chars_per_line))
            text_h = n_lines * 4.5
            box_h = 3 + 7 + text_h + 5

            if pdf.get_y() + box_h > PAGE_H - 18:
                pdf.add_page()
                pdf.accent_bar()

            y = pdf.get_y()
            pdf.set_fill_color(*BG_LIGHT)
            pdf.set_draw_color(*BORDER)
            pdf.rect(MARGIN, y, CONTENT_W, box_h, "DF")
            pdf.set_xy(MARGIN + 5, y + 3)
            pdf.set_font("JP", "B", 9)
            pdf.set_text_color(*TOKI_BLUE)
            pdf.cell(text_w, 7, title, new_x="LMARGIN", new_y="NEXT", link=url)
            pdf.set_x(MARGIN + 5)
            pdf.set_font("JP", "", 8.5)
            pdf.set_text_color(*SECONDARY)
            pdf.multi_cell(text_w, 4.5, excerpt)
            pdf.set_y(y + box_h + 3)

        pdf.set_auto_page_break(auto=True, margin=20)

        pdf.ln(1)
        pdf.set_font("JP", "", 8)
        pdf.set_text_color(*MUTED)
        pdf.set_x(MARGIN)
        pdf.cell(CONTENT_W, 5,
                 f"全エッセイは {PUBLISHER_URL} からお読みいただけます。",
                 new_x="LMARGIN", new_y="NEXT")
        pdf.divider()

    # ── Section 2: Customer Voices (list, grouped by product) ──
    materials = manifest.get("materials", [])
    if materials:
        pdf.section_heading("巻末 TokiQR 掲載者一覧")
        pdf.body(
            "注文時にNDL納本を選択されたお客様のTokiQRを巻末に掲載しています。"
            "QRコードをスマートフォンでスキャンすると肉声を再生できます。"
        )

        # Group by product type
        quartz = [m for m in materials if m.get("product") == "quartz"]
        laminate = [m for m in materials if m.get("product") != "quartz"]

        if quartz:
            pdf.body_bold("◆ クォーツガラス版")
            for m in quartz:
                pdf.body(f"　{m['displayName']}（{m['orderId']}）")

        if laminate:
            pdf.body_bold("◆ ラミネート版")
            for m in laminate:
                pdf.body(f"　{m['displayName']}（{m['orderId']}）")

        pdf.divider()

    # ═══════════════════════════════════════════════════════════════════
    # TokiQR Cover Page (巻末扉) — only if customer materials exist
    # ═══════════════════════════════════════════════════════════════════
    if materials:
        pdf.add_page()
        pdf.accent_bar()
        pdf.set_auto_page_break(auto=False)
        pdf.set_y(30)
        pdf.set_font("JP", "", 9)
        pdf.set_text_color(*TOKI_BLUE)
        pdf.cell(0, 6, "── 巻末セクション ──", align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(6)

        pdf.set_font("JP", "B", 20)
        pdf.set_text_color(*DARK)
        pdf.cell(0, 14, "TokiQR：ご利用者さまの声", align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(8)

        desc_w = 220
        desc_x = (PAGE_W - desc_w) / 2
        pdf.set_font("JP", "", 9.5)
        pdf.set_text_color(*SECONDARY)
        pdf.set_x(desc_x)
        # Build grouped names list
        names_parts = []
        if quartz:
            names_parts.append("【クォーツガラス版】" + "、".join([m["displayName"] for m in quartz]))
        if laminate:
            names_parts.append("【ラミネート版】" + "、".join([m["displayName"] for m in laminate]))
        names_text = "\n".join(names_parts)
        pdf.multi_cell(desc_w, 6, (
            f"{names_text}\n\n"
            "次のページ以降に印刷されたQRコードをスマートフォンでスキャンすると、"
            "ご利用者さまの肉声を再生できます。"
        ), align="C")
        pdf.ln(6)

        box_w = 240
        box_x = (PAGE_W - box_w) / 2
        box_y = pdf.get_y()
        pdf.set_fill_color(*BG_LIGHT)
        pdf.set_draw_color(*BORDER)
        pdf.rect(box_x, box_y, box_w, 30, "DF")
        pdf.set_xy(box_x + 10, box_y + 5)
        pdf.set_font("JP", "B", 9)
        pdf.set_text_color(*DARK)
        pdf.multi_cell(box_w - 20, 6, (
            "サーバーは不要です。データはQRコード内に完全に埋め込まれています。\n"
            "インターネット接続があればスマートフォンだけで再生可能。\n"
            "100年後でも、このQRコードが残っていれば声は蘇ります。"
        ), align="C")

        pdf._footer_line(f"{PUBLICATION_NAME_JA}　巻末 TokiQR")

    # ═══════════════════════════════════════════════════════════════════
    # Back Cover
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.accent_bar()
    pdf.set_auto_page_break(auto=False)

    pdf.set_y(35)
    pdf.set_font("JP", "B", 12)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 8, "国立国会図書館 納本宣言", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    decl_w = 200
    decl_x = (PAGE_W - decl_w) / 2
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.set_x(decl_x)
    pdf.multi_cell(decl_w, 6, (
        "本誌は、国立国会図書館法（第25条の4）に基づき、"
        "オンライン資料として国立国会図書館に納本されます。\n\n"
        "This publication is deposited with the National Diet Library "
        "of Japan under Article 25-4 of the National Diet Library Law."
    ), align="C")

    pdf.ln(12)
    pdf.divider()
    pdf.ln(4)

    pdf.set_font("JP", "B", 10)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 7, "次号予告", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.set_x(decl_x)
    pdf.multi_cell(decl_w, 6, (
        f"第{volume}巻 第{issue_num + 1}号（通巻第{serial + 1}号）の内容は追ってお知らせします。"
    ), align="C")

    pdf.ln(12)
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5, f"© {year} TokiStorage（佐藤卓也）. All rights reserved.", align="C",
             new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 5, PUBLISHER_URL, align="C", new_x="LMARGIN", new_y="NEXT")

    pdf._footer_line(f"{PUBLICATION_NAME_JA}　第{volume}巻 第{issue_num}号　裏表紙")

    # ═══════════════════════════════════════════════════════════════════
    # Output — merge TokiQR PDFs before back cover
    # ═══════════════════════════════════════════════════════════════════
    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, f"{month_str}.pdf")

    # Collect all TokiQR PDFs to merge
    tokiqr_pdfs = []
    for m in materials:
        p = os.path.join(SCRIPT_DIR, m["tokiqrPdf"])
        if os.path.exists(p):
            tokiqr_pdfs.append(p)

    if tokiqr_pdfs:
        from pypdf import PdfReader, PdfWriter

        tmp_path = out_path + ".tmp"
        pdf.output(tmp_path)
        print(f"  Base PDF: {tmp_path}")

        newsletter = PdfReader(tmp_path)
        writer = PdfWriter()

        for i in range(len(newsletter.pages) - 1):
            writer.add_page(newsletter.pages[i])

        for tp in tokiqr_pdfs:
            reader = PdfReader(tp)
            for page in reader.pages:
                writer.add_page(page)
            print(f"  TokiQR merged: {tp}")

        writer.add_page(newsletter.pages[-1])

        with open(out_path, "wb") as f:
            writer.write(f)
        os.remove(tmp_path)
    else:
        pdf.output(out_path)
        print("  (No TokiQR PDFs found — skipped merge)")

    size_kb = os.path.getsize(out_path) / 1024
    print(f"  -> {out_path} ({size_kb:.1f} KB)")
    return out_path


def load_client_config(config_path):
    """Load client-config.json and return parsed dict."""
    import json
    with open(config_path, encoding="utf-8") as f:
        return json.load(f)


def generate_client_issue(config_path, year, month, issue_num, serial):
    """Generate newsletter for a B2B client based on client-config.json.

    The client repo layout is expected to be:
      client-config.json
      schedule.json
      materials/{YYYY-MM}/manifest.json
      materials/{YYYY-MM}/tokiqr/*.pdf
      output/  (generated PDFs go here)

    TokiStorage is the publisher; the client appears as content originator (特集元).
    """
    import json

    config = load_client_config(config_path)
    repo_dir = os.path.dirname(os.path.abspath(config_path))

    volume = (year - config.get("schedule", {}).get("startYear", INAUGURAL_YEAR)) // \
             config.get("schedule", {}).get("volumeDurationYears", VOLUME_SPAN) + 1
    month_str = f"{year}-{month:02d}"

    # Client-specific publication constants
    pub_name_ja = config["branding"]["publicationNameJa"]
    pub_name_en = config["branding"].get("publicationNameEn", pub_name_ja)
    client_name = config["clientName"]
    client_name_en = config.get("clientNameEn", client_name)
    tagline = config["branding"].get("tagline", "")
    accent = tuple(config["branding"].get("accentColor", list(TOKI_BLUE)))

    # Colophon info
    col = config.get("colophon", {})
    publisher = col.get("publisher", PUBLISHER)
    publisher_addr = col.get("publisherAddress", PUBLISHER_ADDRESS)
    content_originator = col.get("contentOriginator", client_name)
    legal_basis = col.get("legalBasis", "国立国会図書館法 第25条・第25条の4")
    colophon_note = col.get("note", "")

    # Load manifest if exists
    manifest_path = os.path.join(repo_dir, "materials", month_str, "manifest.json")
    manifest = {}
    if os.path.exists(manifest_path):
        with open(manifest_path, encoding="utf-8") as f:
            manifest = json.load(f)

    materials = manifest.get("materials", [])

    pdf = NewsletterPDF()
    pdf.set_title(f"{pub_name_en} Vol.{volume} No.{issue_num}")
    pdf.set_author(publisher)
    pdf.set_subject(pub_name_ja)
    pdf.set_creator("generate-newsletter.py (client mode)")

    footer_text = f"{pub_name_ja}　第{volume}巻 第{issue_num}号（通巻第{serial}号）　{year}年{month}月"

    # ═══════════════════════════════════════════════════════════════════
    # PAGE 1: Cover
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    # Use client accent color for bar
    pdf.set_fill_color(*accent)
    pdf.rect(0, 0, PAGE_W, 3.5, "F")
    pdf.set_auto_page_break(auto=False)

    # Icon (use client icon if exists, else TokiStorage icon)
    client_icon = os.path.join(repo_dir, "asset", "client-icon.png")
    icon = client_icon if os.path.exists(client_icon) else ICON_PATH
    if os.path.exists(icon):
        pdf.image(icon, x=(PAGE_W - 50) / 2, y=12, w=50)

    pdf.set_y(68)
    pdf.set_font("JP", "", 10)
    pdf.set_text_color(*accent)
    pdf.cell(0, 6, pub_name_en, align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5, f"第{volume}巻 第{issue_num}号（通巻第{serial}号）", align="C",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    title_ja = manifest.get("issue", {}).get("title_ja", f"第{issue_num}号")
    pdf.set_font("JP", "B", 24)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 18, title_ja, align="C", new_x="LMARGIN", new_y="NEXT")

    if tagline:
        pdf.ln(4)
        pdf.set_font("JP", "", 11)
        pdf.set_text_color(*SECONDARY)
        pdf.cell(0, 7, tagline, align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(12)
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(0, 6, f"{year}年{month}月", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.cell(0, 6, f"Vol.{volume}  No.{issue_num}  Serial #{serial:05d}", align="C",
             new_x="LMARGIN", new_y="NEXT")

    pdf.ln(12)

    # Publisher + Content Originator box
    box_w = 180
    box_x = (PAGE_W - box_w) / 2
    box_y = pdf.get_y()
    pdf.set_draw_color(*BORDER)
    pdf.rect(box_x, box_y, box_w, 42, "D")
    pdf.set_xy(box_x + 5, box_y + 4)
    pdf.set_font("JP", "B", 9)
    pdf.set_text_color(*DARK)
    pdf.cell(box_w - 10, 6, "発行者", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(box_x + 5)
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(box_w - 10, 6, publisher, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(box_x + 5)
    pdf.cell(box_w - 10, 6, publisher_addr, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(box_x + 5)
    pdf.set_font("JP", "B", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(box_w - 10, 6, f"特集元：{content_originator}", align="C",
             new_x="LMARGIN", new_y="NEXT")

    pdf._footer_line(footer_text)

    # ═══════════════════════════════════════════════════════════════════
    # PAGE 2: Colophon (奥付)
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.set_fill_color(*accent)
    pdf.rect(0, 0, PAGE_W, 3.5, "F")
    pdf.set_auto_page_break(auto=False)

    pdf.set_y(15)
    pdf.set_font("JP", "B", 14)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 10, "奥付（Colophon）", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5, "国立国会図書館法に基づく納本に必要な刊行情報", align="C",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    colophon_data = [
        ("刊行物名", pub_name_ja),
        ("英題", pub_name_en),
        ("巻号", f"第{volume}巻 第{issue_num}号（通巻第{serial}号）"),
        ("発行年月日", f"{year}年（令和{year - 2018}年）{month}月"),
        ("発行者", publisher.split("（")[0] if "（" in publisher else publisher),
        ("屋号", "TokiStorage（トキストレージ）"),
        ("特集元", content_originator),
        ("発行者住所", publisher_addr),
        ("URL", PUBLISHER_URL),
        ("連絡先", PUBLISHER_EMAIL),
        ("刊行頻度", "不定期"),
        ("フォーマット", "PDF（電子書籍等・オンライン資料）"),
        ("根拠法", legal_basis),
        ("採番体系", "式年遷宮型（1巻＝20年）"),
    ]

    pdf.set_fill_color(*BG_LIGHT)
    for i, (label, value) in enumerate(colophon_data):
        y = pdf.get_y()
        if i % 2 == 0:
            pdf.set_fill_color(*BG_LIGHT)
            pdf.rect(MARGIN, y, CONTENT_W, 8, "F")
        pdf.set_xy(MARGIN + 3, y)
        pdf.set_font("JP", "B", 8)
        pdf.set_text_color(*MUTED)
        pdf.cell(50, 8, label)
        pdf.set_font("JP", "", 9)
        pdf.set_text_color(*DARK)
        pdf.cell(0, 8, value, new_x="LMARGIN", new_y="NEXT")

    if colophon_note:
        pdf.ln(4)
        pdf.set_font("JP", "", 7.5)
        pdf.set_text_color(*MUTED)
        pdf.set_x(MARGIN)
        pdf.multi_cell(CONTENT_W, 4, colophon_note)

    pdf._footer_line(f"{pub_name_ja}　奥付")

    # ═══════════════════════════════════════════════════════════════════
    # PAGE 3+: Content
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.set_fill_color(*accent)
    pdf.rect(0, 0, PAGE_W, 3.5, "F")
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.set_y(12)

    # Client custom intro sections
    custom_sections = config.get("content", {}).get("customSections", [])
    for section in custom_sections:
        sec_type = section.get("type", "body")
        title_ja = section.get("titleJa", "")
        body_ja = section.get("bodyJa", "")
        if title_ja:
            pdf.section_heading(title_ja)
        if body_ja:
            pdf.body(body_ja)
        pdf.divider()

    # ── Customer Voices (list, grouped by product) ──
    if materials:
        pdf.section_heading("掲載者一覧 ── TokiQR")
        pdf.body(
            "本号に掲載されているTokiQRの一覧です。"
            "QRコードをスマートフォンでスキャンすると肉声を再生できます。"
        )

        quartz = [m for m in materials if m.get("product") == "quartz"]
        laminate = [m for m in materials if m.get("product") != "quartz"]

        if quartz:
            pdf.body_bold("◆ クォーツガラス版")
            for m in quartz:
                pdf.body(f"　{m['displayName']}（{m['orderId']}）")

        if laminate:
            pdf.body_bold("◆ ラミネート版")
            for m in laminate:
                pdf.body(f"　{m['displayName']}（{m['orderId']}）")

        pdf.divider()

    # ═══════════════════════════════════════════════════════════════════
    # TokiQR Cover Page (巻末扉) — only if materials exist
    # ═══════════════════════════════════════════════════════════════════
    if materials:
        pdf.add_page()
        pdf.set_fill_color(*accent)
        pdf.rect(0, 0, PAGE_W, 3.5, "F")
        pdf.set_auto_page_break(auto=False)
        pdf.set_y(30)
        pdf.set_font("JP", "", 9)
        pdf.set_text_color(*accent)
        pdf.cell(0, 6, "── 巻末セクション ──", align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(6)

        pdf.set_font("JP", "B", 20)
        pdf.set_text_color(*DARK)
        pdf.cell(0, 14, "TokiQR：ご利用者さまの声", align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(8)

        desc_w = 220
        desc_x = (PAGE_W - desc_w) / 2
        pdf.set_font("JP", "", 9.5)
        pdf.set_text_color(*SECONDARY)
        pdf.set_x(desc_x)

        names_parts = []
        if quartz:
            names_parts.append("【クォーツガラス版】" + "、".join([m["displayName"] for m in quartz]))
        if laminate:
            names_parts.append("【ラミネート版】" + "、".join([m["displayName"] for m in laminate]))
        names_text = "\n".join(names_parts)
        pdf.multi_cell(desc_w, 6, (
            f"{names_text}\n\n"
            "次のページ以降に印刷されたQRコードをスマートフォンでスキャンすると、"
            "ご利用者さまの肉声を再生できます。"
        ), align="C")
        pdf.ln(6)

        box_w = 240
        box_x = (PAGE_W - box_w) / 2
        box_y = pdf.get_y()
        pdf.set_fill_color(*BG_LIGHT)
        pdf.set_draw_color(*BORDER)
        pdf.rect(box_x, box_y, box_w, 30, "DF")
        pdf.set_xy(box_x + 10, box_y + 5)
        pdf.set_font("JP", "B", 9)
        pdf.set_text_color(*DARK)
        pdf.multi_cell(box_w - 20, 6, (
            "サーバーは不要です。データはQRコード内に完全に埋め込まれています。\n"
            "インターネット接続があればスマートフォンだけで再生可能。\n"
            "100年後でも、このQRコードが残っていれば声は蘇ります。"
        ), align="C")

        pdf._footer_line(f"{pub_name_ja}　巻末 TokiQR")

    # ═══════════════════════════════════════════════════════════════════
    # Back Cover
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.set_fill_color(*accent)
    pdf.rect(0, 0, PAGE_W, 3.5, "F")
    pdf.set_auto_page_break(auto=False)

    pdf.set_y(35)
    pdf.set_font("JP", "B", 12)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 8, "国立国会図書館 納本宣言", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    decl_w = 200
    decl_x = (PAGE_W - decl_w) / 2
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.set_x(decl_x)
    pdf.multi_cell(decl_w, 6, (
        "本誌は、国立国会図書館法（第25条の4）に基づき、"
        "オンライン資料として国立国会図書館に納本されます。\n\n"
        "This publication is deposited with the National Diet Library "
        "of Japan under Article 25-4 of the National Diet Library Law."
    ), align="C")

    pdf.ln(12)
    pdf.divider()
    pdf.ln(4)

    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5, f"© {year} {publisher}. All rights reserved.", align="C",
             new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 5, PUBLISHER_URL, align="C", new_x="LMARGIN", new_y="NEXT")

    pdf._footer_line(f"{pub_name_ja}　第{volume}巻 第{issue_num}号　裏表紙")

    # ═══════════════════════════════════════════════════════════════════
    # Output — merge TokiQR PDFs before back cover
    # ═══════════════════════════════════════════════════════════════════
    out_dir = os.path.join(repo_dir, "output")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{month_str}.pdf")

    # Collect TokiQR PDFs from client repo materials
    tokiqr_pdfs = []
    for m in materials:
        p = os.path.join(repo_dir, m.get("tokiqrPdf", ""))
        if os.path.exists(p):
            tokiqr_pdfs.append(p)

    if tokiqr_pdfs:
        from pypdf import PdfReader, PdfWriter

        tmp_path = out_path + ".tmp"
        pdf.output(tmp_path)
        print(f"  Base PDF: {tmp_path}")

        newsletter = PdfReader(tmp_path)
        writer = PdfWriter()

        for i in range(len(newsletter.pages) - 1):
            writer.add_page(newsletter.pages[i])

        for tp in tokiqr_pdfs:
            reader = PdfReader(tp)
            for page in reader.pages:
                writer.add_page(page)
            print(f"  TokiQR merged: {tp}")

        writer.add_page(newsletter.pages[-1])

        with open(out_path, "wb") as f:
            writer.write(f)
        os.remove(tmp_path)
    else:
        pdf.output(out_path)
        print("  (No TokiQR PDFs found — skipped merge)")

    size_kb = os.path.getsize(out_path) / 1024
    print(f"  -> {out_path} ({size_kb:.1f} KB)")
    return out_path


if __name__ == "__main__":
    print("Generating TokiStorage Newsletter...")

    # Parse --client-config flag
    client_config = None
    args = sys.argv[1:]
    if "--client-config" in args:
        idx = args.index("--client-config")
        client_config = args[idx + 1]
        args = args[:idx] + args[idx + 2:]

    if client_config:
        if len(args) >= 4:
            year, month, issue_num, serial = int(args[0]), int(args[1]), int(args[2]), int(args[3])
        else:
            print("Usage: generate-newsletter.py <year> <month> <issue_num> <serial> --client-config <path>")
            sys.exit(1)
        generate_client_issue(client_config, year, month, issue_num, serial)
    elif len(args) >= 4:
        year, month, issue_num, serial = int(args[0]), int(args[1]), int(args[2]), int(args[3])
        generate_issue(year, month, issue_num, serial)
    else:
        generate_vol1()
    print("Done.")
