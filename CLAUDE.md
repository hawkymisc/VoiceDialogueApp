# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 開発コマンド

### ビルドとテスト
```bash
# React Native開発サーバー起動
npm run start

# iOSアプリ実行
npm run ios

# Androidアプリ実行
npm run android

# テスト実行
npm run test

# TypeScript型チェック
npm run typecheck

# ESLintチェック
npm run lint
```

## アーキテクチャ概要

Voice Dialogueは、AIが生成する美青年とイケオジキャラクターの自然な掛け合いを、リアルタイム音声生成とLive2Dアニメーションで楽しめるインタラクティブReact Nativeアプリです。腐女子・BLコンテンツ愛好者をターゲットとしています。

### 技術スタック

#### フロントエンド
- **フレームワーク**: React Native 0.72.15
- **ナビゲーション**: React Navigation (Stack Navigator)
- **状態管理**: Redux Toolkit
- **型定義**: TypeScript
- **UI**: React Native Elements
- **音声再生**: React Native Sound
- **アニメーション**: Live2D Cubism SDK for React Native

#### AI・音声技術
- **対話生成AI**: OpenAI GPT-4 API（日本語プロンプト対応）
- **音声合成**: Azure Cognitive Services Speech（日本語音声）または VOICEVOX API
- **感情分析**: Hugging Face Transformers（日本語BERT系モデル）

#### バックエンド・インフラ
- **API サーバー**: Node.js with Express
- **AI 推論**: Python FastAPI
- **データベース**: PostgreSQL
- **キャッシュ**: Redis
- **ファイルストレージ**: AWS S3
- **クラウド**: AWS
- **コンテナ**: Docker + Kubernetes

### ディレクトリ構造

#### `/src/types/`
型定義の中心部分：
- `Character.ts`: キャラクター、性格、外見、音声設定の型
- `Dialogue.ts`: 対話、感情状態、シナリオの型
- `Audio.ts`: 音声再生・制御の型
- `User.ts`: ユーザー設定・履歴の型
- `Api.ts`: API通信の型

#### `/src/store/`
Redux Toolkitベースの状態管理：
- `store.ts`: メインストア設定
- `slices/`: 各機能別のslice
  - `characterSlice.ts`: キャラクター状態管理
  - `dialogueSlice.ts`: 対話状態管理
  - `audioSlice.ts`: 音声制御
  - `userSlice.ts`: ユーザー設定

#### `/src/components/`
再利用可能なコンポーネント：
- `CharacterDisplay.tsx`: キャラクター表示・Live2Dアニメーション
- `CharacterSelector.tsx`: キャラクター選択UI
- `DialogueInterface.tsx`: 対話インターフェース
- `AudioController.tsx`: 音声制御・TTS機能
- `CustomSlider.tsx`: カスタムスライダー

#### `/src/services/`
外部API統合サービス：
- `openaiService.ts`: OpenAI GPT-4 API統合
- `ttsService.ts`: Azure TTS / VOICEVOX API統合
- `emotionService.ts`: 感情分析機能
- `live2dService.ts`: Live2D統合サービス

#### `/src/screens/`
画面コンポーネント：
- `HomeScreen.tsx`: メイン画面
- `CharacterCustomizationScreen.tsx`: キャラクターカスタマイゼーション
- `DialogueScreen.tsx`: 対話画面
- `SettingsScreen.tsx`: 設定画面

### キャラクターシステム

#### メインキャラクター
- **蒼（Aoi）**: 22歳美青年キャラクター
  - 性格: 純真、感情豊か、時に天然、一生懸命
  - 声質: 高めの透明感のある声（ja-JP-KeitaNeural使用）
  - 外見: 華奢な体型、大きな瞳、柔らかな髪質
  
- **瞬（Shun）**: 35歳イケオジキャラクター
  - 性格: 落ち着いた大人の魅力、包容力、時に厳しく時に優しい
  - 声質: 低めの落ち着いた声（ja-JP-DaichiNeural使用）
  - 外見: がっしりした体型、鋭い目つき、整った顔立ち

#### カスタマイゼーション機能
- 性格パラメータ（積極性、優しさ、ツンデレ度、照れやすさ）
- 外見設定（髪色、服装、表情パターン）
- 音声設定（ピッチ、トーン、速度、感情表現範囲）
- 関係性設定（先輩後輩、上司部下、幼馴染など）

### 対話システム

#### シナリオカテゴリ
- **日常会話**: 朝の挨拶、食事、趣味の話
- **仕事シーン**: オフィス、会議、残業
- **特別イベント**: 誕生日、記念日、季節イベント
- **感情的シーン**: 励まし、慰め、告白（匂わせ）
- **コメディシーン**: 天然ボケ、ツッコミ、ドタバタ

#### AI統合機能
- OpenAI GPT-4による自然な対話生成
- 感情分析による文脈理解
- 過去の会話履歴を参考にした学習機能
- ユーザーの好みに適応する機能

### 音声・ビジュアル技術

#### 音声合成
- Azure Cognitive Services Speech APIによる日本語TTS
- 感情表現に対応したSSML制御
- キャラクター固有の音声パラメータ設定
- 息遣い、笑い声、ため息などの自然な演出

#### Live2Dアニメーション
- Live2D Cubism SDKによる2.5次元表現
- 感情に応じた表情変化
- リップシンク機能（音声と口パク同期）
- 身振り手振りアニメーション

### 継続利用促進機能

#### 日替わりコンテンツ
- 日替わりシナリオ生成
- 季節限定イベント
- 新しい衣装・背景のアンロック
- キャラクター成長システム

#### コミュニティ機能
- お気に入り会話の保存・共有
- ユーザー間の評価システム
- 二次創作投稿機能（テキスト）

### セキュリティ・コンプライアンス

#### データ保護
- ユーザーデータの暗号化（AES-256）
- プライバシー保護対応
- セキュアなAPI通信

#### コンテンツ管理
- 不適切コンテンツの自動フィルタリング
- 年齢制限の適切な設定
- 各国の規制に対応した内容調整

### 重要な設計パターン

1. **型安全性**: 全コンポーネントでTypeScript型定義を徹底
2. **状態の正規化**: Redux Toolkitで状態を機能別に分離
3. **コンポーネント分離**: UI要素を小さな再利用可能な単位に分割
4. **エクスポート統一**: `index.ts`ファイルで各モジュールのエクスポートを統一
5. **エラーハンドリング**: 包括的なエラー処理とユーザーフレンドリーなメッセージ
6. **パフォーマンス最適化**: 音声キャッシュ、Live2D最適化、メモリ管理

### 要件対応

このアプリケーションは8つの主要要件に対応：
1. キャラクター交流システム
2. 自然な会話生成
3. リアルタイム音声合成
4. Live2Dビジュアル表現
5. ユーザーカスタマイゼーション
6. お気に入り保存・共有
7. 継続利用促進機能
8. セキュリティ・コンプライアンス