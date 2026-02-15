#!/usr/bin/env python3
"""Inject TokiQR section into all usecase pages (JP and EN)."""

import glob
import os

SECTION_JA = '''
    <section class="usecase-section">
        <h2>TokiQRで「声」も残す</h2>
        <p>トキストレージの<strong>TokiQR</strong>を組み合わせれば、石英ガラスに刻む記録に加えて、音声メッセージもQRコードで永久保存できます。サーバー不要・オフライン再生対応で、印刷物やプレートに添えるだけ。「声の存在証明」を届けられます。</p>
        <p style="margin-top:0.5rem;"><a href="https://tokistorage.github.io/qr/" style="color:var(--theme-color); font-weight:500;">TokiQRを試す &rarr;</a></p>
    </section>

'''

SECTION_EN = '''
    <section class="usecase-section">
        <h2>Add Voice with TokiQR</h2>
        <p>Pair with <strong>TokiQR</strong>, TokiStorage\'s companion product, to preserve voice messages alongside quartz glass records. No server required, offline playback supported &mdash; just print a QR code and attach it to deliver a lasting "proof of voice."</p>
        <p style="margin-top:0.5rem;"><a href="https://tokistorage.github.io/qr/" style="color:var(--theme-color); font-weight:500;">Try TokiQR &rarr;</a></p>
    </section>

'''

MARKER = 'TokiQR'  # Skip files already containing this section

def inject(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already injected
    if 'TokiQR' in content and 'usecase-section' in content and 'tokistorage.github.io/qr/' in content:
        return False

    # Determine language
    is_en = 'lang="en"' in content[:200]
    section = SECTION_EN if is_en else SECTION_JA

    # Insert before cta-box
    anchor = '<div class="cta-box">'
    if anchor not in content:
        return False

    idx = content.index(anchor)
    # Add proper indentation
    new_content = content[:idx] + section + '    ' + content[idx:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return True

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    lp_dir = os.path.dirname(script_dir)

    files = sorted(glob.glob(os.path.join(lp_dir, 'usecase-*.html')))
    injected = 0
    skipped = 0

    for f in files:
        if inject(f):
            injected += 1
            print(f"  Injected: {os.path.basename(f)}")
        else:
            skipped += 1

    print(f"\nDone: {injected} injected, {skipped} skipped, {injected + skipped} total")

if __name__ == '__main__':
    main()
