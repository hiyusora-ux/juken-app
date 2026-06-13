# 受験ダッシュボード 🏔🍅

高校生の受験勉強を「見える化」するWebアプリ（Cybermap風ダークネオン）。

## 機能

- 🏠 ホーム：カウントダウン／KPI／登山ルート進捗（合目＋今日のタスク完了リング）／実績バッジ／ごほうび
- 🍅 タイマー：ポモドーロ＋YouTube勉強BGMギャラリー（タップで選択＆全画面）／タイマー連動再生／学習記録に自動追加
- 📝 テスト結果：模試・実力・定期の記録、写真/PDFをAIが自動読み取り、偏差値推移グラフ
- 👤 プロフィール：基本情報、アバター（写真/絵文字）、あいぼうモンスター（Lv5/Lv10で進化）、志望大学（AIが偏差値を自動取得）、将来の夢、目標リスト（長期目標は合格ライン×1.2に自動連動）、興味さがし（AIが進路提案）
- 👨‍👩‍👧 保護者ビュー：週次サマリーと声かけのヒント
- 偉人の格言カード（タップで切替）／レベル＆XP／🔥連続日数

## 技術構成

- フロント：React 18 + Vite + Recharts
- データ保存：ブラウザのlocalStorage
- AI機能：Vercel Serverless Function（`api/ai.js`）→ Anthropic Messages API
  - APIキーは環境変数 `ANTHROPIC_API_KEY` でサーバー側に保管（ブラウザに露出しない）
  - 用途：成績表の写真/PDF読み取り、志望大学の偏差値自動取得、興味さがし
- ホスティング：Vercel
- PWA対応（iPhoneの「ホーム画面に追加」で全画面起動）

## 開発手順（Windows）

### 1. 必要なツール（初回のみ）

[Node.js LTS](https://nodejs.org/ja) をインストール。コマンドプロンプト（または PowerShell）で確認：

```powershell
node --version
npm --version
```

### 2. プロジェクトのセットアップ

このフォルダで：

```powershell
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開く。UIは触れるが、AI機能（写真読み取り・偏差値取得・興味さがし）はサーバーレス関数が動かないので `vercel dev` で起動が必要：

```powershell
npm install -g vercel
vercel link          # 初回のみ。Vercelアカウントが必要（無料）
vercel env add ANTHROPIC_API_KEY  # APIキーを登録（development/preview/production すべてに）
vercel dev           # http://localhost:3000 でフロント＋APIが両方動く
```

APIキーは https://console.anthropic.com/settings/keys で発行できます（既にお持ちのキーが使えます）。

### 3. デプロイ（GitHub → Vercel）

```powershell
git init
git add .
git commit -m "initial commit"
# GitHubで新しいリポジトリを作成して、表示されるコマンドで push
git remote add origin https://github.com/<ユーザー名>/juken-dashboard.git
git branch -M main
git push -u origin main
```

その後：
1. https://vercel.com にログイン → **Add New → Project** → 作成したGitHubリポジトリを Import
2. **Framework Preset = Vite** が自動検出されることを確認 → Deploy
3. プロジェクトの **Settings → Environment Variables** で `ANTHROPIC_API_KEY` を追加
4. **Deployments → 最新の Redeploy** で環境変数を反映

発行されたURL（例：`https://juken-dashboard-xxx.vercel.app`）にアクセスできれば完了！

### 4. iPhoneでアプリとして使う

1. iPhoneのSafariでデプロイされたURLを開く
2. 共有ボタン → **「ホーム画面に追加」**
3. アイコンをタップすると全画面のスタンドアロンアプリとして起動

※ アイコン画像は未作成。`public/icon-192.png`, `icon-512.png`, `icon-180.png` を作って配置すると、ホーム画面アイコンがおしゃれになります。

## データについて

- 学習記録・テスト結果は端末のlocalStorageに保存（端末ごとに独立）
- 写真・PDFはサーバー側に保存されず、AI読み取りの一時的な処理のみに使われます
- 家族間でデータ共有したい場合は Supabase / Firebase 連携に拡張可（CLAUDE.md参照）
