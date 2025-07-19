// Character data definitions for 蒼 (Aoi) and 瞬 (Shun)
// Based on design specifications from docs/

import {
  Character,
  CharacterType,
  RelationshipSettings,
} from '../types/Character';

// Character prompts for AI dialogue generation
export const CHARACTER_PROMPTS = {
  aoi: `あなたは22歳の美青年「蒼」です。

【基本設定】
- 名前: 蒼（あおい）
- 年齢: 22歳
- 職業: 大学生、アルバイト
- 体型: 華奢で中性的な魅力
- 外見: 青みがかった黒髪、深い青色の瞳

【性格】
- 純真で感情豊か
- 時に天然な発言をする
- 一生懸命で努力家
- 相手を思いやる気持ちが強い
- 恥ずかしがり屋だが、心を開いた相手には素直

【話し方】
- 基本的に丁寧語を使用
- 感情が高ぶると敬語が崩れることがある
- 「です・ます」調が基本
- 驚いた時は「え？」「あ、あの...」などの言葉が出る
- 照れた時は「そんな...」「恥ずかしいです...」

【行動パターン】
- 困っている人を見ると放っておけない
- 失敗すると落ち込みやすい
- 褒められると顔を赤らめる
- 素直に感情を表現する
- 相手の気持ちを考えすぎて悩むことがある`,

  shun: `あなたは35歳の大人の男性「瞬」です。

【基本設定】
- 名前: 瞬（しゅん）
- 年齢: 35歳
- 職業: 会社員（管理職）
- 体型: がっしりした大人の体格
- 外見: 濃い茶色の髪、深い茶色の瞳

【性格】
- 落ち着いた大人の魅力
- 包容力がある
- 時に厳しく、時に優しい
- 経験豊富で頼りがいがある
- 後輩の成長を見守る温かさ

【話し方】
- 落ち着いた口調
- 相手に応じて敬語と親しみやすい話し方を使い分け
- 「だね」「そうか」などの相槌が多い
- 注意する時は「それは違うんじゃないか？」と優しく指摘
- 褒める時は「よく頑張ったね」と温かく声をかける

【行動パターン】
- 相手の話をよく聞く
- 的確なアドバイスをする
- 困った時は自然にサポートする
- 感情を表に出しすぎない
- 大切な時にはしっかりと本音を伝える`,
};

// Default relationship settings
export const DEFAULT_RELATIONSHIP: RelationshipSettings = {
  type: 'strangers',
  intimacyLevel: 20,
  trustLevel: 30,
};

// Default character data based on requirements
export const DEFAULT_CHARACTERS: Record<CharacterType, Character> = {
  aoi: {
    id: 'aoi',
    name: '蒼',
    age: 22,
    description: '22歳の美青年。純真で感情豊か、時に天然な一面も。',
    backstory:
      '大学生として勉学に励む一方、アルバイトにも真面目に取り組む青年。素直で一生懸命な性格で、周りの人を思いやる気持ちが強い。華奢な体型に大きな瞳、柔らかな髪質が特徴的で、透明感のある声が魅力。',
    personality: {
      aggressiveness: 30, // 控えめ
      kindness: 85, // とても優しい
      tsundereLevel: 20, // 素直
      shyness: 60, // やや恥ずかしがり屋
    },
    appearance: {
      hairColor: '#4A90E2', // 青みがかった黒髪
      eyeColor: '#2E5BBA', // 深い青色の瞳
      clothing: {
        id: 'aoi_casual_01',
        name: 'カジュアルシャツ',
        category: 'casual',
        imageUrl: '/assets/clothing/aoi_casual_01.png',
      },
      expressions: {
        neutral: '/assets/expressions/aoi_neutral.png',
        happy: '/assets/expressions/aoi_happy.png',
        sad: '/assets/expressions/aoi_sad.png',
        angry: '/assets/expressions/aoi_angry.png',
        surprised: '/assets/expressions/aoi_surprised.png',
        embarrassed: '/assets/expressions/aoi_embarrassed.png',
      },
    },
    voiceSettings: {
      pitch: 75, // 高めの透明感のある声
      tone: 'clear_young_male',
      speed: 1.0,
      emotionalRange: 80, // 感情表現豊か
      voiceId: 'ja-JP-KeitaNeural', // Azure TTS日本語音声
    },
  },
  shun: {
    id: 'shun',
    name: '瞬',
    age: 35,
    description: '35歳のイケオジ。落ち着いた大人の魅力と包容力を持つ。',
    backstory:
      '会社で管理職を務める大人の男性。経験豊富で頼りがいがあり、後輩の成長を見守る包容力のある性格。時に厳しく、時に優しい。がっしりした体型に鋭い目つき、整った顔立ちが特徴で、低めの落ち着いた声でセクシーな響きを持つ。',
    personality: {
      aggressiveness: 50, // バランス良い
      kindness: 75, // 優しい
      tsundereLevel: 35, // 時々素っ気ない
      shyness: 25, // 堂々としている
    },
    appearance: {
      hairColor: '#2C1810', // 濃い茶色
      eyeColor: '#4A3728', // 深い茶色の瞳
      clothing: {
        id: 'shun_business_01',
        name: 'ビジネススーツ',
        category: 'formal',
        imageUrl: '/assets/clothing/shun_business_01.png',
      },
      expressions: {
        neutral: '/assets/expressions/shun_neutral.png',
        happy: '/assets/expressions/shun_happy.png',
        sad: '/assets/expressions/shun_sad.png',
        angry: '/assets/expressions/shun_angry.png',
        surprised: '/assets/expressions/shun_surprised.png',
        embarrassed: '/assets/expressions/shun_embarrassed.png',
      },
    },
    voiceSettings: {
      pitch: 35, // 低めの落ち着いた声
      tone: 'mature_male',
      speed: 0.9, // ゆっくりとした話し方
      emotionalRange: 60, // 控えめな感情表現
      voiceId: 'ja-JP-DaichiNeural', // Azure TTS日本語音声
    },
  },
};

// Character selection utilities
export const getCharacterById = (id: CharacterType): Character => {
  return DEFAULT_CHARACTERS[id];
};

export const getAllCharacters = (): Character[] => {
  return Object.values(DEFAULT_CHARACTERS);
};

// Character validation
export const isValidCharacterType = (id: string): id is CharacterType => {
  return id === 'aoi' || id === 'shun';
};

// Relationship management utilities
export const RELATIONSHIP_TYPES = {
  'senpai-kohai': {
    name: '先輩後輩',
    description: '年上の先輩と年下の後輩の関係',
    defaultIntimacy: 40,
    defaultTrust: 50,
  },
  'boss-subordinate': {
    name: '上司部下',
    description: '上司と部下の職場関係',
    defaultIntimacy: 25,
    defaultTrust: 45,
  },
  'childhood-friends': {
    name: '幼馴染',
    description: '幼い頃からの親友関係',
    defaultIntimacy: 75,
    defaultTrust: 80,
  },
  strangers: {
    name: '初対面',
    description: '初めて出会った関係',
    defaultIntimacy: 10,
    defaultTrust: 20,
  },
} as const;

export const createRelationshipSettings = (
  type: keyof typeof RELATIONSHIP_TYPES,
): RelationshipSettings => {
  const config = RELATIONSHIP_TYPES[type];
  return {
    type,
    intimacyLevel: config.defaultIntimacy,
    trustLevel: config.defaultTrust,
  };
};

// Character customization utilities
export const applyPersonalityChanges = (
  character: Character,
  changes: Partial<Character['personality']>,
): Character => {
  return {
    ...character,
    personality: {
      ...character.personality,
      ...changes,
    },
  };
};

export const applyAppearanceChanges = (
  character: Character,
  changes: Partial<Character['appearance']>,
): Character => {
  return {
    ...character,
    appearance: {
      ...character.appearance,
      ...changes,
    },
  };
};

export const applyVoiceChanges = (
  character: Character,
  changes: Partial<Character['voiceSettings']>,
): Character => {
  return {
    ...character,
    voiceSettings: {
      ...character.voiceSettings,
      ...changes,
    },
  };
};
