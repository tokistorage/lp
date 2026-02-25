#!/usr/bin/env python3
"""Build TokiQR special feature newsletter PDF from materials JSON.

Generates A4 portrait PDFs for NDL deposit:
  - Cover page: series name title + date + volume/number/serial + colophon
  - QR pages: one QR code per URL, centered with URL text below

Usage:
  python3 build-tokiqr-newsletter.py <materials.json> <client-config.json> <output_dir>
"""

import json
import os
import sys
import tempfile
from datetime import datetime

from fpdf import FPDF
import qrcode

# ── Font detection (macOS → Linux fallback) ───────────────────────────
FONT_CANDIDATES = [
    "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
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


# ── Colors (TokiStorage brand) ────────────────────────────────────────
TOKI_BLUE = (37, 99, 235)
DARK = (30, 41, 59)
SECONDARY = (71, 85, 105)
MUTED = (148, 163, 184)
BORDER = (226, 232, 240)
BG_LIGHT = (248, 250, 252)

# ── A4 Portrait (210mm × 297mm) ───────────────────────────────────────
PAGE_W = 210
PAGE_H = 297
MARGIN = 15
CONTENT_W = PAGE_W - MARGIN * 2

QR_BASE_URL = "https://tokistorage.github.io/qr/"


def build_newsletter(materials_path, config_path, output_dir):
    """Main entry: load materials + config, generate PDF."""
    with open(materials_path, encoding="utf-8") as f:
        mat = json.load(f)
    with open(config_path, encoding="utf-8") as f:
        config = json.load(f)

    font_path = find_font(FONT_CANDIDATES)
    font_bold_path = find_font(FONT_BOLD_CANDIDATES)
    if not font_path:
        print("ERROR: No Japanese font found. Install fonts-ipafont-gothic.")
        sys.exit(1)

    serial = mat["serial"]
    volume = mat["volume"]
    number = mat["number"]
    series_name = mat.get("seriesName", "")
    title = mat.get("title", "")
    urls = mat.get("urls", [])
    date_str = mat.get("date", datetime.now().strftime("%Y-%m-%d"))

    branding = config.get("branding", {})
    colophon = config.get("colophon", {})
    accent = tuple(branding.get("accentColor", list(TOKI_BLUE)))
    pub_name_ja = branding.get("publicationNameJa", f"{series_name} ニュースレター")

    serial_str = f"{serial:05d}"
    filename = f"TQ-{serial_str}.pdf"

    # Parse date
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        date_ja = f"{dt.year}年{dt.month}月{dt.day}日"
        date_formal = date_ja
    except ValueError:
        date_ja = date_str
        date_formal = date_str

    # ── Build PDF ──
    pdf = FPDF(orientation="P", format="A4")
    pdf.add_font("JP", "", font_path)
    pdf.add_font("JP", "B", font_bold_path or font_path)
    pdf.set_auto_page_break(auto=False)

    # ── Cover page ──
    pdf.add_page()
    pdf.set_fill_color(*accent)
    pdf.rect(0, 0, PAGE_W, 4, "F")

    # Series name (large title)
    pdf.set_y(50)
    pdf.set_font("JP", "B", 28)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 16, series_name, align="C", new_x="LMARGIN", new_y="NEXT")

    # Subtitle / title
    if title:
        pdf.ln(4)
        pdf.set_font("JP", "", 14)
        pdf.set_text_color(*SECONDARY)
        pdf.cell(0, 10, title, align="C", new_x="LMARGIN", new_y="NEXT")

    # Publication name
    pdf.ln(8)
    pdf.set_font("JP", "", 10)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 6, pub_name_ja, align="C", new_x="LMARGIN", new_y="NEXT")

    # Volume / number / serial
    pdf.ln(4)
    vol_str = f"第{volume}巻 第{number}号（通巻第{serial}号）TQ-{serial_str}"
    pdf.set_font("JP", "", 9)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 6, vol_str, align="C", new_x="LMARGIN", new_y="NEXT")

    # Date
    pdf.ln(2)
    pdf.cell(0, 6, date_formal, align="C", new_x="LMARGIN", new_y="NEXT")

    # Divider
    pdf.ln(8)
    pdf.set_draw_color(*BORDER)
    pdf.line(MARGIN + 30, pdf.get_y(), PAGE_W - MARGIN - 30, pdf.get_y())

    # ── Colophon section on cover ──
    pdf.ln(8)
    colophon_data = [
        ("刊行物名", pub_name_ja),
        ("巻号", f"第{volume}巻 第{number}号（通巻第{serial}号）"),
        ("発行年月日", date_formal),
        ("発行者", colophon.get("publisher", "TokiStorage（佐藤卓也）")),
        ("特集元", colophon.get("contentOriginator", series_name)),
        ("発行者住所", colophon.get("publisherAddress", "")),
        ("刊行頻度", "不定期"),
        ("フォーマット", "PDF（電子書籍等・オンライン資料）"),
        ("根拠法", colophon.get("legalBasis", "国立国会図書館法 第25条・第25条の4")),
        ("採番体系", "式年遷宮型（1巻＝20年）"),
    ]

    for i, (label, value) in enumerate(colophon_data):
        if not value:
            continue
        y = pdf.get_y()
        if i % 2 == 0:
            pdf.set_fill_color(*BG_LIGHT)
            pdf.rect(MARGIN + 10, y, CONTENT_W - 20, 7, "F")
        pdf.set_xy(MARGIN + 13, y)
        pdf.set_font("JP", "B", 7)
        pdf.set_text_color(*MUTED)
        pdf.cell(35, 7, label)
        pdf.set_font("JP", "", 8)
        pdf.set_text_color(*DARK)
        pdf.cell(0, 7, value, new_x="LMARGIN", new_y="NEXT")

    note = colophon.get("note", "")
    if note:
        pdf.ln(3)
        pdf.set_font("JP", "", 6.5)
        pdf.set_text_color(*MUTED)
        pdf.set_x(MARGIN + 10)
        pdf.multi_cell(CONTENT_W - 20, 4, note)

    # Footer
    pdf.set_y(-25)
    pdf.set_font("JP", "", 7)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(0, 4, "あなたが物語になり、世代の対話と重なり、未来が豊かになる",
             align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_draw_color(*BORDER)
    pdf.line(MARGIN, pdf.get_y(), PAGE_W - MARGIN, pdf.get_y())
    pdf.ln(3)
    pdf.set_font("JP", "", 6.5)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 3.5, f"© TokiStorage — tokistorage.github.io/lp/", align="C")

    # ── QR pages ──
    with tempfile.TemporaryDirectory() as tmp_dir:
        for idx, url in enumerate(urls):
            full_url = url if url.startswith("http") else QR_BASE_URL + url

            # Generate QR image
            qr = qrcode.QRCode(
                version=None,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=2,
            )
            qr.add_data(full_url)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            qr_path = os.path.join(tmp_dir, f"qr_{idx}.png")
            img.save(qr_path)

            # Add page
            pdf.add_page()
            pdf.set_fill_color(*accent)
            pdf.rect(0, 0, PAGE_W, 4, "F")

            # Page label
            pdf.set_y(15)
            pdf.set_font("JP", "B", 10)
            pdf.set_text_color(*DARK)
            pdf.cell(0, 8, f"QR {idx + 1} / {len(urls)}", align="C",
                     new_x="LMARGIN", new_y="NEXT")

            # QR image centered (100mm × 100mm)
            qr_size = 100
            qr_x = (PAGE_W - qr_size) / 2
            pdf.image(qr_path, x=qr_x, y=35, w=qr_size, h=qr_size)

            # URL text below QR
            pdf.set_y(140)
            pdf.set_font("JP", "", 5.5)
            pdf.set_text_color(*MUTED)
            pdf.set_x(MARGIN)
            pdf.multi_cell(CONTENT_W, 3.5, full_url, align="C")

            # Scan instruction
            pdf.ln(6)
            pdf.set_font("JP", "", 9)
            pdf.set_text_color(*SECONDARY)
            pdf.cell(0, 6, "スマートフォンでスキャンすると再生できます",
                     align="C", new_x="LMARGIN", new_y="NEXT")

            # Footer
            pdf.set_y(-20)
            pdf.set_draw_color(*BORDER)
            pdf.line(MARGIN, pdf.get_y(), PAGE_W - MARGIN, pdf.get_y())
            pdf.ln(3)
            pdf.set_font("JP", "", 6.5)
            pdf.set_text_color(*MUTED)
            pdf.cell(0, 3.5,
                     f"{pub_name_ja}　TQ-{serial_str}　{idx + 1}/{len(urls)}",
                     align="C")

    # ── Output ──
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, filename)
    pdf.output(output_path)
    print(f"Generated: {output_path}")
    return output_path


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: build-tokiqr-newsletter.py <materials.json> <config.json> <output_dir>")
        sys.exit(1)
    build_newsletter(sys.argv[1], sys.argv[2], sys.argv[3])
