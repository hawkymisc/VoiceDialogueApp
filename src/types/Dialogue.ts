// Dialogue and conversation-related type definitions

export type EmotionState =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'embarrassed';

// Alias for backward compatibility
export type EmotionType = EmotionState;

export type DialogueCategory =
  | 'daily'
  | 'work'
  | 'romance'
  | 'comedy'
  | 'drama'
  | 'special';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// Alias for backward compatibility
export type ScenarioType = DialogueCategory;

export interface ContextSettings {
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night' | 'work-hours' | 'any';
  location?: 'home' | 'office' | 'outside' | 'private' | 'public' | 'any';
  mood?: 'neutral' | 'happy' | 'sad' | 'serious' | 'romantic' | 'nervous' | 'tired' | 'relaxed' | 'embarrassed' | 'conflicted' | 'hopeful' | 'confused' | 'friendly' | 'tense';
}

export interface DialogueMessage {
  id: string;
  text: string;
  sender: 'user' | 'character';
  timestamp: number;
  emotion: EmotionState;
  audioUrl?: string;
  metadata?: {
    scenario?: string;
    context?: string[];
    userRating?: number;
    isFavorite?: boolean;
  };
}

export interface DialogueScenario {
  id: string;
  category: DialogueCategory;
  title: string;
  description: string;
  initialPrompt: string;
  tags: string[];
  difficulty: DifficultyLevel;
  contextSettings?: ContextSettings;
}

export interface Dialogue {
  id: string;
  characterId: string;
  scenario: DialogueScenario;
  messages: DialogueMessage[];
  startTime: number;
  endTime: number | null;
  emotionProgression: EmotionState[];
}

export interface DialogueState {
  currentDialogue: Dialogue | null;
  dialogueHistory: DialogueHistoryEntry[];
  emotionState: EmotionState;
  currentScenario: DialogueScenario | null;
  isLoading: boolean;
  error: string | null;
}

export interface DialogueHistoryEntry {
  id: string;
  characterId: string;
  scenario: DialogueScenario;
  startTime: number;
  endTime: number;
  messageCount: number;
  emotionProgression: EmotionState[];
  rating?: number;
}

// Additional missing types for tests
export interface DialogueRequest {
  characterId: string;
  userMessage: string;
  conversationHistory: DialogueMessage[];
  scenario?: string;
  relationshipContext?: string;
}

export interface DialogueResponse {
  text: string;
  emotion: EmotionType;
  confidence?: number;
  filtered?: string;
}

export interface ConversationState {
  currentConversation: any;
  conversationHistory: any;
  isGenerating: boolean;
  currentSpeaker: string | null;
  availableScenarios: string[];
  error: string | null;
}

export interface Conversation {
  id: string;
  characterId: string;
  userId?: string;
  participants?: string[];
  title: string;
  scenario: string;
  messages: DialogueMessage[];
  startedAt: Date;
  lastMessageAt: Date;
  isFavorite: boolean;
  tags: string[];
  summary: string;
  metadata: {
    totalMessages: number;
    averageResponseTime: number;
    emotionalArc: Array<{
      messageIndex: number;
      emotion: EmotionState;
      timestamp: Date;
    }>;
    keyMoments: string[];
  };
}

export interface ConversationHistory {
  conversations: Conversation[];
  totalCount: number;
  favoriteConversations: string[];
}

export interface ConversationSummary {
  conversationId: string;
  content: string;
  keyTopics: string[];
  emotionalHighlights: Array<{
    emotion: EmotionState;
    context: string;
    timestamp: Date;
  }>;
  characterInsights: string[];
  generatedAt: Date;
}
