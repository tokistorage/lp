#!/usr/bin/env python3
"""
TokiStorage 代表者 履歴書・職務経歴書 PDF生成スクリプト

生成物:
  - sato-takuya-resume.pdf       (履歴書)
  - sato-takuya-career.pdf       (職務経歴書)

フォント: IPA Gothic (ipag.ttf)
ブランド: TokiStorage ヘッダー + toki-blue (#2563EB)
"""

import os
import sys

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
ASSET_DIR = os.path.join(ROOT_DIR, "asset")
PHOTO_PATH = os.path.join(ASSET_DIR, "IMG_4310-2.jpeg")

OUT_RESUME = os.path.join(ROOT_DIR, "sato-takuya-resume.pdf")
OUT_CAREER = os.path.join(ROOT_DIR, "sato-takuya-career.pdf")

# ---------------------------------------------------------------------------
# Fonts
# ---------------------------------------------------------------------------
FONT_PATHS = [
    "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf",
    "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf",
]

FONT_REGISTERED = False
FONT_NAME = "IPAGothic"

for fp in FONT_PATHS:
    if os.path.exists(fp):
        pdfmetrics.registerFont(TTFont(FONT_NAME, fp))
        FONT_REGISTERED = True
        break

if not FONT_REGISTERED:
    print("WARNING: Japanese font not found. Falling back to Helvetica.")
    FONT_NAME = "Helvetica"

# ---------------------------------------------------------------------------
# Brand Colors
# ---------------------------------------------------------------------------
TOKI_BLUE = HexColor("#2563EB")
TOKI_BLUE_DARK = HexColor("#1D4ED8")
TOKI_BLUE_LIGHT = HexColor("#DBEAFE")
TEXT_PRIMARY = HexColor("#1E293B")
TEXT_SECONDARY = HexColor("#475569")
TEXT_MUTED = HexColor("#64748B")
BORDER_COLOR = HexColor("#E2E8F0")
BG_LIGHT = HexColor("#F8FAFC")

# ---------------------------------------------------------------------------
# Page Dimensions
# ---------------------------------------------------------------------------
PAGE_W, PAGE_H = A4  # 210mm x 297mm
MARGIN_LEFT = 15 * mm
MARGIN_RIGHT = 15 * mm
MARGIN_TOP = 12 * mm
MARGIN_BOTTOM = 12 * mm
CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT

# ---------------------------------------------------------------------------
# Styles
# ---------------------------------------------------------------------------
def make_styles():
    """Create paragraph styles used across both PDFs."""
    fn = FONT_NAME

    def s(name, **kw):
        kw.setdefault("fontName", fn)
        kw.setdefault("textColor", TEXT_PRIMARY)
        return ParagraphStyle(name, **kw)

    return dict(
        name=s("Name", fontSize=18, leading=22, spaceAfter=2),
        name_kana=s("NameKana", fontSize=8, leading=10,
                    textColor=TEXT_MUTED, spaceAfter=4),
        title=s("Title", fontSize=9, leading=13, textColor=TOKI_BLUE),
        heading=s("Heading", fontSize=11, leading=14,
                  spaceBefore=8, spaceAfter=4, borderPadding=(0, 0, 2, 0)),
        subheading=s("SubHeading", fontSize=9.5, leading=13,
                     spaceBefore=4, spaceAfter=2),
        body=s("Body", fontSize=8.5, leading=12.5),
        body_small=s("BodySmall", fontSize=7.5, leading=11,
                     textColor=TEXT_SECONDARY),
        bullet=s("Bullet", fontSize=8.5, leading=12.5,
                 leftIndent=10, bulletIndent=0),
        period=s("Period", fontSize=7.5, leading=10, textColor=TEXT_MUTED),
        footer=s("Footer", fontSize=7, leading=9, textColor=TEXT_MUTED,
                 alignment=1),
        mission=s("Mission", fontSize=8.5, leading=13,
                  borderColor=TOKI_BLUE, borderWidth=0,
                  leftIndent=8, borderPadding=(4, 4, 4, 4)),
        table_header=s("TableHeader", fontSize=8, leading=10, textColor=white),
        table_cell=s("TableCell", fontSize=8.5, leading=12),
        table_cell_small=s("TableCellSmall", fontSize=7.5, leading=10.5,
                           textColor=TEXT_SECONDARY),
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def toki_header(canvas, doc):
    """Draw TokiStorage branded header on every page."""
    canvas.saveState()

    # Top bar
    canvas.setFillColor(TOKI_BLUE)
    canvas.rect(0, PAGE_H - 8 * mm, PAGE_W, 8 * mm, fill=1, stroke=0)

    # Brand name
    canvas.setFont(FONT_NAME, 9)
    canvas.setFillColor(white)
    canvas.drawString(MARGIN_LEFT, PAGE_H - 5.5 * mm, "TokiStorage")

    # URL right-aligned
    canvas.setFont(FONT_NAME, 7)
    canvas.drawRightString(PAGE_W - MARGIN_RIGHT, PAGE_H - 5.5 * mm,
                           "tokistorage.github.io/lp/profile.html")

    # Bottom line
    canvas.setStrokeColor(BORDER_COLOR)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_LEFT, MARGIN_BOTTOM - 2 * mm,
                PAGE_W - MARGIN_RIGHT, MARGIN_BOTTOM - 2 * mm)

    # Page number (if more than 1 page)
    page_num = canvas.getPageNumber()
    canvas.setFont(FONT_NAME, 7)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawCentredString(PAGE_W / 2, 6 * mm, f"— {page_num} —")

    canvas.restoreState()


def section_heading(text, styles):
    """Create a styled section heading with blue left border."""
    return [
        HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR,
                    spaceBefore=4, spaceAfter=0),
        Paragraph(f'<font color="{TOKI_BLUE.hexval()}">■</font>  {text}',
                  styles["heading"]),
    ]


def bullet_text(text, styles):
    """Create a bullet point paragraph."""
    return Paragraph(f"・{text}", styles["bullet"])


# ---------------------------------------------------------------------------
# 1. 履歴書 (Resume)
# ---------------------------------------------------------------------------
def build_resume(styles):
    """Build 履歴書 PDF content."""
    story = []

    # --- Header section with photo ---
    if os.path.exists(PHOTO_PATH):
        photo = Image(PHOTO_PATH, width=28 * mm, height=35 * mm)
    else:
        photo = Spacer(28 * mm, 35 * mm)

    header_data = [
        [
            photo,
            [
                Paragraph("佐藤 卓也", styles["name"]),
                Paragraph("さとう たくや / Takuya Sato", styles["name_kana"]),
                Paragraph("TokiStorage 代表 ／ SoulCarrier「共鳴の会」創設者",
                          styles["title"]),
                Spacer(1, 3),
                Paragraph(
                    "「存在を記録し継承する——それは特権ではなく、すべての人の権利です」",
                    styles["mission"]
                ),
            ],
        ]
    ]
    header_table = Table(header_data, colWidths=[32 * mm, CONTENT_W - 34 * mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (0, 0), 0),
        ("LEFTPADDING", (1, 0), (1, 0), 4 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 6 * mm))

    # --- 基本情報 ---
    story.extend(section_heading("基本情報", styles))
    info_data = [
        ["氏名", "佐藤 卓也（さとう たくや）"],
        ["生年月日", "1983年7月19日"],
        ["現住所", "〒279-0014 千葉県浦安市明海2-11-13"],
        ["活動拠点", "千葉県浦安市 ／ 新潟県佐渡市（2026年春〜） ／ ハワイ州マウイ島"],
        ["最終学歴", "国立東京工業高等専門学校 機械工学科 卒業"],
        ["資格", "基本情報技術者"],
        ["語学", "日本語（母語） ／ 英語（ビジネスレベル）"],
    ]
    info_rows = []
    for label, value in info_data:
        info_rows.append([
            Paragraph(label, styles["body_small"]),
            Paragraph(value, styles["body"]),
        ])
    info_table = Table(info_rows, colWidths=[28 * mm, CONTENT_W - 30 * mm])
    info_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (0, -1), 2),
        ("LEFTPADDING", (1, 0), (1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, BORDER_COLOR),
        ("LINEBELOW", (0, -1), (-1, -1), 0.3, BORDER_COLOR),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 2 * mm))

    # --- 職歴 ---
    story.extend(section_heading("職歴", styles))

    career_data = [
        ("1998年10月 〜 2003年3月", "マイクロロジック株式会社", "テクニカルインターン",
         "半導体製造装置のリアルタイムガスフロー可視化機能・ネットワーク制御機能の開発"),
        ("2003年4月 〜 2007年3月", "富士通株式会社", "エンジニア",
         "法務省電子申請システム開発、グローバル物流システム運用管理、新人研修プロジェクトリード"),
        ("2008年 〜 2015年3月", "株式会社ウィルゲート", "取締役 CTO",
         "技術戦略策定、開発チーム構築、プロジェクトマネジメント、事業戦略立案"),
        ("2013年4月 〜 2015年3月", "Willgate Vietnam, Inc.", "CEO（兼務）",
         "ベトナム・ホーチミン拠点の設立・運営、オフショア開発体制の構築"),
        ("2015年7月 〜 2020年3月", "Feel Sync System", "VP Business Development",
         "アジアNo.1 PoC（概念実証）サービスプロバイダー。事業開発、MVP構築"),
        ("2016年4月 〜 2020年3月", "スタートアップ各社", "CTO（複数社兼務）",
         "事業計画策定、MVP開発、価格戦略設計、マーケティングコンサルティング"),
        ("2020年3月 〜 2025年10月", "デロイト トーマツ コンサルティング合同会社",
         "Senior Specialist Lead / Studio Senior Manager / Chief Engineer",
         "金融機関向けDX推進、3層アーキテクチャ設計、APAC地域の戦略的連携構築、"
         "ビジネスインキュベーション、プロダクト開発、AI・IoT・ブロックチェーン等の先端技術指導"),
        ("2025年10月 〜 現在", "ユニバーサルニーズ株式会社（SoulCarrier）", "創設者",
         "存在証明の民主化を掲げ、日系移民の遺骨帰還活動を推進"),
        ("2026年2月 〜 現在", "TokiStorage（個人事業）", "代表",
         "石英ガラス・QRコード技術を活用した千年保存の存在証明サービスの開発・提供"),
    ]

    for period, company, role, desc in career_data:
        row_data = [
            [
                Paragraph(period, styles["period"]),
                Paragraph(f"<b>{company}</b>", styles["body"]),
            ],
            [
                "",
                Paragraph(role, styles["body_small"]),
            ],
            [
                "",
                Paragraph(desc, styles["body_small"]),
            ],
        ]
        row_table = Table(row_data, colWidths=[38 * mm, CONTENT_W - 40 * mm])
        row_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 2),
            ("TOPPADDING", (0, 0), (-1, -1), 1),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ("LINEBELOW", (0, -1), (-1, -1), 0.3, BORDER_COLOR),
        ]))
        story.append(row_table)
        story.append(Spacer(1, 1 * mm))

    story.append(Spacer(1, 2 * mm))

    # --- 受賞・対外活動 ---
    story.extend(section_heading("受賞・対外活動", styles))
    awards = [
        "World Blockchain Summit — Top 10 Project Leaders 受賞",
        "Forbes JAPAN 寄稿者",
        "Phoenix FM（海外メディア）掲載",
        "LinkedIn フォロワー 4,000名以上",
        "伊勢神宮 式年遷宮へ奉納（2026年）",
        "比叡山延暦寺 根本中堂 復元修理事業へ永代記名奉納（2026年）",
    ]
    for a in awards:
        story.append(bullet_text(a, styles))

    story.append(Spacer(1, 2 * mm))

    # --- 社会活動 ---
    story.extend(section_heading("社会活動・地域貢献", styles))
    social = [
        "タイムレスタウン新浦安 自治会長（2年間・約250世帯）",
        "日系アメリカ人の遺骨帰還支援活動（2025年〜）",
        "群馬県にて5,000基の墓石を徒歩調査",
        "マウイ島にて墓守活動（年の半分を現地で活動）",
    ]
    for s in social:
        story.append(bullet_text(s, styles))

    # --- Footer note ---
    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width="100%", thickness=0.3, color=BORDER_COLOR))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(
        "本書は TokiStorage 代表者ページ (tokistorage.github.io/lp/profile.html) "
        "よりダウンロードいただけます。",
        styles["footer"]
    ))

    return story


# ---------------------------------------------------------------------------
# 2. 職務経歴書 (Career History)
# ---------------------------------------------------------------------------
def build_career(styles):
    """Build 職務経歴書 PDF content."""
    story = []

    # Title
    story.append(Paragraph("職 務 経 歴 書", ParagraphStyle(
        "DocTitle", fontName=FONT_NAME, fontSize=16, leading=20,
        alignment=1, textColor=TEXT_PRIMARY, spaceAfter=2 * mm,
    )))
    story.append(Paragraph(
        "佐藤 卓也（さとう たくや）",
        ParagraphStyle("DocName", fontName=FONT_NAME, fontSize=10, leading=13,
                       alignment=1, textColor=TEXT_SECONDARY, spaceAfter=4 * mm)
    ))

    # --- 職務要約 ---
    story.extend(section_heading("職務要約", styles))
    story.append(Paragraph(
        "エンジニアとしてのキャリアを半導体製造装置の開発からスタートし、25年以上にわたり"
        "テクノロジーと事業の交差点で活動。富士通での大規模システム開発、スタートアップCTO"
        "としての事業立ち上げ、デロイト トーマツでのDXコンサルティングを経て、現在は"
        "「存在証明の民主化」をミッションに掲げ、石英ガラス・QRコード技術を活用した"
        "千年保存サービス TokiStorage を運営。技術開発・事業戦略・組織構築・"
        "国際プロジェクト推進を一貫して手がけてきた。",
        styles["body"]
    ))
    story.append(Spacer(1, 3 * mm))

    # --- 技術スキル ---
    story.extend(section_heading("技術スキル・専門領域", styles))
    skills_data = [
        ["領域", "詳細"],
        ["技術戦略・アーキテクチャ",
         "3層アーキテクチャ設計、マイクロサービス、クラウドネイティブ、レガシーモダナイゼーション"],
        ["先端技術",
         "AI/ML、IoT、ブロックチェーン、XR、石英ガラス刻印技術、QRコード技術"],
        ["開発・DevOps",
         "フルスタック開発、DevSecOps、CI/CD、アジャイル/スクラム"],
        ["コンサルティング",
         "DX戦略策定、ビジネスインキュベーション、PoC設計・実行、プロダクトマネジメント"],
        ["マネジメント",
         "組織構築、オフショア開発管理、グローバルチーム運営、ステークホルダーマネジメント"],
        ["言語",
         "日本語（母語）、英語（ビジネスレベル）"],
    ]
    skills_rows = []
    for i, row in enumerate(skills_data):
        if i == 0:
            skills_rows.append([
                Paragraph(row[0], styles["table_header"]),
                Paragraph(row[1], styles["table_header"]),
            ])
        else:
            skills_rows.append([
                Paragraph(row[0], styles["body_small"]),
                Paragraph(row[1], styles["body"]),
            ])
    skills_table = Table(skills_rows, colWidths=[40 * mm, CONTENT_W - 42 * mm])
    skills_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, 0), TOKI_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 1), (-1, -1), white),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, BORDER_COLOR),
        ("LINEBELOW", (0, -1), (-1, -1), 0.5, TOKI_BLUE),
        ("BOX", (0, 0), (-1, -1), 0.5, TOKI_BLUE),
    ]))
    story.append(skills_table)
    story.append(Spacer(1, 3 * mm))

    # --- 職務経歴（詳細）---
    story.extend(section_heading("職務経歴（詳細）", styles))

    careers = [
        {
            "period": "2026年2月 〜 現在",
            "company": "TokiStorage（個人事業）",
            "role": "代表",
            "desc": "石英ガラスとQRコード技術を組み合わせた「千年保存の存在証明サービス」を開発・提供。"
                    "個人・法人・自治体向けに、物理層（石英ガラス）・公的層（神社仏閣奉納）・"
                    "私的層（クラウド）の3層分散保存を実現。",
            "achievements": [
                "サービス設計からLP制作、技術開発、営業まで一人で推進",
                "伊勢神宮・比叡山延暦寺への奉納による公的層の実現",
                "GitHub Pages + 静的サイトによる低コスト運営モデルの構築",
                "200以上の業種別ユースケースページを自動生成",
            ],
        },
        {
            "period": "2025年10月 〜 現在",
            "company": "ユニバーサルニーズ株式会社（SoulCarrier）",
            "role": "創設者",
            "desc": "「存在証明の民主化」をミッションに掲げ、忘れられかけた人々の存在を取り戻す活動を推進。"
                    "日系移民の遺骨帰還支援（Martin Case）を第1号案件として調査・実行中。",
            "achievements": [
                "マウイ島の日系墓地調査から着想し、法人設立",
                "群馬県にて5,000基の墓石を徒歩調査",
                "Forbes JAPAN への寄稿、Phoenix FM 掲載",
            ],
        },
        {
            "period": "2020年3月 〜 2025年10月（5年8ヶ月）",
            "company": "デロイト トーマツ コンサルティング合同会社",
            "role": "Senior Specialist Lead → Studio Senior Manager → Chief Engineer（Deloitte Digital）",
            "desc": "Big4コンサルティングファームにて、金融機関を中心としたDX推進、"
                    "テクノロジーアーキテクチャ設計、新規プロダクト開発を担当。"
                    "APAC地域をまたぐ国際プロジェクトの推進も手がけた。",
            "achievements": [
                "金融機関向け3層アーキテクチャ（Experience-Service-System）を設計・導入",
                "COBOLレガシーシステムからクラウドネイティブへのモダナイゼーション推進",
                "日韓FSIパートナー間のAPAC連携機会を創出",
                "生産性指標30%以上の改善を達成",
                "ビジネスインキュベーション・新規プロダクト開発をリード（50件超）",
                "AI・IoT・ブロックチェーン・XR等の先端技術トレーニングを社内展開",
                "DevSecOps運用モデルの策定・推進",
            ],
        },
        {
            "period": "2016年4月 〜 2020年3月（4年）",
            "company": "スタートアップ各社（複数社兼務）",
            "role": "SPOT CTO / Parallels CTO",
            "desc": "複数のスタートアップにCTOとして参画し、事業の立ち上げからプロダクト開発までを一貫して支援。",
            "achievements": [
                "事業計画策定からMVP開発・PoC実行まで一気通貫で推進",
                "価格戦略設計、マーケティングコンサルティングを提供",
                "技術選定からプロダクトの商用化まで伴走",
            ],
        },
        {
            "period": "2015年7月 〜 2020年3月（4年9ヶ月）",
            "company": "Feel Sync System",
            "role": "VP Business Development",
            "desc": "アジアNo.1のPoC（概念実証）サービスプロバイダーにて事業開発を担当。"
                    "100社以上のDXコンサルティング実績。",
            "achievements": [
                "100社以上のクライアントへDXコンサルティングを提供",
                "MVP構築・PoC実行のフレームワークを確立",
                "アジア太平洋地域でのビジネス展開を推進",
            ],
        },
        {
            "period": "2008年 〜 2015年3月（7年）",
            "company": "株式会社ウィルゲート",
            "role": "取締役 最高技術責任者（CTO）",
            "desc": "SEOテクノロジー企業の共同創業メンバーとしてCTOに就任。"
                    "技術戦略の策定から開発組織の構築、海外拠点の設立までを統括。",
            "achievements": [
                "ゼロからの開発組織構築、エンジニアチームのスケーリング",
                "ベトナム子会社（Willgate Vietnam）を設立しCEOを兼務（2013-2015年）",
                "オフショア開発体制の確立による開発効率の向上",
                "事業戦略立案への技術的観点からの貢献",
            ],
        },
        {
            "period": "2003年4月 〜 2007年3月（4年）",
            "company": "富士通株式会社",
            "role": "エンジニア",
            "desc": "大手メーカーにて、官公庁向けシステム開発およびグローバル物流システムの運用管理を担当。",
            "achievements": [
                "法務省 電子申請システムの設計・開発",
                "グローバル物流システムの運用管理",
                "新人研修プロジェクトのリード",
                "ソフトウェア開発の標準化および開発支援ツールの設計・開発",
            ],
        },
        {
            "period": "1998年10月 〜 2003年3月（4年6ヶ月）",
            "company": "マイクロロジック株式会社",
            "role": "テクニカルインターン",
            "desc": "大学在学中より半導体製造装置の開発に従事。リアルタイム制御システムの開発経験を積む。",
            "achievements": [
                "自動温度制御システムの構築・検証試験",
                "半導体製造装置のリアルタイムガスフロー可視化機能の開発",
                "ネットワーク制御機能の開発",
                "産学連携プロジェクトの支援",
            ],
        },
    ]

    for career in careers:
        items = []
        items.append(Paragraph(career["period"], styles["period"]))
        items.append(Paragraph(
            f'<b>{career["company"]}</b>　{career["role"]}',
            styles["subheading"]
        ))
        items.append(Paragraph(career["desc"], styles["body"]))
        for ach in career["achievements"]:
            items.append(bullet_text(ach, styles))
        items.append(Spacer(1, 3 * mm))
        story.append(KeepTogether(items))

    # --- 受賞・対外活動 ---
    story.extend(section_heading("受賞・対外活動", styles))
    awards = [
        "World Blockchain Summit — Top 10 Project Leaders 受賞",
        "Forbes JAPAN 寄稿者",
        "Phoenix FM（海外メディア）掲載",
        "LinkedIn フォロワー 4,000名以上",
    ]
    for a in awards:
        story.append(bullet_text(a, styles))
    story.append(Spacer(1, 2 * mm))

    # --- 社会活動 ---
    story.extend(section_heading("社会活動・地域貢献", styles))
    social = [
        "タイムレスタウン新浦安 自治会長（2年間・約250世帯）",
        "日系アメリカ人の遺骨帰還支援活動（2025年〜）",
        "群馬県にて5,000基の墓石を徒歩調査",
        "マウイ島にて墓守活動",
        "伊勢神宮 式年遷宮へ奉納（2026年）",
        "比叡山延暦寺 根本中堂 復元修理事業へ永代記名奉納（2026年）",
    ]
    for s in social:
        story.append(bullet_text(s, styles))
    story.append(Spacer(1, 3 * mm))

    # --- 自己PR ---
    story.extend(section_heading("自己PR", styles))
    story.append(Paragraph(
        "25年以上のエンジニアリング経験を通じて、一貫して「技術と事業の境界を越える」ことを"
        "実践してきました。半導体製造装置のリアルタイム制御から、Big4コンサルティングファームでの"
        "DX戦略策定、スタートアップのゼロイチ立ち上げまで、技術の深さと事業の広さの両方を"
        "持ち合わせています。",
        styles["body"]
    ))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(
        "デロイト トーマツでは、金融機関のレガシーシステム刷新から先端技術導入まで、"
        "組織の壁を越えた変革を推進しました。スタートアップでは、限られたリソースの中で"
        "MVP開発から商用化まで一気通貫で手がけ、100社以上へのDXコンサルティング実績を積みました。",
        styles["body"]
    ))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(
        "現在は、これらの経験を「存在証明の民主化」という社会課題に投じています。"
        "石英ガラスとデジタル技術を組み合わせた千年保存サービスの開発は、"
        "テクノロジー・事業設計・社会的意義の交差点にある挑戦です。",
        styles["body"]
    ))

    # --- Footer note ---
    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width="100%", thickness=0.3, color=BORDER_COLOR))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(
        "本書は TokiStorage 代表者ページ (tokistorage.github.io/lp/profile.html) "
        "よりダウンロードいただけます。",
        styles["footer"]
    ))

    return story


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    styles = make_styles()

    # --- Build Resume ---
    print(f"Generating 履歴書 → {OUT_RESUME}")
    doc_resume = SimpleDocTemplate(
        OUT_RESUME,
        pagesize=A4,
        leftMargin=MARGIN_LEFT,
        rightMargin=MARGIN_RIGHT,
        topMargin=MARGIN_TOP + 6 * mm,  # extra space for header bar
        bottomMargin=MARGIN_BOTTOM + 4 * mm,
        title="履歴書 — 佐藤卓也",
        author="TokiStorage",
        subject="履歴書",
    )
    doc_resume.build(build_resume(styles), onFirstPage=toki_header, onLaterPages=toki_header)
    print(f"  ✓ {OUT_RESUME}")

    # --- Build Career History ---
    print(f"Generating 職務経歴書 → {OUT_CAREER}")
    doc_career = SimpleDocTemplate(
        OUT_CAREER,
        pagesize=A4,
        leftMargin=MARGIN_LEFT,
        rightMargin=MARGIN_RIGHT,
        topMargin=MARGIN_TOP + 6 * mm,
        bottomMargin=MARGIN_BOTTOM + 4 * mm,
        title="職務経歴書 — 佐藤卓也",
        author="TokiStorage",
        subject="職務経歴書",
    )
    doc_career.build(build_career(styles), onFirstPage=toki_header, onLaterPages=toki_header)
    print(f"  ✓ {OUT_CAREER}")

    print("\nDone.")


if __name__ == "__main__":
    main()
