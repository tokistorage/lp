#!/usr/bin/env python3
"""
Add マニフェスト / Manifesto link to all toki-footer pages.
Handles multiple footer patterns across Japanese and English pages.
"""

import os
import re
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def add_manifesto_link():
    html_files = glob.glob(os.path.join(ROOT, '*.html'))
    updated = 0
    skipped = 0
    already_has = 0

    for filepath in sorted(html_files):
        filename = os.path.basename(filepath)

        # Skip the manifesto pages themselves
        if filename in ('manifesto.html', 'manifesto-en.html'):
            skipped += 1
            continue

        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Skip files without toki-footer
        if 'toki-footer' not in content:
            skipped += 1
            continue

        # Skip files that already have the manifesto link
        if 'manifesto.html' in content or 'manifesto-en.html' in content:
            already_has += 1
            continue

        original = content
        is_english = 'lang="en"' in content[:200]

        if is_english:
            manifesto_link = '<a href="manifesto-en.html">Manifesto</a>'
        else:
            manifesto_link = '<a href="manifesto.html">マニフェスト</a>'

        # Strategy: try multiple insertion patterns in order of specificity

        # Pattern 1: After "1000年の設計思想" (main Japanese pages)
        if not is_english and '<a href="legacy.html">1000年の設計思想</a>' in content:
            content = content.replace(
                '<a href="legacy.html">1000年の設計思想</a>',
                '<a href="legacy.html">1000年の設計思想</a>\n            ' + manifesto_link
            )

        # Pattern 2: After "1000-Year Design Philosophy" (main English pages)
        elif is_english and '<a href="legacy-en.html">1000-Year Design Philosophy</a>' in content:
            content = content.replace(
                '<a href="legacy-en.html">1000-Year Design Philosophy</a>',
                '<a href="legacy-en.html">1000-Year Design Philosophy</a>\n            ' + manifesto_link
            )

        # Pattern 3: After "エコシステム全体像" (Japanese usecase/sub-pages)
        elif not is_english and 'エコシステム全体像</a>' in content:
            content = content.replace(
                '<a href="infographic.html">エコシステム全体像</a>',
                '<a href="infographic.html">エコシステム全体像</a>\n            ' + manifesto_link
            )

        # Pattern 4: Japanese pages with "リンク" footer section - insert before closing </div>
        elif not is_english and '<h4>リンク</h4>' in content:
            # Find the first footer-links-group with リンク and add before its closing
            pattern = r'(<h4>リンク</h4>.*?)(</div>\s*<div class="footer-links-group">)'
            match = re.search(pattern, content, re.DOTALL)
            if match:
                insert_point = match.end(1)
                content = content[:insert_point] + '\n            ' + manifesto_link + content[insert_point:]

        # Pattern 5: English pages with "Links" footer section
        elif is_english and '<h4>Links</h4>' in content:
            pattern = r'(<h4>Links</h4>.*?)(</div>\s*<div class="footer-links-group">)'
            match = re.search(pattern, content, re.DOTALL)
            if match:
                insert_point = match.end(1)
                content = content[:insert_point] + '\n            ' + manifesto_link + content[insert_point:]

        # Pattern 6: Fallback - insert before </footer> as a standalone link
        else:
            # Last resort - add before footer closing
            content = content.replace(
                '</footer>',
                '    <div style="text-align:center; padding: 0.5rem 0;"><a href="' +
                ('manifesto-en.html">Manifesto' if is_english else 'manifesto.html">マニフェスト') +
                '</a></div>\n</footer>',
                1
            )

        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            updated += 1
            print(f"  Updated: {filename}")
        else:
            skipped += 1

    print(f"\nDone! Updated: {updated}, Already had link: {already_has}, Skipped: {skipped}")

if __name__ == '__main__':
    add_manifesto_link()
