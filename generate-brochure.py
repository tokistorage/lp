#!/usr/bin/env python3
"""Generate TokiStorage A4 brochure PDFs (JA/EN) for introductions.

Single-page A4 portrait (210mm × 297mm) brochure summarizing TokiStorage
for first-time introductions (ご挨拶回り用).

Usage:
  python3 generate-brochure.py
"""

import os
import sys
import tempfile
from fpdf import FPDF

# ── Paths ──────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(SCRIPT_DIR, "brochure")
ICON_PATH = os.path.join(SCRIPT_DIR, "asset", "tokistorage-icon-circle.png")

# Font detection: macOS → Linux fallback
FONT_CANDIDATES = [
    "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
    "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",
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
TOKI_BLUE_PALE = (239, 246, 255)  # #EFF6FF
DARK = (30, 41, 59)             # #1e293b
SECONDARY = (71, 85, 105)       # #475569
MUTED = (148, 163, 184)         # #94a3b8
BORDER = (226, 232, 240)        # #e2e8f0
BG_LIGHT = (248, 250, 252)      # #f8fafc
WHITE = (255, 255, 255)
GOLD = (201, 169, 98)           # #C9A962

# ── Layout constants (A4 portrait: 210mm × 297mm) ─────────────────────
PAGE_W = 210
PAGE_H = 297
MARGIN = 12
CONTENT_W = PAGE_W - MARGIN * 2   # 186mm

# ── Contact ────────────────────────────────────────────────────────────
SITE_URL = "https://tokistorage.github.io/lp/"
EMAIL = "tokistorage1000@gmail.com"


def generate_qr_image(url):
    """Generate a QR code image for the given URL, return temp file path."""
    import qrcode
    qr = qrcode.QRCode(version=2, error_correction=qrcode.constants.ERROR_CORRECT_M,
                        box_size=10, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    img.save(tmp.name)
    return tmp.name


class BrochurePDF(FPDF):
    """A4 portrait brochure with Japanese font support."""

    def __init__(self):
        super().__init__(orientation="P", format="A4")
        self.add_font("JP", "", FONT_PATH)
        self.add_font("JP", "B", FONT_BOLD_PATH or FONT_PATH)
        self.set_auto_page_break(auto=False)
        self.set_margins(MARGIN, MARGIN)

    def accent_bar(self):
        self.set_fill_color(*TOKI_BLUE)
        self.rect(0, 0, PAGE_W, 3.5, "F")

    def section_title(self, text, y=None):
        if y is not None:
            self.set_y(y)
        y_pos = self.get_y()
        self.set_fill_color(*TOKI_BLUE)
        self.rect(MARGIN, y_pos, 3, 7, "F")
        self.set_xy(MARGIN + 6, y_pos)
        self.set_font("JP", "B", 11)
        self.set_text_color(*DARK)
        self.cell(0, 7, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(3)


def generate_ja(qr_path):
    pdf = BrochurePDF()
    pdf.add_page()
    pdf.accent_bar()

    # ── Header: Icon + Company Name ────────────────────────────────────
    pdf.set_y(10)
    if os.path.exists(ICON_PATH):
        pdf.image(ICON_PATH, x=MARGIN, y=10, w=14)
    pdf.set_xy(MARGIN + 17, 10)
    pdf.set_font("JP", "B", 18)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 9, "TokiStorage", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGIN + 17)
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(0, 5, "トキストレージ", new_x="LMARGIN", new_y="NEXT")

    # ── Tagline ────────────────────────────────────────────────────────
    pdf.ln(6)
    pdf.set_font("JP", "B", 22)
    pdf.set_text_color(*TOKI_BLUE)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 12, "存在証明の民主化", align="C", new_x="LMARGIN", new_y="NEXT")

    # ── Hook ───────────────────────────────────────────────────────────
    pdf.ln(4)
    pdf.set_font("JP", "", 12)
    pdf.set_text_color(*DARK)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 7, "あなたの曾祖父母の顔と声、わかりますか？", align="C",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    pdf.set_font("JP", "", 9.5)
    pdf.set_text_color(*SECONDARY)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 6,
             "歴史に名を残せるのは一握り。普通の人の存在は、3世代で忘れ去られる。",
             align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 6,
             "三層の分散保管で、声と記憶を1000年先に届ける。それがトキストレージです。",
             align="C", new_x="LMARGIN", new_y="NEXT")

    # ── Three-Layer Architecture ───────────────────────────────────────
    pdf.ln(7)
    pdf.section_title("三層分散保管アーキテクチャ")

    col_w = (CONTENT_W - 8) / 3  # 3 columns with 4mm gaps
    y_top = pdf.get_y()
    layers = [
        ("物理層", "石英ガラス・UVラミネート", "記録そのものが手元の実物に\n石英1000年・UV更新可"),
        ("国家層", "国立国会図書館", "国会図書館法による\n永久保存"),
        ("民間層", "GitHub", "無料の公開基盤で永続管理\n維持費は一切不要"),
    ]

    for i, (title, subtitle, desc) in enumerate(layers):
        x = MARGIN + i * (col_w + 4)
        box_h = 40
        # Background
        pdf.set_fill_color(*TOKI_BLUE_PALE)
        pdf.set_draw_color(*BORDER)
        pdf.rect(x, y_top, col_w, box_h, "DF")
        # Title
        pdf.set_xy(x + 2, y_top + 3)
        pdf.set_font("JP", "B", 10)
        pdf.set_text_color(*TOKI_BLUE)
        pdf.cell(col_w - 4, 6, title, align="C", new_x="LMARGIN", new_y="NEXT")
        # Subtitle
        pdf.set_x(x + 2)
        pdf.set_font("JP", "B", 8.5)
        pdf.set_text_color(*DARK)
        pdf.cell(col_w - 4, 6, subtitle, align="C", new_x="LMARGIN", new_y="NEXT")
        # Description
        pdf.set_xy(x + 3, y_top + 18)
        pdf.set_font("JP", "", 8)
        pdf.set_text_color(*SECONDARY)
        pdf.multi_cell(col_w - 6, 5, desc, align="C")

    pdf.set_y(y_top + 46)

    # ── TokiQR Highlight ──────────────────────────────────────────────
    pdf.section_title("TokiQR ── 声を刻むQRコード")

    y_box = pdf.get_y()
    box_h = 50
    pdf.set_fill_color(*BG_LIGHT)
    pdf.set_draw_color(*BORDER)
    pdf.rect(MARGIN, y_box, CONTENT_W, box_h, "DF")

    items = [
        "PCT国際特許手続き中の独自符号化技術",
        "QR1枚に最大30秒の声を記録",
        "サーバー不要・オフライン再生・スマートフォンだけで再生可能",
        "印刷対応・自社サービスへの組み込み自由",
        "セットアップページでQRシール1枚からカスタム展開（スタンプラリー・観光・イベント）",
        "無料で今すぐ体験 → tokistorage.github.io/qr/",
    ]
    pdf.set_xy(MARGIN + 6, y_box + 4)
    pdf.set_font("JP", "", 9.5)
    pdf.set_text_color(*DARK)
    for item in items:
        pdf.set_x(MARGIN + 6)
        pdf.cell(CONTENT_W - 12, 7, f"・{item}", new_x="LMARGIN", new_y="NEXT")

    pdf.set_y(y_box + box_h + 6)

    # ── Service Areas ─────────────────────────────────────────────────
    pdf.section_title("事業領域")

    areas = [
        ("個人向け", "結婚式の誓い、終活メッセージ、家族の記録、成長記録"),
        ("法人向け", "おもてなし音声、ブランドストーリー、社史・創業の想い"),
        ("行政向け", "文化財音声保存、防災メッセージ、地域の語り部記録"),
    ]

    for label, desc in areas:
        pdf.set_x(MARGIN)
        pdf.set_font("JP", "B", 9.5)
        pdf.set_text_color(*TOKI_BLUE)
        pdf.cell(28, 7, label)
        pdf.set_font("JP", "", 9.5)
        pdf.set_text_color(*SECONDARY)
        pdf.cell(CONTENT_W - 28, 7, desc, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)

    # ── Pricing Summary ───────────────────────────────────────────────
    pdf.section_title("料金")

    pdf.set_x(MARGIN)
    pdf.set_font("JP", "", 9.5)
    pdf.set_text_color(*DARK)
    pdf.cell(CONTENT_W, 6,
             "TokiQR（音声QRコード作成）: 無料｜三層保管プラン: ¥5,000〜｜石英ガラス: ¥50,000〜",
             new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGIN)
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(CONTENT_W, 5,
             "詳しい料金プランはWebサイトをご覧ください",
             new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)

    # ── Divider ────────────────────────────────────────────────────────
    pdf.set_draw_color(*BORDER)
    pdf.line(MARGIN, pdf.get_y(), PAGE_W - MARGIN, pdf.get_y())
    pdf.ln(6)

    # ── Contact Footer ────────────────────────────────────────────────
    # QR code on the right
    qr_size = 28
    qr_x = PAGE_W - MARGIN - qr_size
    qr_y = pdf.get_y()
    pdf.image(qr_path, x=qr_x, y=qr_y, w=qr_size)

    # Contact info on the left
    pdf.set_xy(MARGIN, qr_y)
    pdf.set_font("JP", "B", 11)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 7, "TokiStorage ／ トキストレージ", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGIN)
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(0, 6, "代表：佐藤卓也", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGIN)
    pdf.cell(0, 6, "〒279-0014 千葉県浦安市明海2-11-13（佐渡島に物理保管拠点を設置予定）",
             new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGIN)
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*TOKI_BLUE)
    pdf.cell(0, 6, f"Web: {SITE_URL}", link=SITE_URL,
             new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGIN)
    pdf.cell(0, 6, f"Email: {EMAIL}", link=f"mailto:{EMAIL}",
             new_x="LMARGIN", new_y="NEXT")

    # ── Bottom bar ─────────────────────────────────────────────────────
    pdf.set_fill_color(*TOKI_BLUE)
    pdf.rect(0, PAGE_H - 3, PAGE_W, 3, "F")

    # Set metadata
    pdf.set_title("TokiStorage ブローシャ")
    pdf.set_author("TokiStorage（佐藤卓也）")
    pdf.set_subject("存在証明の民主化")
    pdf.set_keywords("TokiStorage トキストレージ 存在証明 音声保存 QRコード")

    out_path = os.path.join(OUT_DIR, "tokistorage-brochure.pdf")
    pdf.output(out_path)
    return out_path


def generate_en(qr_path):
    pdf = BrochurePDF()
    pdf.add_page()
    pdf.accent_bar()

    # ── Header: Icon + Company Name ────────────────────────────────────
    pdf.set_y(10)
    if os.path.exists(ICON_PATH):
        pdf.image(ICON_PATH, x=MARGIN, y=10, w=14)
    pdf.set_xy(MARGIN + 17, 10)
    pdf.set_font("JP", "B", 18)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 9, "TokiStorage", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGIN + 17)
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(0, 5, "Voice Preservation for 1,000 Years", new_x="LMARGIN", new_y="NEXT")

    # ── Tagline ────────────────────────────────────────────────────────
    pdf.ln(6)
    pdf.set_font("JP", "B", 21)
    pdf.set_text_color(*TOKI_BLUE)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 12, "Democratizing Proof of Existence", align="C",
             new_x="LMARGIN", new_y="NEXT")

    # ── Hook ───────────────────────────────────────────────────────────
    pdf.ln(4)
    pdf.set_font("JP", "", 12)
    pdf.set_text_color(*DARK)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 7, "Do you know your great-grandparents' face and voice?", align="C",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    pdf.set_font("JP", "", 9.5)
    pdf.set_text_color(*SECONDARY)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 6,
             "Only a handful make it into history. Ordinary people are forgotten in three generations.",
             align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 6,
             "Three-layer distributed storage carries your voice and memory 1,000 years into the future.",
             align="C", new_x="LMARGIN", new_y="NEXT")

    # ── Three-Layer Architecture ───────────────────────────────────────
    pdf.ln(7)
    pdf.section_title("Three-Layer Distributed Storage")

    col_w = (CONTENT_W - 8) / 3
    y_top = pdf.get_y()
    layers = [
        ("Physical", "Quartz Glass & UV Laminate", "Your record in your hands\nQuartz 1,000 yrs · UV renewable"),
        ("National", "National Diet Library", "Permanent preservation\nunder Japanese law"),
        ("Private", "GitHub", "Free open platform\nZero maintenance cost"),
    ]

    for i, (title, subtitle, desc) in enumerate(layers):
        x = MARGIN + i * (col_w + 4)
        box_h = 40
        pdf.set_fill_color(*TOKI_BLUE_PALE)
        pdf.set_draw_color(*BORDER)
        pdf.rect(x, y_top, col_w, box_h, "DF")
        pdf.set_xy(x + 2, y_top + 3)
        pdf.set_font("JP", "B", 10)
        pdf.set_text_color(*TOKI_BLUE)
        pdf.cell(col_w - 4, 6, title, align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.set_x(x + 2)
        pdf.set_font("JP", "B", 8.5)
        pdf.set_text_color(*DARK)
        pdf.cell(col_w - 4, 6, subtitle, align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.set_xy(x + 3, y_top + 18)
        pdf.set_font("JP", "", 8)
        pdf.set_text_color(*SECONDARY)
        pdf.multi_cell(col_w - 6, 5, desc, align="C")

    pdf.set_y(y_top + 46)

    # ── TokiQR Highlight ──────────────────────────────────────────────
    pdf.section_title("TokiQR \u2014 Voice Encoded in a QR Code")

    y_box = pdf.get_y()
    box_h = 50
    pdf.set_fill_color(*BG_LIGHT)
    pdf.set_draw_color(*BORDER)
    pdf.rect(MARGIN, y_box, CONTENT_W, box_h, "DF")

    items = [
        "Proprietary encoding technology (PCT international patent pending)",
        "Up to 30 seconds of voice in a single QR code",
        "No server required \u2014 plays offline on any smartphone",
        "Print-ready \u00b7 free to integrate into your own service",
        "Setup page: deploy from a single QR sticker (stamp rallies, tourism, events)",
        "Try it free now \u2192 tokistorage.github.io/qr/",
    ]
    pdf.set_xy(MARGIN + 6, y_box + 4)
    pdf.set_font("JP", "", 9.5)
    pdf.set_text_color(*DARK)
    for item in items:
        pdf.set_x(MARGIN + 6)
        pdf.cell(CONTENT_W - 12, 7, f"\u2022 {item}", new_x="LMARGIN", new_y="NEXT")

    pdf.set_y(y_box + box_h + 6)

    # ── Service Areas ─────────────────────────────────────────────────
    pdf.section_title("Service Areas")

    areas = [
        ("Personal", "Wedding vows, legacy messages, family records, growth milestones"),
        ("Business", "Hospitality voice, brand stories, corporate heritage"),
        ("Government", "Cultural asset preservation, disaster messages, oral history"),
    ]

    for label, desc in areas:
        pdf.set_x(MARGIN)
        pdf.set_font("JP", "B", 9.5)
        pdf.set_text_color(*TOKI_BLUE)
        pdf.cell(28, 7, label)
        pdf.set_font("JP", "", 9.5)
        pdf.set_text_color(*SECONDARY)
        pdf.cell(CONTENT_W - 28, 7, desc, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)

    # ── Pricing Summary ───────────────────────────────────────────────
    pdf.section_title("Pricing")

    pdf.set_x(MARGIN)
    pdf.set_font("JP", "", 9.5)
    pdf.set_text_color(*DARK)
    pdf.cell(CONTENT_W, 6,
             "TokiQR (Voice QR creation): Free | Three-Layer Plan: from \u00a55,000 | Quartz Glass: from \u00a550,000",
             new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGIN)
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(CONTENT_W, 5,
             "See our website for detailed pricing plans",
             new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)

    # ── Divider ────────────────────────────────────────────────────────
    pdf.set_draw_color(*BORDER)
    pdf.line(MARGIN, pdf.get_y(), PAGE_W - MARGIN, pdf.get_y())
    pdf.ln(6)

    # ── Contact Footer ────────────────────────────────────────────────
    qr_size = 28
    qr_x = PAGE_W - MARGIN - qr_size
    qr_y = pdf.get_y()
    pdf.image(qr_path, x=qr_x, y=qr_y, w=qr_size)

    pdf.set_xy(MARGIN, qr_y)
    pdf.set_font("JP", "B", 11)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 7, "TokiStorage", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGIN)
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(0, 6, "Takuya Sato, Founder", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGIN)
    pdf.cell(0, 6, "Urayasu, Chiba, Japan (planning to establish a physical storage base on Sado Island)",
             new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGIN)
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*TOKI_BLUE)
    pdf.cell(0, 6, f"Web: {SITE_URL}", link=SITE_URL,
             new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGIN)
    pdf.cell(0, 6, f"Email: {EMAIL}", link=f"mailto:{EMAIL}",
             new_x="LMARGIN", new_y="NEXT")

    # ── Bottom bar ─────────────────────────────────────────────────────
    pdf.set_fill_color(*TOKI_BLUE)
    pdf.rect(0, PAGE_H - 3, PAGE_W, 3, "F")

    # Set metadata
    pdf.set_title("TokiStorage Brochure")
    pdf.set_author("TokiStorage (Takuya Sato)")
    pdf.set_subject("Democratizing Proof of Existence")
    pdf.set_keywords("TokiStorage voice preservation QR code quartz glass")

    out_path = os.path.join(OUT_DIR, "tokistorage-brochure-en.pdf")
    pdf.output(out_path)
    return out_path


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("Generating TokiStorage Brochure...")

    qr_path = generate_qr_image(SITE_URL)
    try:
        ja_path = generate_ja(qr_path)
        print(f"  JA: {ja_path} ({os.path.getsize(ja_path) / 1024:.1f} KB)")

        en_path = generate_en(qr_path)
        print(f"  EN: {en_path} ({os.path.getsize(en_path) / 1024:.1f} KB)")
    finally:
        os.unlink(qr_path)

    print("Done.")


if __name__ == "__main__":
    main()
