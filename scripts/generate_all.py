#!/usr/bin/env python3
"""Generate all 100 English usecase pages"""

import os
from usecases_data import USECASES, CONTENT_TEMPLATES, get_category

TEMPLATE = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | Use Cases | TokiStorage</title>
    <meta name="description" content="TokiStorage for {title}. {subtitle}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700&family=Zen+Kaku+Gothic+New:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="index.css">
    <style>
        :root {{
            --theme-color: {color};
            --theme-light: {light};
            --theme-dark: {dark};
        }}
        .usecase-detail {{ max-width: 900px; margin: 0 auto; padding: 2rem; padding-top: 6rem; }}
        .usecase-hero {{ text-align: center; padding: 3rem 2rem; background: linear-gradient(135deg, var(--theme-light) 0%, #fff 100%); border-radius: 16px; margin-bottom: 3rem; }}
        .usecase-hero .icon {{ font-size: 3.5rem; margin-bottom: 1rem; }}
        .usecase-hero h1 {{ font-family: 'Shippori Mincho', serif; font-size: 2rem; color: #1e293b; margin-bottom: 0.5rem; }}
        .usecase-hero .subtitle {{ color: var(--theme-color); font-size: 1.1rem; font-weight: 500; }}
        .usecase-section {{ margin-bottom: 3rem; }}
        .usecase-section h2 {{ font-family: 'Shippori Mincho', serif; font-size: 1.4rem; color: #1e293b; margin-bottom: 1rem; padding-left: 1rem; border-left: 4px solid var(--theme-color); }}
        .usecase-section p {{ color: #475569; line-height: 1.9; margin-bottom: 1rem; }}
        .scene-cards {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 1.5rem; }}
        .scene-card {{ background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; }}
        .scene-card h3 {{ font-size: 1rem; color: var(--theme-color); margin-bottom: 0.5rem; }}
        .scene-card p {{ font-size: 0.9rem; color: #64748b; margin: 0; }}
        .benefits-list {{ list-style: none; padding: 0; }}
        .benefits-list li {{ padding: 0.8rem 0; padding-left: 2rem; position: relative; border-bottom: 1px solid #f1f5f9; }}
        .benefits-list li::before {{ content: '\\2713'; position: absolute; left: 0; color: var(--theme-color); font-weight: bold; }}
        .quote-box {{ background: var(--theme-light); border-radius: 12px; padding: 2rem; margin: 2rem 0; }}
        .quote-box blockquote {{ font-family: 'Shippori Mincho', serif; font-size: 1.15rem; color: #334155; font-style: italic; margin: 0; line-height: 1.8; }}
        .quote-box .source {{ margin-top: 1rem; font-size: 0.9rem; color: #64748b; }}
        .flow-steps {{ display: flex; flex-direction: column; gap: 1rem; }}
        .flow-step {{ display: flex; gap: 1rem; align-items: flex-start; }}
        .flow-step .num {{ width: 32px; height: 32px; background: var(--theme-color); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; }}
        .flow-step .content h4 {{ font-size: 1rem; color: #1e293b; margin-bottom: 0.3rem; }}
        .flow-step .content p {{ font-size: 0.9rem; color: #64748b; margin: 0; }}
        .cta-box {{ text-align: center; padding: 3rem; background: linear-gradient(135deg, var(--theme-light) 0%, #f8fafc 100%); border-radius: 16px; margin-top: 3rem; }}
        .cta-box h2 {{ font-family: 'Shippori Mincho', serif; font-size: 1.5rem; color: #1e293b; margin-bottom: 1rem; }}
        .cta-box p {{ color: #64748b; margin-bottom: 1.5rem; }}
        .cta-box .btn-primary {{ display: inline-block; padding: 1rem 2.5rem; background: var(--theme-color); color: #fff; border-radius: 8px; text-decoration: none; font-weight: 500; transition: background 0.2s; }}
        .cta-box .btn-primary:hover {{ background: var(--theme-dark); }}
        .back-link {{ display: inline-flex; align-items: center; gap: 0.5rem; color: var(--theme-color); text-decoration: none; font-size: 0.9rem; margin-bottom: 2rem; }}
        .back-link:hover {{ text-decoration: underline; }}
        @media (max-width: 768px) {{ .usecase-detail {{ padding: 1.5rem; padding-top: 5rem; }} .usecase-hero h1 {{ font-size: 1.6rem; }} .scene-cards {{ grid-template-columns: 1fr; }} }}
    </style>
</head>
<body>

<nav class="toki-nav">
    <a href="index-en.html" class="nav-logo">TokiStorage</a>
    <div class="nav-links">
        <a href="usecases-en.html">Use Cases</a>
        <a href="index-en.html#pricing">Pricing</a>
        <a href="index-en.html#faq">FAQ</a>
        <a href="index-en.html#cta" class="nav-cta">Free Consultation</a>
    </div>
    <button class="nav-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
</nav>

<main class="usecase-detail">
    <a href="usecases-en.html" class="back-link">&#x2190; Back to Use Cases</a>

    <div class="usecase-hero">
        <div class="icon">{icon}</div>
        <h1>{title}</h1>
        <p class="subtitle">{subtitle}</p>
    </div>

    <section class="usecase-section">
        <h2>Why {title}?</h2>
        <p>{why_p1}</p>
        <p>{why_p2}</p>
    </section>

    <section class="usecase-section">
        <h2>Ideal Scenarios</h2>
        <div class="scene-cards">
            <div class="scene-card">
                <h3>Customer Milestone</h3>
                <p>Celebrate significant moments and achievements with lasting keepsakes.</p>
            </div>
            <div class="scene-card">
                <h3>Premium Experience</h3>
                <p>Enhance your premium offerings with unique memory preservation.</p>
            </div>
            <div class="scene-card">
                <h3>Special Occasions</h3>
                <p>Mark celebrations, anniversaries, and memorable visits.</p>
            </div>
            <div class="scene-card">
                <h3>Legacy Building</h3>
                <p>Create lasting connections between your brand and customers.</p>
            </div>
        </div>
    </section>

    <div class="quote-box">
        <blockquote>
            "This experience was something I'll never forget. Having it preserved in quartz glass makes it truly eternal."
        </blockquote>
        <p class="source">── Potential customer testimonial</p>
    </div>

    <section class="usecase-section">
        <h2>Benefits for Your Business</h2>
        <ul class="benefits-list">
            <li><strong>Premium Differentiation</strong> ─ Stand out with unique offerings no competitor can match</li>
            <li><strong>Emotional Connection</strong> ─ Build deeper relationships with customers</li>
            <li><strong>Zero Inventory Risk</strong> ─ Made-to-order means no storage or waste</li>
            <li><strong>New Revenue Stream</strong> ─ High-margin add-on service</li>
            <li><strong>Word of Mouth</strong> ─ Customers share unique experiences</li>
        </ul>
    </section>

    <section class="usecase-section">
        <h2>How It Works</h2>
        <div class="flow-steps">
            <div class="flow-step">
                <div class="num">1</div>
                <div class="content">
                    <h4>Consultation</h4>
                    <p>We learn about your brand, customers, and goals.</p>
                </div>
            </div>
            <div class="flow-step">
                <div class="num">2</div>
                <div class="content">
                    <h4>Custom Plan</h4>
                    <p>We design a tailored TokiStorage integration for your business.</p>
                </div>
            </div>
            <div class="flow-step">
                <div class="num">3</div>
                <div class="content">
                    <h4>Design & Production</h4>
                    <p>Create custom templates featuring your branding.</p>
                </div>
            </div>
            <div class="flow-step">
                <div class="num">4</div>
                <div class="content">
                    <h4>Launch</h4>
                    <p>Staff training, marketing materials, and go-live support.</p>
                </div>
            </div>
        </div>
    </section>

    <div class="cta-box">
        <h2>Ready to Get Started?</h2>
        <p>Let's discuss how TokiStorage can enhance<br>your {business_type} experience.</p>
        <a href="https://calendly.com/pearlmemorial/pearlmemorialsession" class="btn-primary" target="_blank" rel="noopener">Book a Free Consultation</a>
    </div>
</main>

<footer class="toki-footer">
    <div class="footer-inner">
        <div class="footer-brand">
            <h3>TokiStorage</h3>
            <p>Eternal memorial engraved in quartz glass.<br>No server, no maintenance.<br>Proof of existence, delivered 1,000 years forward.</p>
        </div>
        <div class="footer-links-group">
            <h4>Links</h4>
            <a href="index-en.html">About TokiStorage</a>
            <a href="usecases-en.html">Use Cases</a>
            <a href="index-en.html#pricing">Pricing</a>
            <a href="index-en.html#faq">FAQ</a>
        </div>
        <div class="footer-links-group">
            <h4>Legal</h4>
            <a href="tokushoho-en.html">Commercial Transactions Act</a>
            <a href="privacy-en.html">Privacy Policy</a>
        </div>
        <div class="footer-links-group">
            <h4>Company</h4>
            <p>TokiStorage</p>
            <p>&copy; 2026 All rights reserved.</p>
        </div>
    </div>
</footer>

<script src="index.js"></script>
</body>
</html>
'''

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.dirname(script_dir)

    for i, (slug, icon, title, subtitle, color, light, dark, business_type) in enumerate(USECASES):
        category = get_category(i)
        content = CONTENT_TEMPLATES[category]

        html = TEMPLATE.format(
            title=title,
            subtitle=subtitle,
            icon=icon,
            color=color,
            light=light,
            dark=dark,
            business_type=business_type,
            why_p1=content["why_p1"],
            why_p2=content["why_p2"],
        )

        filename = f"usecase-{slug}-en.html"
        filepath = os.path.join(output_dir, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)

        print(f"Generated: {filename}")

    print(f"\n✅ Total: {len(USECASES)} usecase pages generated!")

if __name__ == "__main__":
    main()
