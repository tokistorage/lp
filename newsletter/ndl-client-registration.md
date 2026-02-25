# NDL クライアントリポジトリ登録手順

B2Bクライアントのニュースレターリポジトリを国立国会図書館（NDL）の定期収集対象に追加する手順。

## 前提

- TokiStorage は既に NDL オンライン資料収集の申出を完了済み（受付番号: EA202602160140）
- NDL は登録URLを定期的に自動収集（クローリング）する
- クライアントリポジトリは GitHub Pages で公開済み

## URL命名規則

```
https://tokistorage.github.io/newsletter-client-{clientId}/output/{YYYY-MM}.pdf
```

例:
- `https://tokistorage.github.io/newsletter-client-hilton/output/2026-06.pdf`
- `https://tokistorage.github.io/newsletter-client-fujii/output/2026-09.pdf`

## 手順

### 1. クライアントリポジトリの GitHub Pages を確認

```
https://tokistorage.github.io/newsletter-client-{clientId}/
```

- index.html が表示され、schedule.json からリストが生成されることを確認
- output/ 内のPDFが直接アクセスできることを確認

### 2. NDL オンライン資料収集への追加申出

1. NDL申出ページにアクセス: https://dl.ndl.go.jp/dms/online/agreement
2. 「利用規約に同意する」をチェック
3. 以下の情報を入力:

| 項目 | 値 |
|------|-----|
| 発行者名 | TokiStorage（佐藤卓也） |
| 住所 | 〒279-0014 千葉県浦安市明海2-11-13 |
| 連絡先 | tokistorage1000@gmail.com |
| 資料のURL | `https://tokistorage.github.io/newsletter-client-{clientId}/` |
| 資料の名称 | {クライアント名} ニュースレター |
| 資料の種類 | 逐次刊行物 |
| 定期収集希望 | はい |
| インターネット公開許諾 | はい |

4. 申出を送信
5. 受付番号をメモ → クライアントの client-config.json に追記（オプション）

### 3. 確認

- NDL からの受付メールを確認
- 初回PDF公開後、数週間以内に NDL デジタルコレクションに収録されることを確認
  - 検索: https://dl.ndl.go.jp/ で刊行物名を検索

## 注意事項

- 既存の申出（EA202602160140）は `tokistorage.github.io/lp/` 配下のみカバー
- クライアントリポジトリは別URL（`tokistorage.github.io/newsletter-client-*`）のため、個別に申出が必要
- 将来的に TokiStorage のドメイン配下に統一した場合は、1回の申出でカバー可能

## 自動化の可能性

NDL の申出はWebフォーム経由のため、現時点では手動。
クライアント数が増加した場合:
- NDL に包括的URL登録（ワイルドカード）を相談
- または `tokistorage.github.io/newsletter/` 配下にサブパスで統一
