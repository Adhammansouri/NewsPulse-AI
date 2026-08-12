#!/usr/bin/env python3
"""Generate Newsplus Scope of Work & Commercial Proposal PDF."""

from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    CondPageBreak,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)

OUTPUT = Path(__file__).resolve().parent.parent / "business" / "Newsplus_Scope_of_Work.pdf"
PROJECT = "Newsplus"
PRICE = "29,000 EGP"
PRICE_AR = "٢٩٬٠٠٠ جنيه مصري"
DURATION = "Approx. 2.5 months + testing"
DOC_DATE = date.today().strftime("%d %B %Y")

# Unified brand palette (cover + interior)
NAVY = colors.HexColor("#0A1624")
NAVY_MID = colors.HexColor("#122536")
NAVY_SOFT = colors.HexColor("#0E1C2C")
TEAL = colors.HexColor("#2BB8A8")
TEAL_DEEP = colors.HexColor("#1A8F9C")
TEAL_SOFT = colors.HexColor("#E8F7F5")
TEAL_MID = colors.HexColor("#7FD4CA")
GOLD = colors.HexColor("#C9A84B")
INK = colors.HexColor("#122033")
MUTED = colors.HexColor("#5C6B7A")
SOFT = colors.HexColor("#8FA6B8")
RULE = colors.HexColor("#D0DCE3")
LINE = colors.HexColor("#1E3A4F")
BG_SOFT = colors.HexColor("#F3F7F8")
WHITE = colors.white
OFF_WHITE = colors.HexColor("#F5F8FB")

# Aliases used across cover + body
ACCENT = TEAL
ACCENT_SOFT = TEAL_SOFT
PRICE_BG = NAVY
COVER_BG = NAVY
COVER_PANEL = NAVY_MID
COVER_TEAL = TEAL
COVER_GOLD = GOLD
COVER_SOFT = SOFT
COVER_LINE = LINE
COVER_WHITE = OFF_WHITE


def make_styles():
    base = getSampleStyleSheet()
    styles = {
        "cover_eyebrow": ParagraphStyle(
            "cover_eyebrow",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            textColor=ACCENT,
            letterSpacing=1.5,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=28,
            textColor=INK,
            alignment=TA_CENTER,
            leading=34,
            spaceAfter=10,
        ),
        "cover_subtitle": ParagraphStyle(
            "cover_subtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=13,
            textColor=MUTED,
            alignment=TA_CENTER,
            leading=18,
            spaceAfter=6,
        ),
        "cover_meta": ParagraphStyle(
            "cover_meta",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=MUTED,
            alignment=TA_CENTER,
            leading=14,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            textColor=NAVY,
            spaceBefore=18,
            spaceAfter=8,
            leading=20,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            textColor=TEAL_DEEP,
            spaceBefore=14,
            spaceAfter=6,
            leading=16,
        ),
        "h3": ParagraphStyle(
            "h3",
            parent=base["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            textColor=NAVY,
            spaceBefore=10,
            spaceAfter=4,
            leading=14,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=INK,
            leading=15,
            alignment=TA_JUSTIFY,
            spaceAfter=8,
        ),
        "body_left": ParagraphStyle(
            "body_left",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=INK,
            leading=15,
            alignment=TA_LEFT,
            spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=INK,
            leading=14,
            leftIndent=0,
            spaceAfter=3,
        ),
        "toc_item": ParagraphStyle(
            "toc_item",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10.5,
            textColor=INK,
            leading=18,
            spaceAfter=2,
        ),
        "table_cell": ParagraphStyle(
            "table_cell",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            textColor=INK,
            leading=13,
        ),
        "table_header": ParagraphStyle(
            "table_header",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9.5,
            textColor=OFF_WHITE,
            leading=13,
        ),
        "price_label": ParagraphStyle(
            "price_label",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            textColor=TEAL_MID,
            alignment=TA_CENTER,
            spaceAfter=4,
        ),
        "price_value": ParagraphStyle(
            "price_value",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=22,
            textColor=OFF_WHITE,
            alignment=TA_CENTER,
            leading=26,
            spaceAfter=2,
        ),
        "price_note": ParagraphStyle(
            "price_note",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            textColor=SOFT,
            alignment=TA_CENTER,
            leading=12,
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            textColor=MUTED,
            leading=12,
            spaceAfter=4,
        ),
        "callout": ParagraphStyle(
            "callout",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=INK,
            leading=14,
            alignment=TA_LEFT,
        ),
        "end_meta": ParagraphStyle(
            "end_meta",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=TEAL_DEEP,
            alignment=TA_CENTER,
            leading=14,
        ),
    }
    return styles


def bullets(items, styles):
    flow = []
    for item in items:
        flow.append(
            Paragraph(f'<font color="#2BB8A8">•</font>  {item}', styles["bullet"])
        )
    flow.append(Spacer(1, 4))
    return flow


def section_rule():
    return HRFlowable(
        width="100%", thickness=1.2, color=TEAL, spaceBefore=0, spaceAfter=10
    )


def price_box(styles):
    data = [
        [
            Paragraph("PROJECT INVESTMENT", styles["price_label"]),
        ],
        [Paragraph(PRICE, styles["price_value"])],
        [
            Paragraph(
                f"Fixed project fee &nbsp;&nbsp;|&nbsp;&nbsp; {DURATION}",
                styles["price_note"],
            )
        ],
    ]
    t = Table(data, colWidths=[16 * cm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("TOPPADDING", (0, 0), (-1, 0), 14),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 14),
                ("TOPPADDING", (0, 1), (-1, 1), 2),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 16),
                ("RIGHTPADDING", (0, 0), (-1, -1), 16),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BOX", (0, 0), (-1, -1), 0, NAVY),
                ("LINEABOVE", (0, 0), (-1, 0), 2.5, TEAL),
                ("LINEBELOW", (0, -1), (-1, -1), 1.5, GOLD),
            ]
        )
    )
    return t


def info_table(rows, styles, col_widths=None):
    data = []
    for label, value in rows:
        data.append(
            [
                Paragraph(f"<b>{label}</b>", styles["table_cell"]),
                Paragraph(value, styles["table_cell"]),
            ]
        )
    widths = col_widths or [4.5 * cm, 11.5 * cm]
    t = Table(data, colWidths=widths)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), TEAL_SOFT),
                ("BACKGROUND", (1, 0), (1, -1), WHITE),
                ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
                ("BOX", (0, 0), (-1, -1), 0.8, TEAL),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, RULE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return t


def phase_table(styles):
    header = [
        Paragraph("Phase", styles["table_header"]),
        Paragraph("Focus", styles["table_header"]),
        Paragraph("Duration", styles["table_header"]),
    ]
    rows = [
        [
            "Phase 1",
            "Discovery, Planning & Architecture",
            "2 weeks",
        ],
        [
            "Phase 2",
            "Core Development (AI, news, translation, platform)",
            "4 weeks",
        ],
        [
            "Phase 3",
            "Refinement, Integration & Delivery",
            "2.5 weeks",
        ],
        [
            "Testing",
            "Validation, style review & final fixes",
            "1–2 weeks",
        ],
    ]
    data = [header]
    for r in rows:
        data.append([Paragraph(c, styles["table_cell"]) for c in r])
    t = Table(data, colWidths=[2.8 * cm, 9.2 * cm, 4 * cm])
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("BOX", (0, 0), (-1, -1), 0.8, TEAL),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, RULE),
        ("LINEBELOW", (0, 0), (-1, 0), 2, TEAL),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]
    for i in range(1, len(data)):
        bg = WHITE if i % 2 else TEAL_SOFT
        style_cmds.append(("BACKGROUND", (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t


def add_page_decorations(canvas, doc):
    canvas.saveState()
    page_w, page_h = A4

    # Left teal accent bar (same as cover)
    canvas.setFillColor(TEAL)
    canvas.rect(0, 0, 0.35 * cm, page_h, fill=1, stroke=0)

    # Top navy band
    canvas.setFillColor(NAVY)
    canvas.rect(0, page_h - 1.55 * cm, page_w, 1.55 * cm, fill=1, stroke=0)
    canvas.setFillColor(TEAL)
    canvas.rect(0, page_h - 1.55 * cm, page_w, 0.12 * cm, fill=1, stroke=0)
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(1)
    canvas.line(2 * cm, page_h - 1.45 * cm, 4.2 * cm, page_h - 1.45 * cm)

    # Header text
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(TEAL_MID)
    canvas.drawString(2 * cm, page_h - 1.0 * cm, f"{PROJECT}")
    canvas.setFillColor(OFF_WHITE)
    canvas.setFont("Helvetica", 8)
    canvas.drawCentredString(page_w / 2, page_h - 1.0 * cm, "Scope of Work & Proposal")
    canvas.setFillColor(SOFT)
    canvas.drawRightString(page_w - 2 * cm, page_h - 1.0 * cm, "Confidential")

    # Footer navy strip
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, page_w, 1.35 * cm, fill=1, stroke=0)
    canvas.setFillColor(TEAL)
    canvas.rect(0, 1.35 * cm, page_w, 0.08 * cm, fill=1, stroke=0)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(SOFT)
    canvas.drawString(2 * cm, 0.55 * cm, DOC_DATE)
    canvas.setFillColor(OFF_WHITE)
    canvas.drawCentredString(page_w / 2, 0.55 * cm, f"Page {doc.page}")
    canvas.setFillColor(TEAL_MID)
    canvas.drawRightString(page_w - 2 * cm, 0.55 * cm, PROJECT)
    canvas.restoreState()


def draw_cover_mark(canvas, cx, cy):
    """Project mark: news card + AI nodes + signal pulse (top-right cover art)."""
    canvas.saveState()

    # Soft radar rings — monitoring reach
    for i, r in enumerate([2.85 * cm, 2.25 * cm, 1.65 * cm]):
        canvas.setStrokeColor(colors.Color(0.17, 0.72, 0.66, alpha=0.12 + i * 0.05))
        canvas.setLineWidth(1.0)
        canvas.circle(cx, cy + 0.15 * cm, r, fill=0, stroke=1)

    # Outer faint ring broken into arcs (signal sweep)
    canvas.setStrokeColor(colors.Color(0.79, 0.66, 0.29, alpha=0.45))
    canvas.setLineWidth(1.4)
    canvas.circle(cx, cy + 0.15 * cm, 3.05 * cm, fill=0, stroke=1)

    # News document card (center)
    card_w, card_h = 2.35 * cm, 2.95 * cm
    left = cx - card_w / 2
    bottom = cy - card_h / 2 + 0.15 * cm
    canvas.setFillColor(NAVY)
    canvas.setStrokeColor(TEAL)
    canvas.setLineWidth(1.3)
    canvas.roundRect(left, bottom, card_w, card_h, 4, fill=1, stroke=1)

    # Card header bar
    canvas.setFillColor(TEAL)
    canvas.roundRect(left, bottom + card_h - 0.55 * cm, card_w, 0.55 * cm, 4, fill=1, stroke=0)
    canvas.rect(left, bottom + card_h - 0.55 * cm, card_w, 0.22 * cm, fill=1, stroke=0)
    canvas.setFillColor(NAVY)
    canvas.setFont("Helvetica-Bold", 5.5)
    canvas.drawCentredString(cx, bottom + card_h - 0.38 * cm, "NEWS")

    # Article text lines
    canvas.setStrokeColor(SOFT)
    canvas.setLineWidth(1.5)
    line_y = bottom + card_h - 0.95 * cm
    widths = [0.72, 0.88, 0.55, 0.80, 0.64, 0.76]
    for i, frac in enumerate(widths):
        x0 = left + 0.28 * cm
        x1 = left + 0.28 * cm + (card_w - 0.56 * cm) * frac
        if i == 0:
            canvas.setStrokeColor(OFF_WHITE)
            canvas.setLineWidth(2.0)
        elif i == 3:
            canvas.setStrokeColor(GOLD)
            canvas.setLineWidth(1.4)
        else:
            canvas.setStrokeColor(SOFT)
            canvas.setLineWidth(1.3)
        canvas.line(x0, line_y, x1, line_y)
        line_y -= 0.32 * cm

    # Mini pulse wave inside card footer
    wave_y = bottom + 0.42 * cm
    canvas.setStrokeColor(TEAL)
    canvas.setLineWidth(1.4)
    p = canvas.beginPath()
    wx0 = left + 0.28 * cm
    wx1 = left + card_w - 0.28 * cm
    mid = (wx0 + wx1) / 2
    p.moveTo(wx0, wave_y)
    p.lineTo(mid - 0.35 * cm, wave_y)
    p.lineTo(mid - 0.18 * cm, wave_y + 0.28 * cm)
    p.lineTo(mid, wave_y - 0.32 * cm)
    p.lineTo(mid + 0.18 * cm, wave_y + 0.22 * cm)
    p.lineTo(mid + 0.35 * cm, wave_y)
    p.lineTo(wx1, wave_y)
    canvas.drawPath(p, fill=0, stroke=1)

    # AI neural nodes around the card
    nodes = [
        (cx - 2.05 * cm, cy + 1.55 * cm, True),   # left-top teal
        (cx + 2.1 * cm, cy + 1.35 * cm, False),  # right-top
        (cx - 2.25 * cm, cy - 0.35 * cm, False), # left
        (cx + 2.3 * cm, cy - 0.15 * cm, True),   # right
        (cx - 1.55 * cm, cy - 1.75 * cm, False), # left-bottom
        (cx + 1.65 * cm, cy - 1.85 * cm, True),  # right-bottom goldish
    ]

    # Connection lines from nodes to card center
    canvas.setLineWidth(0.9)
    for nx, ny, _ in nodes:
        canvas.setStrokeColor(colors.Color(0.17, 0.72, 0.66, alpha=0.45))
        canvas.line(nx, ny, cx, cy + 0.15 * cm)

    # Cross-links between nearby nodes (network feel)
    links = [(0, 2), (1, 3), (2, 4), (3, 5), (0, 1)]
    canvas.setStrokeColor(colors.Color(0.79, 0.66, 0.29, alpha=0.28))
    canvas.setLineWidth(0.7)
    for a, b in links:
        canvas.line(nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1])

    for i, (nx, ny, primary) in enumerate(nodes):
        # outer glow ring
        canvas.setStrokeColor(colors.Color(0.17, 0.72, 0.66, alpha=0.35))
        canvas.setLineWidth(0.8)
        canvas.circle(nx, ny, 0.28 * cm, fill=0, stroke=1)
        if i == 5:
            canvas.setFillColor(GOLD)
        elif primary:
            canvas.setFillColor(TEAL)
        else:
            canvas.setFillColor(TEAL_MID)
        canvas.circle(nx, ny, 0.16 * cm, fill=1, stroke=0)

    # Center accent dot on card (AI core)
    canvas.setFillColor(TEAL)
    canvas.circle(cx, cy + 0.55 * cm, 0.12 * cm, fill=1, stroke=0)

    # Tiny broadcast bars above card (live news signal)
    canvas.setFillColor(TEAL)
    bar_x = cx - 0.55 * cm
    bar_base = bottom + card_h + 0.25 * cm
    for i, h in enumerate([0.35 * cm, 0.55 * cm, 0.42 * cm, 0.68 * cm]):
        canvas.roundRect(bar_x + i * 0.32 * cm, bar_base, 0.18 * cm, h, 1, fill=1, stroke=0)

    canvas.restoreState()


def add_cover_decorations(canvas, doc):
    """Full-bleed professional cover — drawn entirely on canvas."""
    canvas.saveState()
    page_w, page_h = A4

    # Background
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, page_w, page_h, fill=1, stroke=0)

    # Soft vertical depth panel on the right
    canvas.setFillColor(NAVY_SOFT)
    canvas.rect(page_w * 0.58, 0, page_w * 0.42, page_h, fill=1, stroke=0)

    # Left teal accent bar
    canvas.setFillColor(TEAL)
    canvas.rect(0, 0, 0.7 * cm, page_h, fill=1, stroke=0)

    # Top gold hairline
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(1.2)
    canvas.line(2.2 * cm, page_h - 1.6 * cm, page_w - 2.2 * cm, page_h - 1.6 * cm)

    # Project mark (news + AI network + pulse)
    draw_cover_mark(canvas, page_w - 4.0 * cm, page_h - 5.3 * cm)

    # Eyebrow
    canvas.setFillColor(TEAL)
    canvas.setFont("Helvetica", 9)
    canvas.drawString(2.4 * cm, page_h - 3.0 * cm, "SCOPE OF WORK  ·  COMMERCIAL PROPOSAL")

    # Brand mark
    canvas.setFillColor(OFF_WHITE)
    canvas.setFont("Helvetica-Bold", 36)
    canvas.drawString(2.4 * cm, page_h - 5.0 * cm, "Newsplus")
    canvas.setFillColor(TEAL)
    canvas.setFont("Helvetica-Bold", 36)
    np_w = canvas.stringWidth("Newsplus", "Helvetica-Bold", 36)
    canvas.drawString(2.4 * cm + np_w + 0.35 * cm, page_h - 5.0 * cm, "AI")

    # Gold underline under brand
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(2)
    canvas.line(2.4 * cm, page_h - 5.45 * cm, 2.4 * cm + 4.2 * cm, page_h - 5.45 * cm)

    # Subtitle
    canvas.setFillColor(SOFT)
    canvas.setFont("Helvetica", 11.5)
    y = page_h - 6.5 * cm
    canvas.drawString(2.4 * cm, y, "AI-Powered Content Assistant for News Monitoring,")
    canvas.drawString(2.4 * cm, y - 0.55 * cm, "Summarisation, Translation & Report Writing")

    # Feature chips row
    chips = ["News", "Summaries", "Reports", "Translation", "Style Training"]
    chip_x = 2.4 * cm
    chip_y = page_h - 8.5 * cm
    canvas.setFont("Helvetica", 8)
    for chip in chips:
        tw = canvas.stringWidth(chip, "Helvetica", 8)
        pad_x, pad_y = 0.35 * cm, 0.22 * cm
        w, h = tw + pad_x * 2, 0.7 * cm
        canvas.setFillColor(NAVY_MID)
        canvas.roundRect(chip_x, chip_y, w, h, 3, fill=1, stroke=0)
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.6)
        canvas.roundRect(chip_x, chip_y, w, h, 3, fill=0, stroke=1)
        canvas.setFillColor(TEAL)
        canvas.drawString(chip_x + pad_x, chip_y + pad_y + 0.05 * cm, chip)
        chip_x += w + 0.28 * cm

    # Bottom info panel
    panel_top = 7.8 * cm
    canvas.setFillColor(NAVY_MID)
    canvas.rect(0, 0, page_w, panel_top, fill=1, stroke=0)
    canvas.setFillColor(TEAL)
    canvas.rect(0, panel_top - 0.1 * cm, page_w, 0.1 * cm, fill=1, stroke=0)

    rows = [
        ("Document Type", "Scope of Work / Proposal"),
        ("Prepared for", "Client Review & Approval"),
        ("Platform", "Telegram or Web — client’s choice"),
        ("AI Delivery", "OpenAI API + custom dataset & training"),
        ("Timeline", DURATION),
        ("Date", DOC_DATE),
    ]
    y = panel_top - 1.15 * cm
    for label, value in rows:
        canvas.setFillColor(TEAL)
        canvas.setFont("Helvetica", 8)
        canvas.drawString(2.4 * cm, y, label.upper())
        canvas.setFillColor(OFF_WHITE)
        canvas.setFont("Helvetica", 10)
        canvas.drawString(7.2 * cm, y - 0.02 * cm, value)
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.4)
        canvas.line(2.4 * cm, y - 0.35 * cm, page_w - 2.4 * cm, y - 0.35 * cm)
        y -= 0.95 * cm

    canvas.setFillColor(SOFT)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(2.4 * cm, 1.0 * cm, "Confidential — For client review")
    canvas.drawRightString(page_w - 2.4 * cm, 1.0 * cm, PROJECT)

    canvas.restoreState()


def build():
    styles = make_styles()
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2.4 * cm,
        bottomMargin=2.2 * cm,
        title=f"{PROJECT} — Scope of Work & Commercial Proposal",
        author="Newsplus Delivery Team",
        subject="AI Content Assistant — Scope, Timeline & Investment",
    )

    story = []

    # ——— COVER (visual drawn on canvas; blank flowable page) ———
    story.append(PageBreak())

    # ——— TOC ———
    story.append(Paragraph("1. Table of Contents", styles["h1"]))
    story.append(section_rule())
    toc = [
        "2. Project Overview",
        "3. Objectives",
        "4. Scope of Work",
        "5. Deliverables",
        "6. Project Phases &amp; Timeline",
        "7. Testing &amp; Validation",
        "8. AI Stack, Dataset Building &amp; Training",
        "9. Assumptions &amp; Client Responsibilities",
        "10. Out of Scope",
        "11. Commercial Terms",
        "12. Next Steps",
        "13. Acceptance",
    ]
    for item in toc:
        story.append(Paragraph(item, styles["toc_item"]))
    story.append(PageBreak())

    # ——— OVERVIEW ———
    story.append(Paragraph("2. Project Overview", styles["h1"]))
    story.append(section_rule())
    story.append(
        Paragraph(
            f"<b>{PROJECT}</b> is an AI-powered content assistant, accessible primarily through "
            "Telegram and/or a web interface, designed to support news monitoring, content "
            "generation, translation, and report writing. The system produces fast, professional, "
            "human-like outputs aligned with the client’s editorial style and preferred content sources.",
            styles["body"],
        )
    )
    story.append(
        Paragraph(
            "The solution prioritises speed, editorial consistency, and ease of daily use so the "
            "client’s team can move from raw sources to publish-ready text with minimal friction.",
            styles["body"],
        )
    )

    # ——— OBJECTIVES ———
    story.append(Paragraph("3. Objectives", styles["h1"]))
    story.append(section_rule())
    story.extend(
        bullets(
            [
                "Provide fast access to the latest news from selected Arabic and international sources.",
                "Generate concise summaries and multi-angle coverage of important events.",
                "Draft professional reports and news-style articles from text, links, or provided inputs.",
                "Translate spoken or written content between English and Arabic where needed.",
                "Maintain a natural, human-like writing style aligned with the client’s tone and editorial standards.",
            ],
            styles,
        )
    )

    # ——— SCOPE ———
    story.append(Paragraph("4. Scope of Work", styles["h1"]))
    story.append(section_rule())

    story.append(Paragraph("4.1 News Aggregation and Summarisation", styles["h2"]))
    story.append(Paragraph("The system will:", styles["body_left"]))
    story.extend(
        bullets(
            [
                "Pull content from approved sources and platforms.",
                "Identify important news items based on the client’s requirements.",
                "Produce short, readable summaries of key stories.",
                "Present the news in a structured and easy-to-use format.",
            ],
            styles,
        )
    )

    story.append(Paragraph("4.2 Content Generation", styles["h2"]))
    story.append(Paragraph("The system will:", styles["body_left"]))
    story.extend(
        bullets(
            [
                "Generate reports, articles, and news briefs based on a prompt, topic, link, or reference text.",
                "Support different writing angles and editorial styles.",
                "Produce ready-to-publish content with minimal manual editing.",
            ],
            styles,
        )
    )

    story.append(Paragraph("4.3 Translation Capability", styles["h2"]))
    story.append(Paragraph("The system will:", styles["body_left"]))
    story.extend(
        bullets(
            [
                "Accept a video link, post, or text input.",
                "Extract or process the available text content.",
                "Translate the content into Arabic and/or English.",
                "Return both the original and translated versions when required.",
            ],
            styles,
        )
    )

    story.append(Paragraph("4.4 Human-Like Writing Style", styles["h2"]))
    story.append(
        Paragraph(
            "Our team will build and refine the editorial dataset and training setup so the system learns "
            "the client’s voice — not a generic AI tone. The assistant will be trained / instructed to:",
            styles["body"],
        )
    )
    story.extend(
        bullets(
            [
                "Follow example templates and approved sample outputs.",
                "Match the preferred storytelling and journalistic style.",
                "Avoid robotic or overly generic output.",
                "Improve consistency across generated content through iterative dataset and prompt refinement.",
            ],
            styles,
        )
    )

    story.append(Paragraph("4.5 Platform Integration", styles["h2"]))
    story.append(
        Paragraph(
            "The solution will be delivered through either a <b>Telegram bot</b> or a <b>web-based interface</b>, "
            "based on the client’s preference. Both options are within the same project fee and scope; "
            "the client chooses the primary channel during Phase 1. Building both platforms is available "
            "only if agreed separately.",
            styles["body"],
        )
    )

    story.append(Paragraph("4.6 Editorial Inputs and Training Material", styles["h2"]))
    story.append(
        Paragraph(
            "The client provides raw references when available (samples, sources, preferred tone). "
            "<b>Our team turns those inputs into a working training dataset</b> — cleaning, structuring, "
            "labeling examples, writing style rules, and preparing evaluation cases used to train and tune the assistant.",
            styles["body"],
        )
    )
    story.append(Paragraph("The client will provide, when available:", styles["body_left"]))
    story.extend(
        bullets(
            [
                "Sample articles and writing templates.",
                "Preferred news sources and platforms.",
                "Example outputs or style references.",
                "Any specific editorial rules or formatting preferences.",
            ],
            styles,
        )
    )
    story.append(
        Paragraph(
            "Client samples are the starting point. Dataset construction, expansion, formatting, and "
            "training workflows are part of the development deliverable included in the project fee.",
            styles["body"],
        )
    )

    # ——— DELIVERABLES ———
    story.append(Paragraph("5. Deliverables", styles["h1"]))
    story.append(section_rule())
    story.extend(
        bullets(
            [
                "AI assistant for news summarisation and report generation.",
                "Custom editorial dataset built and prepared by our team for training and style alignment.",
                "Trained / tuned AI workflows (prompts, system instructions, evaluation loops) on that dataset.",
                "Translation functionality for supported content types.",
                "Human-like content writing aligned with sample templates.",
                "Platform integration for Telegram or web (client’s choice — one primary channel).",
                "Basic documentation for usage and workflow.",
                "Two weeks of free post-delivery bug-fix support after handover.",
            ],
            styles,
        )
    )

    # ——— PHASES ———
    story.append(Paragraph("6. Project Phases &amp; Timeline", styles["h1"]))
    story.append(section_rule())
    story.append(
        Paragraph(
            "The project will be delivered in three main phases over an estimated development period of "
            "approximately <b>2.5 months</b>, followed by a dedicated testing and validation period.",
            styles["body"],
        )
    )
    story.append(Spacer(1, 6))
    story.append(phase_table(styles))
    story.append(Spacer(1, 10))

    story.append(Paragraph("6.1 Phase 1 — Discovery, Planning &amp; Architecture", styles["h2"]))
    story.append(Paragraph("<b>Duration:</b> 2 weeks", styles["small"]))
    story.extend(
        bullets(
            [
                "Finalising the project scope and feature priorities.",
                "Confirming the client’s preferred platform (Telegram or web).",
                "Gathering source lists, content templates, and style references.",
                "Defining the technical architecture and workflow.",
                "Preparing the system structure for AI integration, content processing, and output formatting.",
            ],
            styles,
        )
    )

    story.append(Paragraph("6.2 Phase 2 — Core Development", styles["h2"]))
    story.append(Paragraph("<b>Duration:</b> 4 weeks", styles["small"]))
    story.extend(
        bullets(
            [
                "Building the main AI assistant workflow.",
                "Implementing news aggregation and summarisation features.",
                "Setting up content generation for reports, articles, and news briefs.",
                "Adding translation functionality for supported inputs.",
                "Building the training dataset from client samples and editorial references.",
                "Training and tuning the system (prompts, instructions, style rules, evaluation) on that dataset.",
                "Integrating the selected platform interface.",
            ],
            styles,
        )
    )

    story.append(Paragraph("6.3 Phase 3 — Refinement, Integration &amp; Delivery", styles["h2"]))
    story.append(Paragraph("<b>Duration:</b> 2.5 weeks", styles["small"]))
    story.extend(
        bullets(
            [
                "Improving output quality and human-like writing style.",
                "Refining the dataset, prompts, templates, and response structure.",
                "Adding any agreed enhancements such as alerts or additional source handling.",
                "Performing final integration checks.",
                "Preparing the solution for client review and handover.",
            ],
            styles,
        )
    )

    story.append(
        Paragraph(
            "<b>Timeline Summary:</b> Phase 1 (2 weeks) + Phase 2 (4 weeks) + Phase 3 (2.5 weeks) "
            "+ Testing (1–2 weeks). Total estimated timeline: approximately <b>2.5 months + testing period</b>.",
            styles["body"],
        )
    )

    # ——— TESTING ———
    story.append(Paragraph("7. Testing &amp; Validation", styles["h1"]))
    story.append(section_rule())
    story.append(Paragraph("<b>Duration:</b> 1 week to 2 weeks", styles["small"]))
    story.append(Paragraph("A separate testing period will be allocated to:", styles["body_left"]))
    story.extend(
        bullets(
            [
                "Validate system performance and output quality.",
                "Review summaries, translations, and generated reports.",
                "Check consistency with the client’s editorial style.",
                "Fix bugs, improve edge cases, and apply final adjustments.",
                "Confirm readiness for launch or production use.",
            ],
            styles,
        )
    )

    # ——— AI STACK ———
    story.append(Paragraph("8. AI Stack, Dataset Building &amp; Training", styles["h1"]))
    story.append(section_rule())
    story.append(
        Paragraph(
            "<b>Important:</b> OpenAI API is the model engine only. The core of this project is the "
            "<b>custom AI layer our team designs, datasets, and trains</b> so outputs match the client’s "
            "editorial standards. The client funds the OpenAI account; our team owns the build, dataset, "
            "and training work included in the project fee.",
            styles["body"],
        )
    )
    story.append(Paragraph("8.1 Model Engine", styles["h2"]))
    story.extend(
        bullets(
            [
                "<b>OpenAI API</b> powers generation, summarisation, translation, and rewriting.",
                "The client provides and pays for the OpenAI account / API key and all token usage.",
            ],
            styles,
        )
    )
    story.append(Paragraph("8.2 What Our Team Builds (Included in the Fee)", styles["h2"]))
    story.extend(
        bullets(
            [
                "<b>Dataset creation:</b> collect, clean, structure, and expand training examples from client samples, templates, and approved references.",
                "<b>Editorial labeling &amp; style rules:</b> define tone, structure, do’s/don’ts, and output formats for summaries, reports, briefs, and translations.",
                "<b>Training / tuning:</b> system instructions, prompt workflows, few-shot examples, and iterative refinement against the dataset.",
                "<b>Evaluation set:</b> test cases used to check quality, consistency, Arabic/English handling, and human-like writing before handover.",
                "<b>Continuous improvement during the project:</b> retrain / re-tune based on review feedback through Phases 2–3 and testing.",
            ],
            styles,
        )
    )
    story.append(Paragraph("8.3 Clarification", styles["h2"]))
    story.extend(
        bullets(
            [
                "Providing an API key alone does <b>not</b> produce a finished assistant — the dataset and training work are a major part of delivery.",
                "Optional future extensions (e.g. speech-to-text or full video transcription) remain subject to a separate agreement if required.",
            ],
            styles,
        )
    )

    # ——— ASSUMPTIONS ———
    story.append(Paragraph("9. Assumptions &amp; Client Responsibilities", styles["h1"]))
    story.append(section_rule())
    story.append(Paragraph("9.1 Assumptions", styles["h2"]))
    story.extend(
        bullets(
            [
                "The client will provide the necessary content samples, sources, and style references in a timely manner.",
                "Final features may be adjusted based on technical feasibility within the agreed fee.",
                "Telegram or web is the client’s choice; either option is covered by the same project fee.",
            ],
            styles,
        )
    )
    story.append(Paragraph("9.2 Client-Provided Infrastructure &amp; Accounts", styles["h2"]))
    story.append(
        Paragraph(
            "The following are <b>provided and paid for by the client</b> (not included in the 29,000 EGP development fee):",
            styles["body"],
        )
    )
    story.extend(
        bullets(
            [
                "Server / hosting environment required to run the solution.",
                "Domain name (if a web interface is selected).",
                "Telegram bot token and related Telegram account setup (if Telegram is selected).",
                "OpenAI API key and all OpenAI usage / token charges.",
                "Any other third-party API keys, paid news subscriptions, or platform credentials required for integration.",
            ],
            styles,
        )
    )
    story.append(
        Paragraph(
            "The development team will guide setup and connect the solution to these accounts, but ownership, "
            "billing, and ongoing renewals remain with the client.",
            styles["body"],
        )
    )

    # ——— OUT OF SCOPE ———
    story.append(Paragraph("10. Out of Scope", styles["h1"]))
    story.append(section_rule())
    story.append(
        Paragraph(
            "Unless otherwise agreed in writing, the following are <b>not</b> included:",
            styles["body"],
        )
    )
    story.extend(
        bullets(
            [
                "Full video editing and advanced media production.",
                "Large-scale custom newsroom management systems.",
                "Paid media source subscriptions or third-party licensing fees.",
                "Server, domain, Telegram bot, OpenAI, or other account/subscription fees.",
                "Ongoing content moderation or manual editorial operation by the development team.",
                "Support beyond the post-delivery warranty window described in Section 11.",
            ],
            styles,
        )
    )

    # ——— COMMERCIAL ———
    story.append(Paragraph("11. Commercial Terms", styles["h1"]))
    story.append(section_rule())
    story.append(price_box(styles))
    story.append(Spacer(1, 12))
    story.append(
        Paragraph(
            "The fixed project investment covers the scoped development work described in this document "
            "across Phases 1–3 and the testing period, including integration for <b>one</b> primary channel "
            "(Telegram <b>or</b> web, as chosen by the client).",
            styles["body"],
        )
    )
    story.append(Paragraph("11.1 What’s Included", styles["h2"]))
    story.extend(
        bullets(
            [
                "Discovery, architecture, and implementation as defined in Sections 4–8.",
                "Full dataset building, style rules, prompt/system training, and evaluation loops by our team.",
                "Handover documentation for usage and workflow.",
                "Bug fixes identified during the testing &amp; validation window.",
                "<b>Two (2) weeks of free post-delivery bug-fix support</b> after handover / sign-off "
                "(defects in delivered scope only; new features are excluded).",
            ],
            styles,
        )
    )
    story.append(Paragraph("11.2 Payment Schedule (Recommended)", styles["h2"]))
    pay_header = [
        Paragraph("Milestone", styles["table_header"]),
        Paragraph("Trigger", styles["table_header"]),
        Paragraph("Amount", styles["table_header"]),
    ]
    pay_rows = [
        ["Advance", "Project kickoff / contract signing", "40% — 11,600 EGP"],
        ["Mid-delivery", "End of Phase 2 (core features demo)", "40% — 11,600 EGP"],
        ["Final", "Handover after testing sign-off", "20% — 5,800 EGP"],
    ]
    pay_data = [pay_header]
    for r in pay_rows:
        pay_data.append([Paragraph(c, styles["table_cell"]) for c in r])
    pay_t = Table(pay_data, colWidths=[3.5 * cm, 8 * cm, 4.5 * cm])
    pay_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("BOX", (0, 0), (-1, -1), 0.8, TEAL),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, RULE),
        ("LINEBELOW", (0, 0), (-1, 0), 2, TEAL),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]
    for i in range(1, len(pay_data)):
        pay_cmds.append(("BACKGROUND", (0, i), (-1, i), WHITE if i % 2 else TEAL_SOFT))
    pay_t.setStyle(TableStyle(pay_cmds))
    story.append(pay_t)
    story.append(Spacer(1, 8))
    story.append(Paragraph("11.3 Notes", styles["h2"]))
    story.extend(
        bullets(
            [
                "Currency: Egyptian Pounds (EGP).",
                "OpenAI API costs are paid directly by the client on the client’s own account.",
                "Hosting, domain, Telegram bot, and API keys are owned and funded by the client.",
                "Changes beyond this scope will be estimated and approved in writing before work begins.",
                "Paid third-party news subscriptions and ongoing editorial staffing are excluded.",
            ],
            styles,
        )
    )
    story.append(Paragraph("11.4 Post-Delivery Support", styles["h2"]))
    story.extend(
        bullets(
            [
                "Included: <b>14 days</b> of free bug-fix support after official handover.",
                "Covered: defects that prevent agreed features from working as delivered.",
                "Not covered during the warranty: new features, source additions, redesign, or style rewrites beyond minor prompt tweaks needed to fix a defect.",
                "Support after the 14-day window is available under a separate retainer or time-based agreement.",
            ],
            styles,
        )
    )

    # ——— NEXT STEPS ———
    story.append(Paragraph("12. Next Steps", styles["h1"]))
    story.append(section_rule())
    story.extend(
        bullets(
            [
                "Client selects the delivery platform: Telegram or web.",
                "Share source lists, writing samples, and example outputs.",
                "Client prepares OpenAI key, hosting/server access, and Telegram bot or domain as applicable.",
                "Define the exact feature priority for Phase 1.",
                "Approve this Scope of Work, timeline, and the project fee of <b>29,000 EGP</b>.",
                "Sign off kickoff and transfer the advance payment to begin Phase 1.",
            ],
            styles,
        )
    )

    # ——— ACCEPTANCE ———
    story.append(Paragraph("13. Acceptance", styles["h1"]))
    story.append(section_rule())
    story.append(
        Paragraph(
            "By signing below, the parties acknowledge that they have reviewed this Scope of Work "
            f"and Commercial Proposal for <b>{PROJECT}</b>, including the fixed project fee of "
            f"<b>{PRICE}</b>, and agree to proceed subject to the terms outlined herein.",
            styles["body"],
        )
    )
    story.append(Spacer(1, 18))

    sig = Table(
        [
            [
                Paragraph("<b>Client</b>", styles["table_cell"]),
                Paragraph("<b>Service Provider</b>", styles["table_cell"]),
            ],
            [
                Paragraph("Name: ___________________________", styles["table_cell"]),
                Paragraph("Name: ___________________________", styles["table_cell"]),
            ],
            [
                Paragraph("Title: ____________________________", styles["table_cell"]),
                Paragraph("Title: ____________________________", styles["table_cell"]),
            ],
            [
                Paragraph("Signature: _______________________", styles["table_cell"]),
                Paragraph("Signature: _______________________", styles["table_cell"]),
            ],
            [
                Paragraph("Date: ____________________________", styles["table_cell"]),
                Paragraph("Date: ____________________________", styles["table_cell"]),
            ],
        ],
        colWidths=[8 * cm, 8 * cm],
    )
    sig.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("LINEBELOW", (0, 0), (-1, 0), 1.5, TEAL),
                ("LINEABOVE", (0, 0), (-1, 0), 0.8, GOLD),
            ]
        )
    )
    story.append(sig)
    story.append(Spacer(1, 20))
    story.append(
        Paragraph(
            f"— End of Document — {PROJECT} | {DOC_DATE} | {PRICE}",
            styles["end_meta"],
        )
    )

    def first_page(canvas, doc_):
        add_cover_decorations(canvas, doc_)

    def later_pages(canvas, doc_):
        add_page_decorations(canvas, doc_)

    doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)
    print(OUTPUT)


if __name__ == "__main__":
    build()
