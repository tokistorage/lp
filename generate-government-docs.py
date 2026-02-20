#!/usr/bin/env python3
"""Generate government/municipal proposal template PDFs (事業者概要書, 見積書, 業務仕様書, 企画提案書)."""

from fpdf import FPDF
import os

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
ICON_PATH = os.path.join(OUT_DIR, "asset", "tokistorage-icon-circle.png")

# Font detection: macOS → Linux fallback
_FONT_CANDIDATES = [
    "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
    "/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf",
    "/usr/share/fonts/truetype/ipafont-gothic/ipagp.ttf",
]
FONT_PATH = next((p for p in _FONT_CANDIDATES if os.path.exists(p)),
                  "/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf")

# Colors — toki blue accent instead of emerald
TOKI_BLUE = (37, 99, 235)       # #2563EB
DARK = (30, 41, 59)
SECONDARY = (71, 85, 105)
MUTED = (148, 163, 184)
BORDER = (226, 232, 240)
BG_LIGHT = (248, 250, 252)
WHITE = (255, 255, 255)


class GovPDF(FPDF):
    """Base PDF class with Japanese font support for government docs."""

    def __init__(self):
        super().__init__()
        self.add_font("JP", "", FONT_PATH, uni=True)
        self.add_font("JP", "B", FONT_PATH, uni=True)
        self.set_auto_page_break(auto=False)

    def footer(self):
        self.set_y(-18)
        self.set_draw_color(*BORDER)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(2)
        self.set_font("JP", "", 6.5)
        self.set_text_color(*MUTED)
        self.cell(0, 3.5, "TokiStorage  |  行政提案書類", ln=True, align="C")
        self.cell(
            0, 3.5,
            "本書は見本です。実際の書類は内容確定後に発行いたします。",
            ln=True, align="C",
        )

    def header_block(self, title, subtitle=None):
        """Company header + document title."""
        # Top accent line
        self.set_fill_color(*TOKI_BLUE)
        self.rect(0, 0, 210, 3, "F")

        self.set_y(10)
        # Icon + Company name
        if os.path.exists(ICON_PATH):
            self.image(ICON_PATH, x=15, y=8, w=12)
        self.set_xy(29, 10)
        self.set_font("JP", "B", 9)
        self.set_text_color(*DARK)
        self.cell(0, 5, "TokiStorage（佐藤卓也）", ln=True, align="L")
        self.set_x(29)
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
        self.set_font("JP", "", 8)
        self.set_text_color(*MUTED)
        self.cell(label_w, 7, label, align="L")
        self.set_font("JP", "", 9)
        self.set_text_color(*DARK)
        self.cell(0, 7, value, ln=True, align="L")

    def label_value_multi(self, label, value, label_w=40):
        """Label + multi-line value."""
        y_start = self.get_y()
        self.set_font("JP", "", 8)
        self.set_text_color(*MUTED)
        self.cell(label_w, 6, label, align="L")

        x_val = self.get_x()
        self.set_font("JP", "", 8.5)
        self.set_text_color(*DARK)
        self.set_xy(x_val, y_start)
        self.multi_cell(140, 5.5, value)
        self.ln(1.5)

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


# ---------------------------------------------------------------------------
# Document 1: 事業者概要書 (Business Overview)
# ---------------------------------------------------------------------------

def generate_overview():
    """事業者概要書 template."""
    pdf = GovPDF()
    pdf.add_page()
    pdf.template_stamp()
    pdf.header_block("事業者概要書", "Business Overview")

    # ── Basic information ──
    pdf.label_value("事業者名", "TokiStorage（屋号）/ 佐藤卓也")
    pdf.label_value_multi(
        "所在地",
        "千葉県浦安市明海2-11-13（佐渡島に物理保管拠点を設置予定）",
    )
    pdf.label_value("連絡先", "tokistorage1000@gmail.com")
    pdf.ln(1)

    # ── Divider ──
    pdf.set_draw_color(*BORDER)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(4)

    # ── 事業内容 ──
    pdf.section_title("事業内容")
    pdf.body_text(
        "声・顔・テキストをQRコードに記録するTokiQR（無料）の提供、"
        "UVラミネートQRおよび石英ガラスQRを用いた千年記録サービスの企画・制作・販売。"
    )

    # ── 技術概要 ──
    pdf.section_title("技術概要")
    pdf.body_text(
        "独自音声符号化技術により、QR1枚に最大30秒の音声を記録。"
        "TokiQR（無料）→ UVラミネートQR（¥5,000）→ 石英ガラスQR（¥50,000）の三段階。"
        "石英ガラスは電源・サーバー不要、1,000年以上の耐久性。"
        "スマートフォンカメラで読取可能。国立国会図書館＋GitHubの三層分散保管。"
    )

    # ── 代表者経歴 ──
    pdf.section_title("代表者経歴")
    pdf.body_text(
        "大手コンサルティングファーム経験後、"
        "半導体製造装置エンジニアリング20年超。"
        "タイムレスタウン新浦安自治会長（250世帯）。"
        "SoulCarrier「共鳴の会」主宰。"
        "100以上の思想エッセイ執筆。"
    )

    # ── 主な実績・活動 ──
    pdf.section_title("主な実績・活動")
    pdf.body_text(
        "・TokiQR（無料音声QRサービス）の開発・運営\n"
        "・SoulCarrier遺骨帰還活動\n"
        "・マウイ・山中湖オフグリッド実証\n"
        "・200以上のユースケース設計"
    )

    out = os.path.join(OUT_DIR, "government-template-overview.pdf")
    pdf.output(out)
    print(f"  -> {out}")


# ---------------------------------------------------------------------------
# Document 2: 御見積書 (Estimate)
# ---------------------------------------------------------------------------

def generate_estimate():
    """御見積書 template."""
    pdf = GovPDF()
    pdf.add_page()
    pdf.template_stamp()
    pdf.header_block("御見積書", "Estimate")

    # ── Addressee ──
    pdf.set_font("JP", "B", 11)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 8, "〇〇市 〇〇課 御中", ln=True)
    pdf.ln(2)

    # ── Meta ──
    pdf.label_value("見積番号", "EST-2026-XXXX")
    pdf.label_value("日付", "2026年　　月　　日")
    pdf.ln(4)

    # ── Table header ──
    col_no = 10
    col_item = 68
    col_qty = 16
    col_unit = 14
    col_price = 36
    col_amount = 36

    pdf.set_fill_color(*BG_LIGHT)
    pdf.set_draw_color(*BORDER)
    pdf.set_font("JP", "B", 7.5)
    pdf.set_text_color(*DARK)
    pdf.cell(col_no, 8, "No.", border="TB", fill=True, align="C")
    pdf.cell(col_item, 8, "  品目", border="TB", fill=True)
    pdf.cell(col_qty, 8, "数量", border="TB", fill=True, align="C")
    pdf.cell(col_unit, 8, "単位", border="TB", fill=True, align="C")
    pdf.cell(col_price, 8, "単価", border="TB", fill=True, align="R")
    pdf.cell(col_amount, 8, "金額", border="TB", fill=True, align="R")
    pdf.ln()

    # ── Table rows ──
    rows = [
        ("1", "TokiQR作成支援（ワークショップ運営）", "1", "回", "¥XX,XXX", "¥XX,XXX"),
        ("2", "UVラミネートQRプレート", "XX", "枚", "¥5,000", "¥XXX,XXX"),
        ("3", "石英ガラスQRプレート制作", "XX", "枚", "¥50,000", "¥XXX,XXX"),
        ("4", "コンテンツ設計・キュレーション", "1", "式", "¥XX,XXX", "¥XX,XXX"),
        ("5", "設置工事・取付", "XX", "箇所", "¥XX,XXX", "¥XXX,XXX"),
    ]

    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*SECONDARY)
    for no, item, qty, unit, price, amount in rows:
        pdf.cell(col_no, 8, no, border="B", align="C")
        pdf.cell(col_item, 8, "  " + item, border="B")
        pdf.cell(col_qty, 8, qty, border="B", align="C")
        pdf.cell(col_unit, 8, unit, border="B", align="C")
        pdf.cell(col_price, 8, price, border="B", align="R")
        pdf.cell(col_amount, 8, amount, border="B", align="R")
        pdf.ln()

    # Empty rows for spacing / future items
    for _ in range(2):
        pdf.cell(col_no, 8, "", border="B")
        pdf.cell(col_item, 8, "", border="B")
        pdf.cell(col_qty, 8, "", border="B")
        pdf.cell(col_unit, 8, "", border="B")
        pdf.cell(col_price, 8, "", border="B")
        pdf.cell(col_amount, 8, "", border="B")
        pdf.ln()

    pdf.ln(3)

    # ── Totals ──
    totals_label_w = 120
    totals_name_w = 30
    totals_val_w = 30

    pdf.set_font("JP", "", 8.5)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(totals_label_w, 7, "")
    pdf.cell(totals_name_w, 7, "小計", align="R")
    pdf.set_text_color(*DARK)
    pdf.cell(totals_val_w, 7, "¥ ------", align="R")
    pdf.ln()

    pdf.set_text_color(*SECONDARY)
    pdf.cell(totals_label_w, 7, "")
    pdf.cell(totals_name_w, 7, "消費税（10%）", align="R")
    pdf.set_text_color(*DARK)
    pdf.cell(totals_val_w, 7, "¥ ------", align="R")
    pdf.ln()

    pdf.set_draw_color(*DARK)
    pdf.line(150, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(2)

    pdf.set_font("JP", "B", 10)
    pdf.set_text_color(*DARK)
    pdf.cell(totals_label_w, 8, "")
    pdf.cell(totals_name_w, 8, "合計", align="R")
    pdf.cell(totals_val_w, 8, "¥ ------", align="R")
    pdf.ln(10)

    # ── 備考 ──
    pdf.section_title("備考")
    pdf.body_text(
        "上記は概算です。正式な見積は仕様確定後に提出いたします。"
    )

    pdf.label_value("有効期限", "発行日より30日間")
    pdf.ln(6)

    # ── Issuer ──
    pdf.set_draw_color(*BORDER)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(5)

    pdf.set_font("JP", "B", 9)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 6, "TokiStorage　佐藤卓也", ln=True)
    pdf.set_font("JP", "", 8)
    pdf.set_text_color(*SECONDARY)
    pdf.cell(
        0, 5,
        "千葉県浦安市明海2-11-13（佐渡島に物理保管拠点を設置予定）",
        ln=True,
    )
    pdf.cell(0, 5, "tokistorage1000@gmail.com", ln=True)

    out = os.path.join(OUT_DIR, "government-template-estimate.pdf")
    pdf.output(out)
    print(f"  -> {out}")


# ---------------------------------------------------------------------------
# Document 3: 業務仕様書 (Service Specification)
# ---------------------------------------------------------------------------

def generate_specification():
    """業務仕様書 template."""
    pdf = GovPDF()
    pdf.add_page()
    pdf.template_stamp()
    pdf.header_block("業務仕様書", "Service Specification")

    # ── 業務名称 ──
    pdf.section_title("1. 業務名称")
    pdf.body_text("〇〇市 〇〇事業に係るQR記録プレート制作業務")

    # ── 業務目的 ──
    pdf.section_title("2. 業務目的")
    pdf.body_text(
        "本業務は、〇〇の記録をQRコードプレートに保存することを目的とする。"
        "TokiQR（無料）による市民参加型の音声・顔・テキスト記録から、"
        "UVラミネートQR（屋外設置用）、石英ガラスQR（千年保存用）まで、"
        "段階的な記録保存を実現する。独自音声符号化技術により、"
        "QR1枚に最大30秒の音声を記録可能。"
    )

    # ── 業務内容 ──
    pdf.section_title("3. 業務内容")
    items = [
        ("3-1", "TokiQR体験支援", "市民向けワークショップでの声・顔・テキスト記録体験の実施"),
        ("3-2", "コンテンツ設計", "記録対象の選定・テキスト編集・QRコードリンク先コンテンツの構成"),
        ("3-3", "QRプレート制作", "UVラミネートQRまたは石英ガラスQRの制作"),
        ("3-4", "動作検証", "QRコード読取テスト・リンク先表示確認"),
        ("3-5", "設置・取付", "指定場所への取付工事（屋内 / 屋外）"),
        ("3-6", "納品・報告", "完了報告書の提出"),
    ]
    for num, title, desc in items:
        pdf.set_font("JP", "B", 8.5)
        pdf.set_text_color(*DARK)
        pdf.cell(10, 6, num, align="L")
        pdf.cell(50, 6, title, align="L")
        pdf.set_font("JP", "", 8)
        pdf.set_text_color(*SECONDARY)
        pdf.cell(0, 6, desc, ln=True, align="L")

    pdf.ln(2)

    # ── 成果物 ──
    pdf.section_title("4. 成果物")
    pdf.body_text(
        "・TokiQRワークショップ実施報告\n"
        "・UVラミネートQRプレート ×〇〇枚 および/または 石英ガラスQRプレート ×〇〇枚\n"
        "・QRコードリンク先コンテンツ（三層分散保管: 国立国会図書館＋GitHub＋物理媒体）\n"
        "・完了報告書 1部"
    )

    # ── 履行期間 ──
    pdf.section_title("5. 履行期間")
    pdf.body_text("契約締結日から　　年　　月　　日まで")

    # ── 品質要件 ──
    pdf.section_title("6. 品質・耐久性要件")
    pdf.body_text(
        "・TokiQR: 三層分散保管（国立国会図書館＋GitHub＋物理媒体）\n"
        "・UVラミネートQR: 屋外耐候性を有すること\n"
        "・石英ガラスQR: 理論耐久性 1,000年以上\n"
        "・QRコード読取: 市販スマートフォンカメラで読取可能であること\n"
        "・音声記録: QR1枚あたり最大30秒の音声を格納可能"
    )

    # ── 契約根拠 ──
    pdf.section_title("7. 随意契約の根拠")
    pdf.body_text(
        "石英ガラスへの千年記録は高度に専門的な技術であり、"
        "「その性質又は目的が競争入札に適しないもの」に該当する。\n"
        "・地方自治体: 地方自治法施行令 第167条の2 第1項第2号\n"
        "・国の機関: 予算決算及び会計令 第99条第2号"
    )

    out = os.path.join(OUT_DIR, "government-template-specification.pdf")
    pdf.output(out)
    print(f"  -> {out}")


# ---------------------------------------------------------------------------
# Document 4: 企画提案書 (Project Proposal)
# ---------------------------------------------------------------------------

def generate_proposal():
    """企画提案書 template."""
    pdf = GovPDF()
    pdf.add_page()
    pdf.template_stamp()
    pdf.header_block("企画提案書", "Project Proposal")

    # ── 宛先 ──
    pdf.set_font("JP", "B", 11)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 8, "〇〇市 〇〇課 御中", ln=True)
    pdf.ln(2)

    # ── Meta ──
    pdf.label_value("提案番号", "PROP-2026-XXXX")
    pdf.label_value("日付", "2026年　　月　　日")
    pdf.label_value("提案者", "TokiStorage　佐藤卓也")
    pdf.ln(2)

    pdf.set_draw_color(*BORDER)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(4)

    pdf.set_draw_color(*BORDER)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(4)

    # ── 提案概要 ──
    pdf.section_title("1. 提案概要")
    pdf.body_text(
        "〇〇市の〇〇に関する記録を、TokiQR（無料）から石英ガラス（千年保存）まで"
        "段階的に保存するプロジェクトを提案いたします。"
        "まず無料のTokiQRで市民参加型の体験を提供し、"
        "その後UVラミネートQR・石英ガラスQRで永続的なアーカイブを実現します。"
    )

    # ── Page 2 ──
    pdf.add_page()

    # ── 背景と課題 ──
    pdf.section_title("2. 背景と課題")
    pdf.body_text(
        "・既存のデジタルアーカイブは5〜10年ごとのマイグレーションが必要\n"
        "・予算途絶によりデータが消失するリスクが構造的に存在\n"
        "・紙・フィルム等のアナログ媒体も劣化・散逸のリスクを抱える"
    )

    # ── 提案内容 ──
    pdf.section_title("3. 提案内容")
    pdf.body_text(
        "三段階のQR記録サービスを活用。\n"
        "① TokiQR（無料）: 声・顔・テキストをQRコードに。スマホだけで即体験。\n"
        "② UVラミネートQR（¥5,000）: 屋外設置対応のQRプレート。\n"
        "③ 石英ガラスQR（¥50,000）: 千年保存の永久プレート。\n\n"
        "【想定ユースケース】\n"
        "・TokiQRワークショップ（市民が声を残す体験型イベント）\n"
        "・地域記憶アーカイブ（祭り、方言、伝承）\n"
        "・無縁墓・身元不明遺骨の記録保全\n"
        "・災害伝承碑・教訓の永続的保存\n"
        "・文化財・歴史的建造物の記録"
    )

    # ── 技術的優位性 ──
    pdf.section_title("4. 技術的優位性")

    pdf.set_fill_color(*BG_LIGHT)
    pdf.set_draw_color(*BORDER)
    col_w = [40, 40, 40, 60]
    headers = ["", "従来型デジタル", "TokiQR / UV", "石英ガラスQR"]
    pdf.set_font("JP", "B", 7)
    pdf.set_text_color(*DARK)
    for i, h in enumerate(headers):
        pdf.cell(col_w[i], 7, h, border="TB", fill=True, align="C")
    pdf.ln()

    rows = [
        ("耐久年数", "5〜10年", "デジタル+UV耐候", "1,000年以上"),
        ("維持費", "サーバー費", "ゼロ", "ゼロ"),
        ("初期費用", "高い", "無料〜¥5,000", "¥50,000"),
        ("音声記録", "別途機器", "最大30秒/QR", "最大30秒/QR"),
    ]
    pdf.set_font("JP", "", 7)
    for label, old, mid, new in rows:
        pdf.set_text_color(*DARK)
        pdf.cell(col_w[0], 7, "  " + label, border="B")
        pdf.set_text_color(*SECONDARY)
        pdf.cell(col_w[1], 7, old, border="B", align="C")
        pdf.set_text_color(*DARK)
        pdf.cell(col_w[2], 7, mid, border="B", align="C")
        pdf.set_text_color(*TOKI_BLUE)
        pdf.cell(col_w[3], 7, new, border="B", align="C")
        pdf.ln()

    pdf.ln(3)

    # ── 概算費用 ──
    pdf.section_title("5. 概算費用")
    pdf.body_text("別紙「御見積書」をご参照ください。正式な見積は仕様確定後に提出いたします。")

    # ── スケジュール ──
    pdf.section_title("6. スケジュール（想定）")
    phases = [
        ("Phase 1", "TokiQR体験・ヒアリング", "〇週間"),
        ("Phase 2", "要件定義・コンテンツ設計", "〇週間"),
        ("Phase 3", "QRプレート制作・検証", "〇週間"),
        ("Phase 4", "設置・納品・報告", "〇週間"),
    ]
    for phase, desc, duration in phases:
        pdf.set_font("JP", "B", 8)
        pdf.set_text_color(*TOKI_BLUE)
        pdf.cell(22, 6, phase, align="L")
        pdf.set_font("JP", "", 8)
        pdf.set_text_color(*DARK)
        pdf.cell(80, 6, desc, align="L")
        pdf.set_text_color(*MUTED)
        pdf.cell(0, 6, duration, ln=True, align="L")

    out = os.path.join(OUT_DIR, "government-template-proposal.pdf")
    pdf.output(out)
    print(f"  -> {out}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("Generating government document templates...")
    generate_overview()
    generate_estimate()
    generate_specification()
    generate_proposal()
    print("Done.")
