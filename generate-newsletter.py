#!/usr/bin/env python3
"""Generate TokiStorage NDL Newsletter PDFs (国立国会図書館寄贈用ニュースレター).

Numbering scheme (designed for 1000+ years of publication):
  - Volume (巻): Year count from inaugural year (2026 = Vol.1)
  - Number (号): Sequential within year (No.1, No.2, ...)
  - Serial (通巻): Overall sequential number across all years
  - File naming: YYYY-NN (e.g., 2026-01, 2026-02, 2027-01)

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
PUBLICATION_NAME = "TokiStorage Newsletter"
PUBLICATION_NAME_JA = "トキストレージ ニュースレター"
PUBLISHER = "TokiStorage（佐藤卓也）"
PUBLISHER_ADDRESS = "〒279-0014 千葉県浦安市明海2-11-13"
PUBLISHER_URL = "https://tokistorage.github.io/lp/"
PUBLISHER_EMAIL = "tokistorage1000@gmail.com"


# ── PDF Class ──────────────────────────────────────────────────────────
class NewsletterPDF(FPDF):
    """Newsletter PDF with Japanese font support and consistent styling."""

    def __init__(self):
        super().__init__()
        self.add_font("JP", "", FONT_PATH)
        self.add_font("JP", "B", FONT_BOLD_PATH or FONT_PATH)
        self.set_auto_page_break(auto=True, margin=25)

    def _footer_line(self, text):
        self.set_y(-20)
        self.set_draw_color(*BORDER)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(3)
        self.set_font("JP", "", 6.5)
        self.set_text_color(*MUTED)
        self.cell(0, 3.5, text, align="C")

    def accent_bar(self):
        """Top accent bar in TokiStorage blue."""
        self.set_fill_color(*TOKI_BLUE)
        self.rect(0, 0, 210, 3.5, "F")

    def section_heading(self, title):
        self.ln(3)
        self.set_font("JP", "B", 11)
        self.set_text_color(*DARK)
        # Blue left bar
        y = self.get_y()
        self.set_fill_color(*TOKI_BLUE)
        self.rect(15, y, 3, 7, "F")
        self.set_x(22)
        self.cell(0, 7, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def body(self, text):
        self.set_font("JP", "", 9)
        self.set_text_color(*SECONDARY)
        self.set_x(15)
        self.multi_cell(180, 5.5, text)
        self.ln(2)

    def body_bold(self, text):
        self.set_font("JP", "B", 9)
        self.set_text_color(*DARK)
        self.set_x(15)
        self.multi_cell(180, 5.5, text)
        self.ln(1)

    def meta_row(self, label, value, label_w=42):
        self.set_font("JP", "", 8)
        self.set_text_color(*MUTED)
        self.set_x(15)
        self.cell(label_w, 6, label, align="L")
        self.set_font("JP", "", 9)
        self.set_text_color(*DARK)
        self.cell(0, 6, value, new_x="LMARGIN", new_y="NEXT")

    def divider(self):
        self.ln(2)
        self.set_draw_color(*BORDER)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(4)

    def info_box(self, text):
        """Light-background information box."""
        y = self.get_y()
        self.set_fill_color(*BG_LIGHT)
        self.set_draw_color(*BORDER)
        # Measure height first
        self.set_font("JP", "", 8.5)
        # Calculate approximate height
        lines = len(text) / 38 + text.count("\n")
        h = max(lines * 5 + 8, 16)
        self.rect(15, y, 180, h, "DF")
        self.set_xy(20, y + 3)
        self.set_text_color(*SECONDARY)
        self.multi_cell(170, 5, text)
        self.set_y(y + h + 2)


def generate_vol1():
    """Generate Vol.1 No.1 (創刊号) — February 2026."""
    year = 2026
    issue_num = 1
    serial = 1
    volume = year - INAUGURAL_YEAR + 1  # Vol.1

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
        pdf.image(ICON_PATH, x=80, y=12, w=50)

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
    pdf.ln(10)

    # Title
    pdf.set_font("JP", "B", 28)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 18, "創刊号", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.set_font("JP", "", 11)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(0, 7, "── 声を、国家の永久保存記録にする ──", align="C",
             new_x="LMARGIN", new_y="NEXT")

    pdf.ln(25)

    # Date and issue info
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(0, 6, "2026年2月", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.cell(0, 6, f"Vol.{volume}  No.{issue_num}  Serial #{serial:05d}", align="C",
             new_x="LMARGIN", new_y="NEXT")

    pdf.ln(30)

    # Publisher info box
    pdf.set_draw_color(*BORDER)
    box_y = pdf.get_y()
    pdf.rect(40, box_y, 130, 40, "D")
    pdf.set_xy(45, box_y + 5)
    pdf.set_font("JP", "B", 9)
    pdf.set_text_color(*DARK)
    pdf.cell(120, 6, "発行者", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(45)
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(120, 6, PUBLISHER, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(45)
    pdf.cell(120, 6, PUBLISHER_ADDRESS, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(45)
    pdf.cell(120, 6, PUBLISHER_URL, align="C", new_x="LMARGIN", new_y="NEXT")

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

    pdf.ln(4)
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5, "国立国会図書館法に基づく納本に必要な刊行情報", align="C",
             new_x="LMARGIN", new_y="NEXT")

    pdf.ln(8)

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
        ("採番体系", "年-号番号（YYYY-NN） ※1000年発行を想定"),
        ("ISSN", "未申請（今後申請予定）"),
    ]

    pdf.set_fill_color(*BG_LIGHT)
    for i, (label, value) in enumerate(colophon_data):
        y = pdf.get_y()
        fill = i % 2 == 0
        if fill:
            pdf.set_fill_color(*BG_LIGHT)
            pdf.rect(15, y, 180, 8, "F")
        pdf.set_xy(18, y)
        pdf.set_font("JP", "B", 8)
        pdf.set_text_color(*MUTED)
        pdf.cell(45, 8, label)
        pdf.set_font("JP", "", 9)
        pdf.set_text_color(*DARK)
        pdf.cell(0, 8, value, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(8)
    pdf.divider()

    # Numbering system explanation
    pdf.set_font("JP", "B", 9)
    pdf.set_text_color(*DARK)
    pdf.set_x(15)
    pdf.cell(0, 6, "採番体系について", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*SECONDARY)
    pdf.set_x(15)
    numbering_text = (
        "本ニュースレターは、1000年以上の継続発行を想定した採番体系を採用しています。\n"
        "・巻（Volume）＝ 創刊年（2026年）からの年数（2026年＝第1巻、2027年＝第2巻…）\n"
        "・号（Number）＝ 同一年内の連番（第1号、第2号…）\n"
        "・通巻（Serial）＝ 全号を通じた連番（5桁、最大99,999号＝年50回×2,000年相当）\n"
        "・ファイル名＝ YYYY-NN形式（例：2026-01, 3026-12）"
    )
    pdf.multi_cell(180, 5, numbering_text)

    pdf._footer_line(f"{PUBLICATION_NAME_JA}　奥付")

    # ═══════════════════════════════════════════════════════════════════
    # PAGE 3–4: Content (本文)
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.accent_bar()
    pdf.set_auto_page_break(auto=True, margin=25)

    pdf.set_y(15)

    # Section 1: 発刊にあたって
    pdf.section_heading("発刊にあたって")
    pdf.body(
        "このニュースレターは、トキストレージが発行する逐次刊行物です。"
        "国立国会図書館法（第25条・第25条の4）に基づき、電子書籍等として納本されます。"
    )
    pdf.body(
        "「私が存在した」ことを永久に残す——それは、歴史に名を刻める特権階級だけのものでした。"
        "王侯貴族、偉人、有名人。普通の人の存在は、3世代で忘れ去られます。"
        "あなたの曾祖父母の名前を、言えますか？"
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
    pdf.body_bold("ミッション：記憶の不平等に挑む")
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

    # Header
    pdf.set_x(15)
    pdf.set_font("JP", "B", 8)
    pdf.set_text_color(*DARK)
    pdf.set_fill_color(*TOKI_BLUE)
    pdf.set_text_color(*WHITE)
    pdf.cell(30, 7, "  層", fill=True)
    pdf.cell(55, 7, "  媒体", fill=True)
    pdf.cell(95, 7, "  特徴", fill=True)
    pdf.ln()

    for i, (layer, medium, desc) in enumerate(layers):
        fill = i % 2 == 0
        if fill:
            pdf.set_fill_color(*BG_LIGHT)
        pdf.set_x(15)
        pdf.set_font("JP", "B", 8)
        pdf.set_text_color(*DARK)
        pdf.cell(30, 7, "  " + layer, fill=fill)
        pdf.set_font("JP", "", 8)
        pdf.set_text_color(*SECONDARY)
        pdf.cell(55, 7, "  " + medium, fill=fill)
        pdf.cell(95, 7, "  " + desc, fill=fill)
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
        "トキストレージは、国際特許出願中の独自データ圧縮技術により、"
        "データサイズ制約の多いQRコードの仕様内でより多くの声を記録します。"
        "音声をQRコードに変換し、PDFに埋め込み、ニュースレター（本誌）として"
        "国立国会図書館に納本します。"
    )

    # Flow diagram as text
    pdf.ln(1)
    pdf.set_font("JP", "B", 10)
    pdf.set_text_color(*TOKI_BLUE)
    pdf.set_x(15)
    pdf.cell(180, 8, "[声]  ->  [QRコード]  ->  [PDF]  ->  [国会図書館]", align="C",
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

    # Section 5: 今後の予定
    pdf.section_heading("今後の予定")
    pdf.body(
        "次号以降、以下の内容を予定しています：\n\n"
        "・ご利用者さまの声（許諾をいただいたTokiQRコードの掲載）\n"
        "・技術アップデート（圧縮率の改善、新フォーマット対応等）\n"
        "・QRコードサンプル（スマートフォンで読み取り、再生体験が可能）\n"
        "・分散保管の進捗報告（佐渡・マウイの物理保管拠点の状況）\n"
        "・パートナー・協賛者のご紹介"
    )

    pdf.ln(4)

    # ═══════════════════════════════════════════════════════════════════
    # LAST PAGE: Back Cover
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.accent_bar()
    pdf.set_auto_page_break(auto=False)

    pdf.set_y(40)

    # NDL deposit declaration
    pdf.set_font("JP", "B", 12)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 8, "国立国会図書館 納本宣言", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.set_x(30)
    pdf.multi_cell(150, 6, (
        "本誌は、国立国会図書館法（第25条の4）に基づき、"
        "オンライン資料として国立国会図書館に納本されます。\n\n"
        "This publication is deposited with the National Diet Library "
        "of Japan under Article 25-4 of the National Diet Library Law."
    ), align="C")

    pdf.ln(20)
    pdf.divider()

    # Next issue preview
    pdf.ln(4)
    pdf.set_font("JP", "B", 10)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 7, "次号予告", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.set_x(30)
    pdf.multi_cell(150, 6, (
        f"第{volume}巻 第{issue_num + 1}号（通巻第{serial + 1}号）は、"
        "技術デモQRコードの掲載と、佐渡拠点の進捗報告を予定しています。"
    ), align="C")

    pdf.ln(20)

    # Copyright
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5, "© 2026 TokiStorage（佐藤卓也）. All rights reserved.", align="C",
             new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 5, PUBLISHER_URL, align="C", new_x="LMARGIN", new_y="NEXT")

    pdf._footer_line(f"{PUBLICATION_NAME_JA}　第{volume}巻 第{issue_num}号　裏表紙")

    # ═══════════════════════════════════════════════════════════════════
    # Output
    # ═══════════════════════════════════════════════════════════════════
    os.makedirs(OUT_DIR, exist_ok=True)
    filename = f"{year}-{issue_num:02d}.pdf"
    out_path = os.path.join(OUT_DIR, filename)
    pdf.output(out_path)
    print(f"  -> {out_path}")
    return out_path


if __name__ == "__main__":
    print("Generating TokiStorage Newsletter...")
    generate_vol1()
    print("Done.")
