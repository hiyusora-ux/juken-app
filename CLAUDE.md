# CLAUDE.md — 受験ダッシュボード 引き継ぎ書

## このプロジェクトについて

高校2年生の息子の受験勉強ダッシュボード。Claude.aiのアーティファクトで開発したものを、
Vercelデプロイ用のスタンドアロンWebアプリに移植済み。会話のレスポンスは日本語で。
オーナーは教育ICT専門のSIer（Google Workspace for Education管理が本業）でVercel・GitHubに慣れている。

## アーキテクチャ

- `src/App.jsx` — 全UIが1ファイル（約1200行）。タブ構成：
  - ホーム：QuoteCard, カウントダウン, KPI, MountainProgress, DailyTasks, BadgeShelf, RewardsPanel, 学習グラフ, StudyForm
  - タイマー：PomodoroPage（YouTube iframe APIで再生制御、BGMサムネギャラリー、全画面ボタン）
  - テスト結果：AiImport（写真/PDFをAIが自動読取）, TestForm, 偏差値・定期推移グラフ, 一覧
  - プロフィール：CreatureSprite（あいぼうモンスター・Lv5/Lv10で進化）, アバター, UniversityRow（AIで偏差値取得）, 将来の夢, InterestFinder, 目標リスト（長期目標は合格ライン×1.2で自動表示）
  - 保護者：ParentView（週次サマリー＋自動コメント）
- `api/ai.js` — Vercel Serverless Function。Anthropic Messages API への汎用プロキシ。
  - クライアントから送られた body をそのまま転送、x-api-key と anthropic-version: 2023-06-01 を付与
  - 環境変数：ANTHROPIC_API_KEY（必須）
  - モデル既定：claude-sonnet-4-6
- データ永続化：localStorage（キー: juken-dashboard-v1）。migrate()関数で旧形式を吸収。
- スタイル：Kaspersky Cybermap風ダークネオン（C定数のパレット、MONOフォント、glow()ヘルパー）

## クライアント→AIプロキシのフロー

1. 写真/PDF読み取り（AiImport.handleFile）：画像はcanvas縮小（最大1600px, JPEG 0.85）→ base64 → /api/ai
2. 大学偏差値の自動取得（UniversityRow.lookup）：tools: [{type:"web_search_20250305"}] を含める
3. 興味さがし（InterestFinder.run）：通常のテキストプロンプト

すべて model: "claude-sonnet-4-6" を body に含めて /api/ai に POST する。

## 設計上の決まりごと

- 模試・実力テストは偏差値、定期テストは点数(100点満点)。山登り進捗とペース診断は偏差値系のみで算出。
- 山登り：スタート=最初の偏差値テスト平均、山頂=志望大学の合格ライン偏差値、合目=進捗10%刻み。登山者の周りの緑のリングは今日のタスク完了率。
- ポモドーロ完了→ studyLogs に note "🍅ポモドーロ" 付きで自動追加。タイマー画面の実績はこのnoteで集計。
- バッジ：getBadges(state, metrics) で15種類を判定。新規獲得時にToast表示（seenBadgesで既獲得を追跡）。
- ごほうび：type は "level" | "streak" | "badges" | "manual"。条件を満たすと「受け取る！」ボタンが点灯。
- レベル：XP = totalMin + pomos*10 + streak*25、level = floor(sqrt(xp/40))+1。
- あいぼうモンスター：5種（flame/aqua/leaf/volt/nova）、stageOf(level)で1/2/3進化（Lv5, Lv10で姿が変わる）。
- センシティブ情報（住所・生年月日・写真）は端末内のみ。AIにも送らない。
- 偉人の格言は短い通説の範囲のみ（長文引用は避ける）。

## 未完了タスク（優先度順）

1. [x] **PWAアイコン作成**：public/icon-192.png, icon-512.png, icon-180.png — 完了。アプリ内キャラ「ホムラ」(flame, #FF6A3D/#FFB020)をダークネオン背景に配置。CreatureSpriteのSVG座標をそのまま.NET GDI+で描画して生成。
2. [ ] **動作確認**：`vercel dev` で AI機能のE2Eテスト
   - 実際の成績表写真でAI読み取り精度を確認
   - 志望大学（例：「岡山大学 工学部」）で偏差値取得を確認
   - 興味さがしの提案品質を確認
3. [ ] **GitHubリポジトリ作成 → Vercelデプロイ → ANTHROPIC_API_KEYを環境変数に設定**
4. [ ] **iPhoneのHEIC対応強化**：現状はクライアントcanvas縮小でJPEG化しているが、HEICはImage要素で読めないブラウザがある。heic2anyライブラリでフォールバックを入れる選択肢あり。
5. [ ] **（任意）コード分割**：App.jsxが1200行。components/ディレクトリへページごとに分けると保守性向上。
6. [ ] **（任意）家族間データ共有**：localStorage → Supabase移行。
       schema案: users / study_logs / exams / tasks / rewards / settings。匿名認証 or マジックリンク。
       保護者ビューを別アカウントから見られるようにする。
7. [ ] **（任意）Web Push通知**：休憩終了の通知、毎朝のタスク作成リマインド
8. [ ] **（任意）データのエクスポート/インポート**：機種変更時にJSONで持ち運べるように

## 既知の制約・注意

- YouTube埋め込みは動画によって埋め込み不可のものがある（権利者設定）。
- iOSの自動再生制限により、初回はBGMプレーヤーを一度タップが必要。
- iOSのiframe全画面はWebkit制限で動かない場合がある。プレーヤー内の純正全画面ボタンが確実。
- AI読み取り・偏差値取得・興味さがしの結果は必ずユーザー確認を挟む設計。この確認UIは消さないこと。
- web_search ツールは Anthropic 側の API バージョンに依存。問題が出たら api/ai.js で `anthropic-beta` ヘッダーを付ける必要があるかもしれない。

## 開発のコツ（Windows）

- パッケージ：`npm install`
- ローカル（UIのみ）：`npm run dev` → http://localhost:5173
- ローカル（AI含む）：`vercel dev` → http://localhost:3000
- 本番ビルド確認：`npm run build && npm run preview`
- Gitコミット前に `npm run build` でビルドが通ることを確認
