#!/usr/bin/env python3
"""Generate patronage document template PDFs (協賛契約書, 請求書, 領収書)."""

from fpdf import FPDF
import os

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
FONT_PATH = "/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf"

# Colors
EMERALD = (22, 163, 74)
DARK = (30, 41, 59)
SECONDARY = (71, 85, 105)
MUTED = (148, 163, 184)
BORDER = (226, 232, 240)
BG_LIGHT = (248, 250, 252)
WHITE = (255, 255, 255)


class DocPDF(FPDF):
    """Base PDF class with Japanese font support."""

    def __init__(self):
        super().__init__()
        self.add_font("JP", "", FONT_PATH, uni=True)
        self.add_font("JP", "B", FONT_PATH, uni=True)
        self.set_auto_page_break(auto=False)

    def footer(self):
        """Auto-called footer on every page — keeps everything on 1 page."""
        self.set_y(-18)
        self.set_draw_color(*BORDER)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(2)
        self.set_font("JP", "", 6.5)
        self.set_text_color(*MUTED)
        self.cell(0, 3.5, "TokiStorage  |  Patronage Program", ln=True, align="C")
        self.cell(0, 3.5, "本書は見本です。実際の書類は内容確定後に発行いたします。", ln=True, align="C")

    def header_block(self, title, subtitle=None):
        """Company header + document title."""
        # Top accent line
        self.set_fill_color(*EMERALD)
        self.rect(0, 0, 210, 3, "F")

        self.set_y(12)
        # Company name
        self.set_font("JP", "B", 9)
        self.set_text_color(*DARK)
        self.cell(0, 5, "TokiStorage（佐藤卓也）", ln=True, align="L")
        self.set_font("JP", "", 7)
        self.set_text_color(*SECONDARY)
        self.cell(0, 4, "TokiStorage", ln=True, align="L")

        self.ln(8)

        # Document title
        self.set_font("JP", "B", 18)
        self.set_text_color(*DARK)
        self.cell(0, 12, title, ln=True, align="C")

        if subtitle:
            self.set_font("JP", "", 8)
            self.set_text_color(*MUTED)
            self.cell(0, 6, subtitle, ln=True, align="C")

        self.ln(4)
        # Divider
        self.set_draw_color(*BORDER)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(6)

    def label_value(self, label, value, label_w=40):
        """Label: Value row."""
        y = self.get_y()
        self.set_font("JP", "", 8)
        self.set_text_color(*MUTED)
        self.cell(label_w, 7, label, align="L")
        self.set_font("JP", "", 9)
        self.set_text_color(*DARK)
        self.cell(0, 7, value, ln=True, align="L")

    def placeholder_field(self, label, width=80):
        """Underlined placeholder field."""
        self.set_font("JP", "", 8)
        self.set_text_color(*MUTED)
        self.cell(40, 7, label, align="L")
        y = self.get_y() + 7
        self.set_draw_color(*BORDER)
        self.line(55, y, 55 + width, y)
        self.ln(9)

    def section_title(self, title):
        """Section heading."""
        self.ln(1.5)
        self.set_font("JP", "B", 9.5)
        self.set_text_color(*DARK)
        self.cell(0, 7, title, ln=True)
        self.ln(1)

    def body_text(self, text):
        """Normal body text."""
        self.set_font("JP", "", 8.5)
        self.set_text_color(*SECONDARY)
        self.multi_cell(0, 5, text)
        self.ln(1)

    def template_stamp(self):
        """'TEMPLATE / 見本' watermark-style label."""
        self.set_font("JP", "B", 7)
        self.set_text_color(*MUTED)
        self.set_xy(150, 12)
        self.cell(45, 5, "TEMPLATE / 見本", align="R")


def generate_agreement():
    """協賛契約書 (Sponsorship Agreement) template."""
    pdf = DocPDF()
    pdf.add_page()
    pdf.template_stamp()
    pdf.header_block("協賛契約書", "Sponsorship Agreement")

    # Date & number
    pdf.label_value("契約番号", "PAT-2026-XXXX")
    pdf.label_value("締結日", "2026年　　月　　日")
    pdf.ln(2)

    # Parties
    pdf.section_title("第1条（当事者）")
    pdf.body_text(
        "甲：TokiStorage（佐藤卓也）（以下「甲」）\n"
        "乙：【　　　　　　　　　　　　　　　　　】（以下「乙」）"
    )

    pdf.section_title("第2条（目的）")
    pdf.body_text(
        "本契約は、甲が運営するTokiStorage Patronage Program（以下「本プログラム」）に対する"
        "乙の協賛に関して、必要な事項を定めることを目的とする。"
    )

    pdf.section_title("第3条（協賛内容）")
    pdf.body_text(
        "乙は、甲の社会的ミッション「千年の記憶を社会に届ける」活動に対し、"
        "以下の内容で協賛するものとする。"
    )
    pdf.label_value("協賛形態", "【 月額 / 年額 / 一括 】")
    pdf.label_value("協賛金額", "【　　　　　　　　　】円（税別）")
    pdf.label_value("協賛期間", "【　　年　　月　　日 〜 　　年　　月　　日】")

    pdf.section_title("第4条（甲の義務）")
    pdf.body_text(
        "甲は乙に対し、以下を提供する。\n"
        "・千年アーカイブへの乙の名称および支援の意志の刻印\n"
        "・活動の進展に関する情報の共有\n"
        "・協賛に関する請求書、領収書等の書類の発行"
    )

    pdf.section_title("第5条（変更・解約）")
    pdf.body_text(
        "乙は、書面（メールを含む）による通知をもって、協賛金額の変更、"
        "休止、または本契約の解約を申し出ることができる。"
        "解約に伴う違約金等は発生しない。"
    )

    pdf.section_title("第6条（秘密保持）")
    pdf.body_text(
        "甲および乙は、本契約に関連して知り得た相手方の秘密情報を、"
        "第三者に開示または漏洩しないものとする。"
    )

    pdf.ln(4)

    # Signature blocks
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*DARK)

    y = pdf.get_y()
    # Left column (甲)
    pdf.set_xy(15, y)
    pdf.cell(80, 6, "甲：TokiStorage（佐藤卓也）", ln=True)
    pdf.set_x(15)
    pdf.cell(80, 6, "佐藤 卓也", ln=True)
    pdf.set_x(15)
    pdf.set_draw_color(*BORDER)
    pdf.cell(80, 6, "")
    pdf.ln(2)
    pdf.set_x(15)
    pdf.set_font("JP", "", 7)
    pdf.set_text_color(*MUTED)
    pdf.cell(80, 5, "署名 ____________________________")

    # Right column (乙)
    pdf.set_xy(110, y)
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*DARK)
    pdf.cell(80, 6, "乙：", ln=True)
    pdf.set_x(110)
    pdf.cell(80, 6, "", ln=True)
    pdf.set_x(110)
    pdf.cell(80, 6, "")
    pdf.ln(2)
    pdf.set_x(110)
    pdf.set_font("JP", "", 7)
    pdf.set_text_color(*MUTED)
    pdf.cell(80, 5, "署名 ____________________________")

    out = os.path.join(OUT_DIR, "patronage-template-agreement.pdf")
    pdf.output(out)
    print(f"  -> {out}")


def generate_invoice():
    """請求書 (Invoice) template."""
    pdf = DocPDF()
    pdf.add_page()
    pdf.template_stamp()
    pdf.header_block("請求書", "Invoice")

    # Meta
    pdf.label_value("請求書番号", "INV-2026-XXXX")
    pdf.label_value("発行日", "2026年　　月　　日")
    pdf.label_value("お支払期限", "2026年　　月　　日")
    pdf.ln(4)

    # Addressee
    pdf.set_font("JP", "B", 11)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 8, "【　　　　　　　　　　　　　】 御中", ln=True)
    pdf.ln(4)

    # From
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(0, 5, "下記の通りご請求申し上げます。", ln=True)
    pdf.ln(6)

    # Table header
    pdf.set_fill_color(*BG_LIGHT)
    pdf.set_draw_color(*BORDER)
    pdf.set_font("JP", "B", 8)
    pdf.set_text_color(*DARK)
    pdf.cell(90, 8, "  摘要", border="TB", fill=True)
    pdf.cell(30, 8, "数量", border="TB", fill=True, align="C")
    pdf.cell(30, 8, "単価", border="TB", fill=True, align="R")
    pdf.cell(30, 8, "金額", border="TB", fill=True, align="R")
    pdf.ln()

    # Row 1
    pdf.set_font("JP", "", 8.5)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(90, 8, "  TokiStorage Patronage Program 協賛金", border="B")
    pdf.cell(30, 8, "1", border="B", align="C")
    pdf.cell(30, 8, "¥ ------", border="B", align="R")
    pdf.cell(30, 8, "¥ ------", border="B", align="R")
    pdf.ln()

    # Row 2 (placeholder)
    pdf.set_text_color(*MUTED)
    pdf.cell(90, 8, "  （協賛期間：XXXX年XX月〜XXXX年XX月）", border="B")
    pdf.cell(30, 8, "", border="B")
    pdf.cell(30, 8, "", border="B")
    pdf.cell(30, 8, "", border="B")
    pdf.ln()

    pdf.ln(2)

    # Totals
    pdf.set_font("JP", "", 8.5)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(120, 7, "")
    pdf.cell(30, 7, "小計", align="R")
    pdf.set_text_color(*DARK)
    pdf.cell(30, 7, "¥ ------", align="R")
    pdf.ln()

    pdf.set_text_color(*SECONDARY)
    pdf.cell(120, 7, "")
    pdf.cell(30, 7, "消費税（10%）", align="R")
    pdf.set_text_color(*DARK)
    pdf.cell(30, 7, "¥ ------", align="R")
    pdf.ln()

    pdf.set_draw_color(*DARK)
    pdf.line(150, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(2)

    pdf.set_font("JP", "B", 10)
    pdf.set_text_color(*DARK)
    pdf.cell(120, 8, "")
    pdf.cell(30, 8, "合計", align="R")
    pdf.cell(30, 8, "¥ ------", align="R")
    pdf.ln(12)

    # Bank info
    pdf.section_title("お振込先")
    pdf.set_font("JP", "", 8.5)
    pdf.set_text_color(*SECONDARY)

    pdf.set_fill_color(*BG_LIGHT)
    y0 = pdf.get_y()
    pdf.rect(15, y0, 180, 32, "F")
    pdf.set_xy(20, y0 + 3)
    pdf.cell(0, 5.5, "銀行名：　【　　　　　　　　　】銀行　【　　　　】支店", ln=True)
    pdf.set_x(20)
    pdf.cell(0, 5.5, "口座種別：普通", ln=True)
    pdf.set_x(20)
    pdf.cell(0, 5.5, "口座番号：XXXXXXX", ln=True)
    pdf.set_x(20)
    pdf.cell(0, 5.5, "口座名義：サトウ タクヤ", ln=True)

    pdf.set_y(y0 + 38)

    # Issuer
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 5, "TokiStorage（佐藤卓也）", ln=True)
    pdf.set_font("JP", "", 7)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(0, 5, "佐藤 卓也", ln=True)

    out = os.path.join(OUT_DIR, "patronage-template-invoice.pdf")
    pdf.output(out)
    print(f"  -> {out}")


def generate_receipt():
    """領収書 (Receipt) template."""
    pdf = DocPDF()
    pdf.add_page()
    pdf.template_stamp()
    pdf.header_block("領収書", "Receipt")

    # Meta
    pdf.label_value("領収書番号", "RCP-2026-XXXX")
    pdf.label_value("発行日", "2026年　　月　　日")
    pdf.ln(6)

    # Addressee
    pdf.set_font("JP", "B", 11)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 8, "【　　　　　　　　　　　　　】 様", ln=True)
    pdf.ln(6)

    # Amount box
    pdf.set_draw_color(*EMERALD)
    pdf.set_line_width(0.5)
    y0 = pdf.get_y()
    pdf.rect(15, y0, 180, 22)
    pdf.set_line_width(0.2)

    pdf.set_xy(15, y0 + 3)
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(180, 5, "金額", align="C", ln=True)

    pdf.set_font("JP", "B", 20)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 12, "¥ -------  （税込）", align="C", ln=True)

    pdf.set_y(y0 + 28)
    pdf.ln(4)

    # Details
    pdf.set_font("JP", "", 8.5)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(0, 6, "上記金額を正に領収いたしました。", ln=True)
    pdf.ln(6)

    pdf.label_value("但書", "TokiStorage Patronage Program 協賛金として")
    pdf.label_value("対象期間", "【　　年　　月 〜 　　年　　月】")
    pdf.ln(6)

    # Tax breakdown
    pdf.section_title("消費税区分")

    pdf.set_fill_color(*BG_LIGHT)
    pdf.set_draw_color(*BORDER)
    pdf.set_font("JP", "B", 8)
    pdf.set_text_color(*DARK)
    pdf.cell(60, 7, "  区分", border="TB", fill=True)
    pdf.cell(40, 7, "税抜金額", border="TB", fill=True, align="R")
    pdf.cell(40, 7, "消費税額", border="TB", fill=True, align="R")
    pdf.cell(40, 7, "税込金額", border="TB", fill=True, align="R")
    pdf.ln()

    pdf.set_font("JP", "", 8.5)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(60, 7, "  10%対象", border="B")
    pdf.cell(40, 7, "¥ ------", border="B", align="R")
    pdf.cell(40, 7, "¥ ------", border="B", align="R")
    pdf.cell(40, 7, "¥ ------", border="B", align="R")
    pdf.ln(12)

    # Issuer block
    pdf.set_draw_color(*BORDER)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(6)

    pdf.set_font("JP", "B", 9)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 6, "TokiStorage（佐藤卓也）", ln=True)
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(0, 5, "佐藤 卓也", ln=True)
    pdf.ln(4)

    # Stamp area
    pdf.set_font("JP", "", 7)
    pdf.set_text_color(*MUTED)
    y_stamp = pdf.get_y()
    pdf.set_xy(145, y_stamp)
    pdf.set_draw_color(*BORDER)
    pdf.rect(150, y_stamp, 30, 30)
    pdf.set_xy(150, y_stamp + 12)
    pdf.cell(30, 5, "印", align="C")

    out = os.path.join(OUT_DIR, "patronage-template-receipt.pdf")
    pdf.output(out)
    print(f"  -> {out}")


if __name__ == "__main__":
    print("Generating patronage document templates...")
    generate_agreement()
    generate_invoice()
    generate_receipt()
    print("Done.")
