# Voice Dialogue App

**🆓 完全無料で始められる** AIキャラクター対話アプリ！美青年とイケオジキャラクターとの自然な掛け合いを、リアルタイム音声生成とLive2Dアニメーションで楽しめるインタラクティブReact Nativeアプリです。

## ✨ 主な特徴

- 🆓 **完全無料版あり**: Gemini API + Web Speech で無料体験
- 🔄 **簡単切り替え**: 環境変数だけでAI・音声プロバイダー変更
- 🌐 **Web対応**: ブラウザで即座に動作、インストール不要
- 🎭 **2キャラクター**: 蒼（美青年）・瞬（イケオジ）の魅力的な対話
- 🗣️ **3段階TTS**: Web Speech（無料）→ VOICEVOX（高品質）→ Azure（最高品質）

## 概要

Voice Dialogueは、腐女子・BLコンテンツ愛好者をターゲットとした革新的なインタラクティブ体験アプリです。**Google Gemini**（無料）や**OpenAI GPT-4**による自然な対話生成、**Web Speech API**（無料）、**VOICEVOX**（無料）、**Azure Cognitive Services**による高品質な音声合成、Live2Dによる美麗なビジュアル表現を組み合わせ、まるで現実のキャラクターと会話しているような没入感のある体験を提供します。

## 主要機能

### 🎭 キャラクターシステム
- **蒼（Aoi）**: 22歳美青年キャラクター - 純真、感情豊か、時に天然
- **瞬（Shun）**: 35歳イケオジキャラクター - 落ち着いた大人の魅力、包容力
- カスタマイズ可能な性格、外見、音声設定
- 動的な関係性システム（先輩後輩、上司部下、幼馴染など）

### 🤖 AI対話システム
- **複数のLLMプロバイダー対応**: Google Gemini（無料）/ OpenAI GPT-4（有料）
- **環境変数で簡単切り替え**: `.env`ファイルで瞬時にプロバイダー変更
- 感情分析による文脈理解とキャラクター性格再現
- 過去の会話履歴を参考にした学習機能
- ユーザーの好みに適応する機能

### 🎵 音声・ビジュアル技術
- **複数のTTSプロバイダー対応**: Web Speech API（無料）/ VOICEVOX（無料）/ Azure TTS（有料）
- **感情表現対応**: 音程・速度・イントネーション自動調整
- **キャラクター別音声**: 蒼（高音・透明感）/ 瞬（低音・落ち着き）
- Live2D Cubism SDKによる2.5次元表現
- リップシンク機能（音声と口パク同期）

### 📱 継続利用促進機能
- 日替わりシナリオ生成
- 季節限定イベント
- キャラクター成長システム
- コミュニティ機能（お気に入り会話の共有）

## 技術スタック

### フロントエンド
- **React Native** 0.72.15
- **Redux Toolkit** - 状態管理
- **TypeScript** - 型安全性
- **React Navigation** - ナビゲーション
- **Live2D Cubism SDK** - アニメーション

### AI・音声技術
- **Google Gemini Pro API** - 対話生成（無料枠あり・推奨）
- **OpenAI GPT-4 API** - 対話生成（有料）
- **Web Speech API** - ブラウザ内蔵TTS（無料・推奨）
- **VOICEVOX API** - 高品質日本語TTS（無料）
- **Azure Cognitive Services Speech** - 最高品質TTS（有料）
- **自動プロバイダー切り替え** - 環境変数制御

### バックエンド・インフラ
- **Node.js + Express** - APIサーバー
- **Python FastAPI** - AI推論
- **PostgreSQL** - データベース
- **Redis** - キャッシュ
- **AWS S3** - ファイルストレージ
- **Docker + Kubernetes** - コンテナ化

## 開発環境セットアップ

### 前提条件
- Node.js 18.x 以上
- **Web開発**: ブラウザ環境（推奨）
- **モバイル開発**: React Native CLI, iOS: Xcode 14+, CocoaPods, Android: Android Studio, Java 11+

### インストール

```bash
# 依存関係のインストール
npm install

# Web開発環境起動（推奨）
npm run web

# モバイル開発の場合
# iOS用Podインストール
cd ios && pod install && cd ..

# 開発サーバー起動
npm run start

# iOS実行
npm run ios

# Android実行
npm run android
```

## 🔧 API設定ガイド

### クイックスタート（完全無料）

最も簡単な設定で、すぐにアプリを体験できます：

```bash
# 1. Gemini API キー取得（無料）
# https://makersuite.google.com/app/apikey

# 2. .envファイル作成
echo "LLM_PROVIDER=gemini" > .env
echo "GEMINI_API_KEY=your-gemini-api-key-here" >> .env
echo "TTS_PROVIDER=web-speech" >> .env

# 3. アプリ起動
npm run build:web
npx serve web-build -p 3001
```

### 📋 API取得手順

#### **Google Gemini API（無料・推奨）**
1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. Googleアカウントでログイン
3. "Create API Key" クリック
4. 生成されたキーをコピー

**無料枠**: 月60リクエスト/分、100万トークン/月

#### **OpenAI API（有料）**
1. [OpenAI Platform](https://platform.openai.com/api-keys) にアクセス
2. アカウント作成・ログイン
3. "Create new secret key" クリック
4. 生成されたキー（sk-で始まる）をコピー

**料金**: GPT-3.5-turbo $0.002/1Kトークン

### 🎵 音声合成（TTS）設定

#### **Web Speech API（無料・推奨）**
設定不要！ブラウザ内蔵機能を使用
```env
TTS_PROVIDER=web-speech
```

#### **VOICEVOX（無料・高品質）**
1. [VOICEVOX](https://voicevox.hiroshiba.jp/) をダウンロード・インストール
2. アプリケーション起動（ポート50021で自動起動）
3. 環境変数設定：
```env
TTS_PROVIDER=voicevox
VOICEVOX_API_URL=http://localhost:50021
```

#### **Azure Cognitive Services（有料・最高品質）**
1. [Azure Portal](https://portal.azure.com/) でアカウント作成
2. "Cognitive Services" → "Speech" リソース作成
3. キーとリージョンを取得
4. 環境変数設定：
```env
TTS_PROVIDER=azure
AZURE_SPEECH_KEY=your-azure-speech-key
AZURE_SPEECH_REGION=japaneast
```

### 📄 完全な.env設定例

```env
# === LLM設定 ===
# プロバイダー選択: 'gemini' または 'openai'
LLM_PROVIDER=gemini

# Gemini設定（推奨・無料）
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-pro

# OpenAI設定（有料）
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo

# === TTS設定 ===
# プロバイダー選択: 'web-speech', 'voicevox', または 'azure'
TTS_PROVIDER=web-speech

# VOICEVOX設定（無料・高品質）
VOICEVOX_API_URL=http://localhost:50021

# Azure TTS設定（有料・最高品質）
AZURE_SPEECH_KEY=your-azure-speech-key
AZURE_SPEECH_REGION=japaneast
```

### 💰 コスト比較

| プロバイダー | LLM | TTS | 月額目安 | 特徴 |
|---|---|---|---|---|
| **推奨無料構成** | Gemini | Web Speech | **¥0** | すぐ始められる |
| 高品質無料構成 | Gemini | VOICEVOX | **¥0** | 音声品質向上 |
| 標準有料構成 | OpenAI | Azure TTS | **¥1,000~** | バランス型 |
| プレミアム構成 | OpenAI | Azure TTS | **¥3,000~** | 最高品質 |

### 🔄 プロバイダー切り替え

アプリを再起動せずに、`.env`ファイル編集だけで瞬時に切り替え可能：

```bash
# Gemini → OpenAI に切り替え
sed -i '' 's/LLM_PROVIDER=gemini/LLM_PROVIDER=openai/' .env

# Web Speech → VOICEVOX に切り替え  
sed -i '' 's/TTS_PROVIDER=web-speech/TTS_PROVIDER=voicevox/' .env

# 変更を反映（ページリロード）
```

### ⚠️ 注意事項

**Web開発環境について:**
- `npm run web` でWebブラウザ上での開発が可能（http://localhost:3001）
- Live2D、ファイルシステムは制限されたモック実装
- **音声・対話機能は完全動作**（実用的）
- 実際のLive2Dアニメーション機能はモバイル環境で確認

**React Native モバイル開発:**
- iOS/Androidディレクトリは未セットアップ（将来対応予定）
- Live2D、TTS、ネイティブ機能の完全版

**APIキー管理:**
- `.env`ファイルをGitにコミットしない
- APIキーは秘密情報として厳重管理
- 使用量を定期的に監視

## 開発コマンド

```bash
# Web開発環境（推奨）
npm run web         # Webブラウザで開発
npm run build:web   # Webビルド

# React Native開発
npm run start       # Metro開発サーバー起動
npm run ios         # iOS実行
npm run android     # Android実行

# テスト実行
npm run test              # 単体テスト
npm run test:integration  # 統合テスト
npm run test:all         # 全テスト

# コード品質チェック
npm run typecheck   # TypeScript型チェック
npm run lint       # ESLintチェック
```

## プロジェクト構造

```
src/
├── components/     # 再利用可能コンポーネント
├── screens/       # 画面コンポーネント
├── store/         # Redux状態管理
├── services/      # 外部API統合
├── types/         # TypeScript型定義
├── utils/         # ユーティリティ関数
└── __tests__/     # テストファイル
```

## テスト

### 現在のテスト状況

✅ **16個のテストスイート成功**  
✅ **537個のテスト通過**  
⚠️ 22個のテストスイート修正中

### テストカテゴリ

- **単体テスト**: コンポーネント、サービス、ユーティリティ
- **統合テスト**: API統合、サービス間連携
- **E2Eテスト**: ユーザーシナリオ（開発中）

### テスト実行

```bash
# 全テスト実行
npm run test

# 特定テスト実行
npm run test -- --testPathPattern="validation"

# カバレッジ付きテスト
npm run test -- --coverage

# 監視モード
npm run test -- --watch
```

## 🚨 トラブルシューティング

### よくある問題と解決法

#### **「サービス初期化エラー」が表示される**
```bash
# 1. .envファイルの確認
cat .env

# 2. APIキーの形式確認
# Gemini: 正常な形式で39文字
# OpenAI: sk-で始まる文字列

# 3. プロバイダー設定確認
echo "LLM_PROVIDER=gemini" >> .env
```

#### **音声が再生されない**
```bash
# Web Speech使用時
TTS_PROVIDER=web-speech

# VOICEVOX使用時：アプリが起動しているか確認
curl http://localhost:50021/version

# Azure使用時：キーとリージョン確認
AZURE_SPEECH_REGION=japaneast  # 正しいリージョン名
```

#### **対話が応答しない**
1. ブラウザのConsoleログを確認
2. APIキーの使用量上限を確認  
3. ネットワーク接続を確認
4. プロバイダーを切り替えて試行

#### **Web画面が真っ白**
```bash
# キャッシュクリア
Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

# サーバー再起動
pkill -f serve
npm run build:web
npx serve web-build -p 3001
```

### 🆘 緊急時のフォールバック設定

完全無料でAPIキー不要：

```env
# 最小限設定（デモ用）
LLM_PROVIDER=gemini
GEMINI_API_KEY=demo-key-for-testing
TTS_PROVIDER=web-speech
```

> アプリは適切にエラーハンドリングし、APIが利用不可の場合はフォールバック応答を返します。

## セキュリティ・コンプライアンス

### データ保護
- ユーザーデータの暗号化（AES-256）
- APIキーの安全な管理（環境変数）
- プライバシー保護対応
- セキュアなAPI通信

### コンテンツ管理
- 不適切コンテンツの自動フィルタリング
- 年齢制限の適切な設定
- 各国の規制に対応した内容調整

## ライセンス

このプロジェクトは開発中です。商用利用については別途ライセンス契約が必要です。

## 貢献

現在はクローズドな開発段階です。貢献ガイドラインは後日公開予定です。

## サポート

技術的な問題やフィードバックは Issue または開発チームまでお知らせください。

---

**注意**: このアプリは18歳以上のユーザーを対象としています。適切な年齢確認と利用規約への同意が必要です。