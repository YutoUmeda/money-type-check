# マネータイプ診断 v1.0

> 「ゆるかわ × 少し神秘的」なデザインコンセプトで制作した  
> X拡散型エンタメ診断サービス

---

## ファイル構成

```
money-type-diagnosis/
├── index.html       ← メインHTML（全ページ含む）
├── style.css        ← スタイルシート
├── data.js          ← マスターデータ（16タイプ・設問）
├── engine.js        ← 判定エンジン（採点・タイブレーク）
├── app.js           ← アプリコントローラー
├── gas.js           ← Google Apps Script（GASにコピーして使う）
└── images/          ← 画像ファイル置き場（後から追加）
    ├── turtle.png
    ├── penguin.png
    ├── ... （16タイプ分）
    └── ogp_*.png    （OGP用）
```

---

## GitHub Pages デプロイ手順

1. GitHubに新規リポジトリを作成（例: `money-type-diagnosis`）
2. このフォルダの中身を全てpush
3. Settings → Pages → Source: `main` ブランチ / `/ (root)` を選択
4. `https://{username}.github.io/money-type-diagnosis/` で公開完了

カスタムドメイン（`money.nuts72.com`）を使う場合:
- Settings → Pages → Custom domain に設定
- DNSのCNAMEレコードを `{username}.github.io` に向ける

---

## Google Apps Script 連携手順

1. Google Sheetsを開く（マスターデータのスプレッドシート）
2. 拡張機能 → Apps Script
3. `gas.js` の内容を貼り付けて保存
4. デプロイ → 新しいデプロイ → ウェブアプリ
   - 実行ユーザー: 自分
   - アクセスできるユーザー: **全員（匿名含む）**
5. デプロイ後に発行されるURLをコピー
6. `app.js` の以下の行を書き換える：

```js
// 変更前
GAS_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',

// 変更後（実際のURL）
GAS_URL: 'https://script.google.com/macros/s/AKfycbx.../exec',
```

---

## 画像ファイルの差し替え

`images/` フォルダに以下のファイルを追加すれば自動的に表示されます。

| ファイル名 | 用途 |
|---|---|
| `turtle.png` | 資産防衛タートル キャラ画像 |
| `ogp_turtle.png` | 資産防衛タートル OGP画像（1200×630px推奨） |
| ... | 各タイプ同様 |

**画像がない場合**は絵文字が表示されます（フォールバック対応済み）。

---

## 4軸判定ロジック

| 軸 | 高スコア → | 低スコア → |
|---|---|---|
| 守る vs 増やす | 守る | 増やす |
| 論理 vs 直感 | 論理 | 直感 |
| 計画 vs 挑戦 | 計画 | 挑戦 |
| 安心 vs 自由 | 安心 | 自由 |

**タイブレーク優先順序:**
1. Q9の回答
2. Q10の回答
3. 増やす > 直感 > 挑戦 > 自由 を優先

---

## v1.0 完成条件チェックリスト

- [x] TOP表示（KV・説明・16タイプ・流れ・CTA）
- [x] 10問診断（1問ずつ・戻るボタン・プログレスバー）
- [x] 採点（4軸・裏パラメータ）
- [x] 16タイプ判定（タイブレークルール対応）
- [x] メール登録（任意・スキップ対応）
- [x] 結果ページ（全項目表示）
- [x] Xシェア（SNSシェア文を使用）
- [x] Google Sheets保存（GAS連携）
- [x] スマホ表示対応（スマホファースト）
- [x] 画像フォールバック（絵文字表示）

---

## カスタマイズポイント

### アフィリエイト導線追加（v2.0想定）
`result-content` セクション内にアフィリエイトリンクを追加。
タイプ別に適切な商材（転職・投資・保険・クレカ等）を配置する。

### OGP自動生成（v2.0想定）
Canvas APIまたはCloudinary等を使って動的OGP画像を生成する。

### 相性診断・恋愛診断（v3.0想定）
2人のタイプを比較するページを追加する。
