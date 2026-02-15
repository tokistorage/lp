#!/usr/bin/env python3
"""Replace generic Voice QR sections with per-usecase custom descriptions."""

import glob
import os
import re

from voice_qr_descriptions import DESCRIPTIONS_JA, DESCRIPTIONS_EN

# Regex to match the existing Voice QR section (both JP and EN)
SECTION_RE = re.compile(
    r'\n\s*<section class="usecase-section">\s*'
    r'<h2>(?:Voice QRで「声」も残す|Add Voice with Voice QR)</h2>.*?'
    r'</section>\s*\n',
    re.DOTALL
)

def make_section_ja(desc):
    return f'''
    <section class="usecase-section">
        <h2>Voice QRで「声」も残す</h2>
        <p>{desc}</p>
        <p style="margin-top:0.5rem;"><a href="https://tokistorage.github.io/qr/" style="color:var(--theme-color); font-weight:500;">Voice QRを試す &rarr;</a></p>
    </section>

'''

def make_section_en(desc):
    return f'''
    <section class="usecase-section">
        <h2>Add Voice with Voice QR</h2>
        <p>{desc}</p>
        <p style="margin-top:0.5rem;"><a href="https://tokistorage.github.io/qr/" style="color:var(--theme-color); font-weight:500;">Try Voice QR &rarr;</a></p>
    </section>

'''

def get_slug(filename):
    """Extract slug from filename. e.g. usecase-tourism.html -> tourism, usecase-resort-en.html -> resort"""
    name = os.path.basename(filename)
    name = name.replace('usecase-', '').replace('.html', '')
    if name.endswith('-en'):
        name = name[:-3]
    return name

def process(filepath):
    slug = get_slug(filepath)
    is_en = '-en.html' in filepath

    if is_en:
        desc = DESCRIPTIONS_EN.get(slug)
        if not desc:
            return None  # No custom description
        section = make_section_en(desc)
    else:
        desc = DESCRIPTIONS_JA.get(slug)
        if not desc:
            return None
        section = make_section_ja(desc)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if not SECTION_RE.search(content):
        return 'no-section'

    new_content = SECTION_RE.sub(section, content)

    if new_content == content:
        return 'unchanged'

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return 'replaced'

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    lp_dir = os.path.dirname(script_dir)

    files = sorted(glob.glob(os.path.join(lp_dir, 'usecase-*.html')))
    replaced = 0
    missing = []
    no_section = []

    for f in files:
        result = process(f)
        if result == 'replaced':
            replaced += 1
            print(f"  Replaced: {os.path.basename(f)}")
        elif result is None:
            missing.append(os.path.basename(f))
        elif result == 'no-section':
            no_section.append(os.path.basename(f))

    print(f"\nReplaced: {replaced}")
    if missing:
        print(f"Missing descriptions ({len(missing)}):")
        for m in missing:
            print(f"  {m}")
    if no_section:
        print(f"No Voice QR section found ({len(no_section)}):")
        for n in no_section:
            print(f"  {n}")

if __name__ == '__main__':
    main()
