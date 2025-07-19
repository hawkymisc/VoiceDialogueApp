// Dialogue and conversation-related type definitions

export type EmotionState =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'embarrassed';

export type DialogueCategory =
  | 'daily'
  | 'work'
  | 'romance'
  | 'comedy'
  | 'drama'
  | 'special';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

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
