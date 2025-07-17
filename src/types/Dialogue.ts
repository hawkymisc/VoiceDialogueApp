// Dialogue and conversation-related type definitions

export type EmotionType =
  | 'joy'
  | 'sadness'
  | 'anger'
  | 'surprise'
  | 'fear'
  | 'neutral'
  | 'embarrassed'
  | 'excited';

export type ScenarioType =
  | 'daily-conversation'
  | 'work-scene'
  | 'special-event'
  | 'emotional-scene'
  | 'comedy-scene'
  | 'romantic-scene';

export interface EmotionState {
  primary: EmotionType;
  intensity: number; // 0-1
  secondary?: EmotionType;
  confidence: number; // 0-1
}

export interface DialogueMessage {
  id: string;
  speakerId: string;
  text: string;
  emotion: EmotionType;
  timestamp: Date;
  audioUrl?: string;
  metadata: {
    scenario: ScenarioType;
    context: string[];
    userRating?: number;
    isFavorite?: boolean;
  };
}

export interface ConversationContext {
  recentMessages: DialogueMessage[];
  currentMood: EmotionType;
  relationshipLevel: number; // 0-100
  scenarioState: ScenarioState;
  userPreferences: DialogueUserPreferences;
}

export interface ScenarioState {
  currentScenario: ScenarioType;
  progress: number; // 0-100
  availableActions: string[];
  contextVariables: Record<string, any>;
}

export interface Conversation {
  id: string;
  userId: string;
  participants: string[]; // character IDs
  messages: DialogueMessage[];
  scenario: ScenarioType;
  startTime: Date;
  endTime?: Date;
  metadata: {
    totalMessages: number;
    averageRating: number;
    tags: string[];
  };
}

export interface ConversationHistory {
  conversations: Conversation[];
  totalCount: number;
  favoriteConversations: string[]; // conversation IDs
}

export interface ConversationState {
  currentConversation: Conversation | null;
  conversationHistory: ConversationHistory;
  isGenerating: boolean;
  currentSpeaker: string | null;
  availableScenarios: ScenarioType[];
  error: string | null;
}

// API request/response types for dialogue
export interface DialogueRequest {
  userId: string;
  scenario: ScenarioType;
  characters: string[]; // character IDs
  context: ConversationContext;
  userInput?: string;
}

export interface DialogueResponse {
  message: DialogueMessage;
  nextSpeaker: string;
  suggestedActions: string[];
  contextUpdate: Partial<ConversationContext>;
}

// UserPreferences is defined in User.ts - removing duplicate definition
export type DialogueUserPreferences = {
  favoriteScenarios: ScenarioType[];
  preferredEmotions: EmotionType[];
  conversationStyle: 'casual' | 'formal' | 'mixed';
};
