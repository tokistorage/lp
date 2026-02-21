# TokiStorage LP

**存在証明の民主化** — 三層分散保管で声・画像・テキストを1000年残す。

[![GitHub Pages](https://img.shields.io/badge/Live-tokistorage.github.io/lp-2563EB?style=flat&logo=github)](https://tokistorage.github.io/lp/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

TokiStorage は、人間の声・画像・テキストを三つの独立した層で保管するサービスです。

| 層 | 手段 | 耐久性 |
|----|------|--------|
| 物理層 | 石英ガラス彫刻 / UV耐性ラミネートQRステッカー | 1000年+ |
| 国家層 | 国立国会図書館（NDL）納本 | 制度が続く限り |
| デジタル層 | GitHub Pages | 分散・オープン |

このリポジトリは、TokiStorage のランディングページ（LP）サイトのソースコードです。

## Contents

- **114+ エッセイ** — 心理学、経済、地質学、宇宙まで広がるテーマ（日英バイリンガル）
- **100+ ユースケース** — 業種別の活用事例
- **技術ドキュメント** — Codec2、QRコード、三層保管の設計資料

## Tech Stack

- **Hosting**: GitHub Pages (static site)
- **Fonts**: System fonts (Hiragino Mincho / Yu Gothic)
- **SEO**: OGP, JSON-LD, hreflang, sitemap.xml, llms.txt
- **Analytics**: Cloudflare Web Analytics
- **CI**: GitHub Actions (auto-merge, deploy-notify, essay-sync)

## Links

- **Main site**: https://tokistorage.github.io/lp/
- **English**: https://tokistorage.github.io/lp/index-en.html
- **TokiQR**: https://tokistorage.github.io/qr/
- **Essays**: https://tokistorage.github.io/lp/essays.html

## Local Development

```bash
# Clone
git clone https://github.com/tokistorage/lp.git
cd lp

# Serve locally
python -m http.server 8000
# Open http://localhost:8000
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Issues and Pull Requests are welcome in both Japanese and English.

## License

[MIT](LICENSE) &copy; 2026 TokiStorage / Takuya Sato
