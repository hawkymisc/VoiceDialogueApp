# Voice Dialogue App

AIが生成する美青年とイケオジキャラクターの自然な掛け合いを、リアルタイム音声生成とLive2Dアニメーションで楽しめるインタラクティブReact Nativeアプリです。

## 概要

Voice Dialogueは、腐女子・BLコンテンツ愛好者をターゲットとした革新的なインタラクティブ体験アプリです。OpenAI GPT-4による自然な対話生成、Azure Cognitive ServicesやVOICEVOXによる高品質な音声合成、Live2Dによる美麗なビジュアル表現を組み合わせ、まるで現実のキャラクターと会話しているような没入感のある体験を提供します。

## 主要機能

### 🎭 キャラクターシステム
- **蒼（Aoi）**: 22歳美青年キャラクター - 純真、感情豊か、時に天然
- **瞬（Shun）**: 35歳イケオジキャラクター - 落ち着いた大人の魅力、包容力
- カスタマイズ可能な性格、外見、音声設定
- 動的な関係性システム（先輩後輩、上司部下、幼馴染など）

### 🤖 AI対話システム
- OpenAI GPT-4による自然で感情豊かな対話生成
- 感情分析による文脈理解
- 過去の会話履歴を参考にした学習機能
- ユーザーの好みに適応する機能

### 🎵 音声・ビジュアル技術
- Azure Cognitive Services Speech APIによる日本語TTS
- 感情表現に対応したSSML制御
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
- **OpenAI GPT-4 API** - 対話生成
- **Azure Cognitive Services Speech** - 音声合成
- **VOICEVOX API** - 日本語音声生成
- **Hugging Face Transformers** - 感情分析

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
- React Native CLI
- iOS: Xcode 14+, CocoaPods
- Android: Android Studio, Java 11+

### インストール

```bash
# 依存関係のインストール
npm install

# iOS用Podインストール
cd ios && pod install && cd ..

# 開発サーバー起動
npm run start

# iOS実行
npm run ios

# Android実行
npm run android
```

### 環境変数

`.env`ファイルを作成し、以下の値を設定：

```env
OPENAI_API_KEY=your_openai_api_key
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_azure_region
VOICEVOX_API_URL=http://localhost:50021
```

## 開発コマンド

```bash
# 開発サーバー起動
npm run start

# アプリ実行
npm run ios        # iOS
npm run android    # Android

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

## セキュリティ・コンプライアンス

### データ保護
- ユーザーデータの暗号化（AES-256）
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