// API communication interface definitions

import {Character, CharacterCustomization} from './Character';
import {
  DialogueRequest,
  DialogueResponse,
  Conversation,
  ConversationHistory,
} from './Dialogue';
import {UserProfile, UserPreferences} from './User';
import {VoiceSynthesisRequest, VoiceSynthesisResponse} from './Audio';

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

// Pagination interface
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Character API interfaces
export interface CharacterService {
  getCharacters(): Promise<ApiResponse<Character[]>>;
  getCharacter(id: string): Promise<ApiResponse<Character>>;
  updateCharacterCustomization(
    customization: CharacterCustomization,
  ): Promise<ApiResponse<Character>>;
  resetCharacterCustomization(
    characterId: string,
  ): Promise<ApiResponse<Character>>;
}

// Dialogue API interfaces
export interface DialogueService {
  generateDialogue(
    request: DialogueRequest,
  ): Promise<ApiResponse<DialogueResponse>>;
  getConversationHistory(
    userId: string,
    pagination?: PaginationParams,
  ): Promise<ApiResponse<PaginatedResponse<Conversation>>>;
  saveConversation(conversation: Conversation): Promise<ApiResponse<void>>;
  deleteConversation(conversationId: string): Promise<ApiResponse<void>>;
  getFavoriteConversations(
    userId: string,
  ): Promise<ApiResponse<Conversation[]>>;
  addToFavorites(
    userId: string,
    conversationId: string,
  ): Promise<ApiResponse<void>>;
  removeFromFavorites(
    userId: string,
    conversationId: string,
  ): Promise<ApiResponse<void>>;
}

// TTS API interfaces
export interface TTSService {
  synthesizeVoice(
    request: VoiceSynthesisRequest,
  ): Promise<ApiResponse<VoiceSynthesisResponse>>;
  getVoiceSettings(characterId: string): Promise<ApiResponse<any>>;
  updateVoiceSettings(
    characterId: string,
    settings: any,
  ): Promise<ApiResponse<void>>;
  getAvailableVoices(): Promise<ApiResponse<any[]>>;
}

// User API interfaces
export interface UserService {
  getUserProfile(userId: string): Promise<ApiResponse<UserProfile>>;
  updateUserProfile(
    userId: string,
    profile: Partial<UserProfile>,
  ): Promise<ApiResponse<UserProfile>>;
  updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>,
  ): Promise<ApiResponse<UserPreferences>>;
  deleteUserAccount(userId: string): Promise<ApiResponse<void>>;
  exportUserData(userId: string): Promise<ApiResponse<any>>;
}

// Content API interfaces
export interface ContentService {
  getDailyScenarios(): Promise<ApiResponse<any[]>>;
  getSeasonalContent(): Promise<ApiResponse<any[]>>;
  getUnlockedContent(userId: string): Promise<ApiResponse<string[]>>;
  unlockContent(userId: string, contentId: string): Promise<ApiResponse<void>>;
}

// Authentication API interfaces
export interface AuthService {
  login(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{token: string; user: UserProfile}>>;
  register(userData: {
    email: string;
    password: string;
    username?: string;
  }): Promise<ApiResponse<{token: string; user: UserProfile}>>;
  logout(): Promise<ApiResponse<void>>;
  refreshToken(token: string): Promise<ApiResponse<{token: string}>>;
  verifyAge(birthDate: Date): Promise<ApiResponse<{verified: boolean}>>;
}

// Error types
export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'CONTENT_FILTERED'
  | 'TTS_FAILED'
  | 'AI_GENERATION_FAILED';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: any;
  timestamp: Date;
}

// Request/Response interceptor types
export interface RequestInterceptor {
  onRequest?: (config: any) => any;
  onRequestError?: (error: any) => Promise<any>;
}

export interface ResponseInterceptor {
  onResponse?: (response: any) => any;
  onResponseError?: (error: any) => Promise<any>;
}

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  requestInterceptors: RequestInterceptor[];
  responseInterceptors: ResponseInterceptor[];
}
