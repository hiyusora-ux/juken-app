# Windows PC で続きを始める手順

## 1. このZIPを展開

ダウンロードしたZIPを好きな場所（例：`C:\dev\juken-app`）に展開。

## 2. 必要なソフトをインストール

| ツール | 用途 | リンク |
|---|---|---|
| Node.js LTS | ビルド・実行 | https://nodejs.org/ja |
| Git for Windows | GitHub連携 | https://git-scm.com/download/win |
| Claude Code | AI開発アシスタント | 下記コマンドで |

コマンドプロンプト（または PowerShell）で：

```powershell
node --version          # v20以上が表示されればOK
git --version
npm install -g @anthropic-ai/claude-code
```

## 3. プロジェクトを開いて Claude Code を起動

```powershell
cd C:\dev\juken-app
npm install
claude                  # Claude Code を対話モードで起動
```

最初の起動でブラウザが開き、Anthropic アカウントでログインを求められます。完了するとプロジェクトフォルダに対する対話が始まります。

## 4. 続きの作業を Claude Code に依頼

Claude Code のプロンプトに、たとえばこう打ち込めば文脈を理解した状態で始まります：

```
CLAUDE.mdを読んで、未完了タスクの状況を教えて。最初に取りかかるのは1番（PWAアイコン作成）と3番（Vercelデプロイ）が良さそう。一緒に進めて。
```

Claude Code は `CLAUDE.md` の引き継ぎ情報をもとに、ファイル編集・コマンド実行（許可確認あり）・GitHub操作などを自動でやってくれます。

## 5. ローカルで動作確認

```powershell
npm run dev             # UIだけ動かしたい場合（http://localhost:5173）
```

AI機能（写真読み取りなど）も動かしたい場合：

```powershell
npm install -g vercel
vercel link             # 初回のみ。指示に従ってVercelプロジェクトに紐づけ
vercel env add ANTHROPIC_API_KEY  # APIキーを登録
vercel dev              # http://localhost:3000 でフロント＋APIが両方動く
```

APIキーは https://console.anthropic.com/settings/keys で発行。

## 6. デプロイ

Claude Code に「GitHubにpushしてVercelでデプロイしたい」と言えば、`gh` CLI と `vercel` CLI を使って一連の作業をやってくれます。

GitHub CLI のインストール（必要なら）：
```powershell
winget install GitHub.cli
gh auth login
```

## 困ったら

- `npm install` でエラー：Node.js を再インストール、もしくは `npm cache clean --force` の後に再実行
- Claude Code が起動しない：`npm install -g @anthropic-ai/claude-code` をもう一度
- ビルドエラー：`npm run build` のエラーメッセージを Claude Code に貼って相談
