import {EmotionType} from './Dialogue';

export type ContentRating = 'general' | 'teen' | 'mature' | 'restricted';
export type ContentCategory = 'dialogue' | 'scenario' | 'character' | 'media';
export type SecurityLevel = 'public' | 'private' | 'encrypted' | 'secure';

export interface ContentFilter {
  id: string;
  name: string;
  description: string;
  category: ContentCategory;
  patterns: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'warn' | 'filter' | 'block' | 'report';
  isActive: boolean;
}

export interface ContentRatingGuideline {
  rating: ContentRating;
  minAge: number;
  description: string;
  allowedTopics: string[];
  restrictedTopics: string[];
  emotionLimits: Record<EmotionType, number>;
  contentLimits: {
    maxMessageLength: number;
    maxConversationLength: number;
    allowedLanguages: string[];
  };
}

export interface ContentScanResult {
  isAllowed: boolean;
  confidence: number;
  rating: ContentRating;
  detectedIssues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location?: string;
    suggestions?: string[];
  }>;
  filteredContent?: string;
  metadata: {
    scanTimestamp: Date;
    scanDuration: number;
    filtersUsed: string[];
    contentHash: string;
  };
}

export interface UserContentPreferences {
  userId: string;
  contentRating: ContentRating;
  enabledFilters: string[];
  customFilters: ContentFilter[];
  parentalControls: {
    isEnabled: boolean;
    pin?: string;
    allowedCategories: ContentCategory[];
    timeRestrictions?: {
      startTime: string;
      endTime: string;
      allowedDays: number[];
    };
  };
  privacySettings: {
    dataCollection: boolean;
    analytics: boolean;
    personalization: boolean;
    shareUsageData: boolean;
  };
}

export interface SecurityPolicy {
  id: string;
  name: string;
  version: string;
  effectiveDate: Date;
  rules: Array<{
    id: string;
    condition: string;
    action: string;
    parameters: Record<string, any>;
  }>;
  compliance: {
    gdpr: boolean;
    coppa: boolean;
    ccpa: boolean;
    localLaws: string[];
  };
}

export interface EncryptionConfig {
  algorithm: 'AES-256-GCM' | 'AES-192-GCM' | 'AES-128-GCM';
  keyDerivation: 'PBKDF2' | 'Argon2' | 'scrypt';
  iterations: number;
  saltLength: number;
  ivLength: number;
}

export interface SecureDataContainer {
  id: string;
  encryptedData: string;
  algorithm: string;
  iv: string;
  salt: string;
  timestamp: Date;
  version: number;
  integrity: string; // HMAC
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'failure' | 'blocked';
  details: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ContentModerationReport {
  id: string;
  contentId: string;
  contentType: ContentCategory;
  reportedBy: string;
  reportReason: string;
  reportTimestamp: Date;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  moderatorNotes?: string;
  action?: 'none' | 'warning' | 'content_removal' | 'user_suspension';
  resolution?: {
    timestamp: Date;
    moderatorId: string;
    reason: string;
  };
}

export interface PrivacyComplianceData {
  userId: string;
  dataTypes: Array<{
    type: string;
    purpose: string;
    retention: string;
    consentGiven: boolean;
    consentTimestamp: Date;
  }>;
  exportRequests: Array<{
    requestId: string;
    requestDate: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    exportFormat: 'json' | 'csv' | 'xml';
  }>;
  deletionRequests: Array<{
    requestId: string;
    requestDate: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    deletionType: 'partial' | 'complete';
  }>;
}

export interface BiometricData {
  type: 'face' | 'voice' | 'fingerprint' | 'behavioral';
  hashedTemplate: string;
  confidence: number;
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
}