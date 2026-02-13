#!/usr/bin/env python3
"""Generate HTML for usecases-en.html B2B section"""

from usecases_data import USECASES

CATEGORIES = [
    ("Tourism & Leisure", 0, 20),
    ("Wedding & Events", 20, 28),
    ("Memorial & Spiritual", 28, 38),
    ("Farms & Local Products", 38, 50),
    ("Shops & Crafts", 50, 63),
    ("Wellness & Healthcare", 63, 75),
    ("Education & Culture", 75, 85),
    ("Business & Services", 85, 95),
    ("Food & Dining", 95, 100),
]

def generate_html():
    html_parts = []

    for category_name, start, end in CATEGORIES:
        html_parts.append(f'''
    <section class="usecases-section">
        <h2>{category_name}</h2>
        <div class="usecase-grid">''')

        for i in range(start, end):
            slug, icon, title, subtitle, color, light, dark, business_type = USECASES[i]
            filename = f"usecase-{slug}-en.html"
            html_parts.append(f'''
            <a href="{filename}" class="usecase-card b2b linked">
                <div class="usecase-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{subtitle}</p>
                <span class="arrow"></span>
            </a>''')

        html_parts.append('''
        </div>
    </section>''')

    return ''.join(html_parts)

if __name__ == "__main__":
    print(generate_html())
