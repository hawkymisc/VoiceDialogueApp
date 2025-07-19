// Scenario definitions for dialogue generation
import {DialogueScenario} from '../types/Dialogue';
import {Scenario, ScenarioTemplate, ScenarioCollection, CharacterType} from '../types/Scenario';

export const SCENARIO_CATEGORIES = {
  daily: {
    name: '日常会話',
    description: '普段の何気ない会話',
    icon: '💬',
    color: '#4A90E2',
  },
  work: {
    name: '仕事シーン',
    description: '職場や勉強での会話',
    icon: '💼',
    color: '#5CB85C',
  },
  romance: {
    name: 'ロマンス',
    description: '恋愛に関する会話',
    icon: '💕',
    color: '#E91E63',
  },
  comedy: {
    name: 'コメディ',
    description: '面白い・楽しい会話',
    icon: '😄',
    color: '#FF9800',
  },
  drama: {
    name: 'ドラマ',
    description: '感情的な深い会話',
    icon: '🎭',
    color: '#9C27B0',
  },
  special: {
    name: '特別イベント',
    description: '季節や記念日の会話',
    icon: '🎉',
    color: '#F44336',
  },
} as const;

export const DEFAULT_SCENARIOS: DialogueScenario[] = [
  // 日常会話
  {
    id: 'daily_morning',
    category: 'daily',
    title: '朝の挨拶',
    description: '朝の何気ない会話',
    initialPrompt: '今日も一日お疲れ様です。',
    tags: ['morning', 'greeting', 'casual'],
    difficulty: 'easy',
    contextSettings: {
      timeOfDay: 'morning',
      location: 'home',
      mood: 'neutral',
    },
  },
  {
    id: 'daily_weather',
    category: 'daily',
    title: '天気の話',
    description: '天気について話す',
    initialPrompt: '今日はいい天気ですね。',
    tags: ['weather', 'casual', 'small-talk'],
    difficulty: 'easy',
    contextSettings: {
      timeOfDay: 'any',
      location: 'any',
      mood: 'neutral',
    },
  },
  {
    id: 'daily_food',
    category: 'daily',
    title: '食事の話',
    description: '好きな食べ物や料理について',
    initialPrompt: 'お腹が空きましたね。何か食べませんか？',
    tags: ['food', 'casual', 'preferences'],
    difficulty: 'easy',
    contextSettings: {
      timeOfDay: 'any',
      location: 'any',
      mood: 'friendly',
    },
  },

  // 仕事シーン
  {
    id: 'work_project',
    category: 'work',
    title: 'プロジェクトの相談',
    description: '仕事のプロジェクトについて相談',
    initialPrompt: '今度のプロジェクトのことで相談があるんです。',
    tags: ['work', 'consultation', 'professional'],
    difficulty: 'medium',
    contextSettings: {
      timeOfDay: 'work-hours',
      location: 'office',
      mood: 'serious',
    },
  },
  {
    id: 'work_break',
    category: 'work',
    title: '休憩時間',
    description: '仕事の休憩時間の会話',
    initialPrompt: 'お疲れ様です。少し休憩しませんか？',
    tags: ['break', 'casual', 'relaxing'],
    difficulty: 'easy',
    contextSettings: {
      timeOfDay: 'work-hours',
      location: 'office',
      mood: 'relaxed',
    },
  },
  {
    id: 'work_overtime',
    category: 'work',
    title: '残業時間',
    description: '残業中の会話',
    initialPrompt: '今日も遅くまでお疲れ様です。',
    tags: ['overtime', 'tired', 'support'],
    difficulty: 'medium',
    contextSettings: {
      timeOfDay: 'evening',
      location: 'office',
      mood: 'tired',
    },
  },

  // ロマンス
  {
    id: 'romance_confession',
    category: 'romance',
    title: '告白シーン',
    description: '気持ちを伝える大切な場面',
    initialPrompt: '実は、あなたに伝えたいことがあるんです。',
    tags: ['confession', 'romantic', 'emotional'],
    difficulty: 'hard',
    contextSettings: {
      timeOfDay: 'evening',
      location: 'private',
      mood: 'nervous',
    },
  },
  {
    id: 'romance_date',
    category: 'romance',
    title: 'デートの誘い',
    description: 'デートに誘う場面',
    initialPrompt: '今度の休みに、一緒に出かけませんか？',
    tags: ['date', 'invitation', 'romantic'],
    difficulty: 'medium',
    contextSettings: {
      timeOfDay: 'any',
      location: 'any',
      mood: 'hopeful',
    },
  },
  {
    id: 'romance_jealousy',
    category: 'romance',
    title: '嫉妬シーン',
    description: '少し嫉妬してしまう場面',
    initialPrompt: '最近、他の人とよく話していますね...',
    tags: ['jealousy', 'emotional', 'complex'],
    difficulty: 'hard',
    contextSettings: {
      timeOfDay: 'any',
      location: 'any',
      mood: 'conflicted',
    },
  },

  // コメディ
  {
    id: 'comedy_mistake',
    category: 'comedy',
    title: 'おっちょこちょい',
    description: '失敗を笑いに変える場面',
    initialPrompt: 'あ、また失敗してしまいました...',
    tags: ['mistake', 'funny', 'embarrassing'],
    difficulty: 'easy',
    contextSettings: {
      timeOfDay: 'any',
      location: 'any',
      mood: 'embarrassed',
    },
  },
  {
    id: 'comedy_misunderstanding',
    category: 'comedy',
    title: '勘違い',
    description: '面白い勘違いから始まる会話',
    initialPrompt: 'え？それってそういう意味だったんですか？',
    tags: ['misunderstanding', 'funny', 'surprise'],
    difficulty: 'medium',
    contextSettings: {
      timeOfDay: 'any',
      location: 'any',
      mood: 'confused',
    },
  },

  // ドラマ
  {
    id: 'drama_comfort',
    category: 'drama',
    title: '慰めのシーン',
    description: '落ち込んでいる時の支え合い',
    initialPrompt: '今日はなんだか疲れてしまいました...',
    tags: ['comfort', 'emotional', 'support'],
    difficulty: 'medium',
    contextSettings: {
      timeOfDay: 'evening',
      location: 'private',
      mood: 'sad',
    },
  },
  {
    id: 'drama_conflict',
    category: 'drama',
    title: '意見の対立',
    description: '考えの違いから生まれる会話',
    initialPrompt: 'その考えは少し違うと思うんです。',
    tags: ['conflict', 'discussion', 'serious'],
    difficulty: 'hard',
    contextSettings: {
      timeOfDay: 'any',
      location: 'any',
      mood: 'tense',
    },
  },

  // 特別イベント
  {
    id: 'special_birthday',
    category: 'special',
    title: '誕生日のお祝い',
    description: '誕生日を祝う特別な会話',
    initialPrompt: 'お誕生日おめでとうございます！',
    tags: ['birthday', 'celebration', 'special'],
    difficulty: 'easy',
    contextSettings: {
      timeOfDay: 'any',
      location: 'any',
      mood: 'happy',
    },
  },
  {
    id: 'special_christmas',
    category: 'special',
    title: 'クリスマス',
    description: 'クリスマスの特別な時間',
    initialPrompt: 'メリークリスマス！素敵な夜ですね。',
    tags: ['christmas', 'romantic', 'special'],
    difficulty: 'medium',
    contextSettings: {
      timeOfDay: 'evening',
      location: 'any',
      mood: 'romantic',
    },
  },
  {
    id: 'special_new_year',
    category: 'special',
    title: '新年の挨拶',
    description: '新年を迎える特別な会話',
    initialPrompt: 'あけましておめでとうございます！',
    tags: ['new-year', 'celebration', 'fresh-start'],
    difficulty: 'easy',
    contextSettings: {
      timeOfDay: 'any',
      location: 'any',
      mood: 'hopeful',
    },
  },
];

// Scenario utility functions
export const getScenariosByCategory = (category: string): DialogueScenario[] => {
  return DEFAULT_SCENARIOS.filter(scenario => scenario.category === category);
};

export const getScenarioById = (id: string): DialogueScenario | undefined => {
  return DEFAULT_SCENARIOS.find(scenario => scenario.id === id);
};

export const getRandomScenario = (category?: string): DialogueScenario => {
  const scenarios = category 
    ? getScenariosByCategory(category)
    : DEFAULT_SCENARIOS;
  
  const randomIndex = Math.floor(Math.random() * scenarios.length);
  return scenarios[randomIndex];
};

export const getScenariosByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): DialogueScenario[] => {
  return DEFAULT_SCENARIOS.filter(scenario => scenario.difficulty === difficulty);
};

export const getScenariosByTags = (tags: string[]): DialogueScenario[] => {
  return DEFAULT_SCENARIOS.filter(scenario => 
    scenario.tags.some(tag => tags.includes(tag))
  );
};

export const searchScenarios = (query: string): DialogueScenario[] => {
  if (!query || query.trim() === '') {
    return [];
  }
  
  const lowercaseQuery = query.toLowerCase();
  return DEFAULT_SCENARIOS.filter(scenario => 
    scenario.title.toLowerCase().includes(lowercaseQuery) ||
    scenario.description.toLowerCase().includes(lowercaseQuery) ||
    scenario.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};

// New enhanced scenarios for the scenario service
export const ENHANCED_SCENARIOS: Scenario[] = DEFAULT_SCENARIOS.map((scenario, index) => ({
  id: scenario.id,
  title: scenario.title,
  description: scenario.description,
  category: scenario.category as any,
  difficulty: scenario.difficulty === 'easy' ? 'beginner' : scenario.difficulty === 'medium' ? 'intermediate' : 'advanced',
  tags: scenario.tags as any[],
  compatible_characters: ['aoi', 'shun'] as CharacterType[],
  recommended_character: index % 2 === 0 ? 'aoi' : 'shun',
  context: {
    location: scenario.contextSettings.location,
    timeOfDay: scenario.contextSettings.timeOfDay as any,
    mood: scenario.contextSettings.mood as any,
    relationship_stage: 'friend',
  },
  setting_description: `${scenario.description}の設定での会話`,
  duration_estimate: 15,
  conversation_starters: [scenario.initialPrompt],
  dialogue_triggers: [{
    condition: 'ユーザーの返答',
    response_hints: ['自然な応答', '感情豊かな表現'],
    emotion_triggers: [scenario.contextSettings.mood as any],
  }],
  suggested_topics: scenario.tags,
  target_emotions: [scenario.contextSettings.mood as any],
  emotional_progression: [{
    stage: 1,
    emotion: scenario.contextSettings.mood as any,
    description: scenario.description,
  }],
  is_unlocked: true,
  created_at: new Date(),
  updated_at: new Date(),
  usage_count: 0,
  is_favorite: false,
}));

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    id: 'daily_template',
    name: '日常会話テンプレート',
    category: 'daily',
    template_description: '日常的な会話のテンプレート',
    customizable_elements: ['location', 'time', 'topic'],
    generate_scenario: (params) => ({
      title: params.title || 'カスタム日常会話',
      description: params.description || 'カスタムシナリオ',
      category: 'daily',
      difficulty: 'beginner',
      tags: [],
      compatible_characters: ['aoi', 'shun'],
      recommended_character: 'aoi',
      context: {
        location: params.location || 'home',
        timeOfDay: params.time || 'morning',
        mood: 'neutral',
        relationship_stage: 'friend',
      },
      setting_description: params.description || 'カスタムシナリオ',
      duration_estimate: 15,
      conversation_starters: [params.starter || 'こんにちは'],
      dialogue_triggers: [],
      suggested_topics: [],
      target_emotions: ['neutral'],
      emotional_progression: [{
        stage: 1,
        emotion: 'neutral',
        description: 'カスタムシナリオ',
      }],
      is_unlocked: true,
      is_favorite: false,
    }),
  },
];

export const SCENARIO_COLLECTIONS: ScenarioCollection[] = [
  {
    id: 'beginner_collection',
    name: '初心者向けコレクション',
    description: '初心者におすすめのシナリオ集',
    scenarios: ENHANCED_SCENARIOS.filter(s => s.difficulty === 'beginner').map(s => s.id),
    is_curated: true,
    curator: 'システム',
    theme: '初心者向け',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'romance_collection',
    name: 'ロマンスコレクション',
    description: '恋愛系シナリオ集',
    scenarios: ENHANCED_SCENARIOS.filter(s => s.category === 'romance').map(s => s.id),
    is_curated: true,
    curator: 'システム',
    theme: 'ロマンス',
    created_at: new Date(),
    updated_at: new Date(),
  },
];