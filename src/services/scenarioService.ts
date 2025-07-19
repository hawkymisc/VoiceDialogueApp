import {
  Scenario,
  ScenarioFilter,
  ScenarioSearchQuery,
  ScenarioRecommendation,
  ScenarioProgress,
  ScenarioPreferences,
  ScenarioTemplate,
  ScenarioCollection,
  ScenarioAnalytics,
} from '../types/Scenario';
import {ENHANCED_SCENARIOS, SCENARIO_TEMPLATES, SCENARIO_COLLECTIONS} from '../data/scenarios';
import {CharacterType} from '../types/Character';
import {EmotionType} from '../types/Dialogue';
import {storageService} from './storageService';

export interface ScenarioServiceConfig {
  enableAnalytics: boolean;
  enableRecommendations: boolean;
  enableUserProgress: boolean;
}

class ScenarioService {
  private config: ScenarioServiceConfig;
  private scenarios: Scenario[] = [];
  private userProgress: Map<string, ScenarioProgress> = new Map();
  private userPreferences: ScenarioPreferences | null = null;
  private analytics: Map<string, ScenarioAnalytics> = new Map();

  constructor(config: ScenarioServiceConfig = {
    enableAnalytics: true,
    enableRecommendations: true,
    enableUserProgress: true,
  }) {
    this.config = config;
    this.initializeScenarios();
  }

  private initializeScenarios(): void {
    this.scenarios = [...ENHANCED_SCENARIOS];
  }

  // Scenario retrieval methods
  async getAllScenarios(): Promise<Scenario[]> {
    return this.scenarios;
  }

  async getScenarioById(scenarioId: string): Promise<Scenario | null> {
    return this.scenarios.find(s => s.id === scenarioId) || null;
  }

  async getScenariosByCategory(category: string): Promise<Scenario[]> {
    return this.scenarios.filter(s => s.category === category);
  }

  async getUnlockedScenarios(userId?: string): Promise<Scenario[]> {
    if (!userId) {
      return this.scenarios.filter(s => s.is_unlocked);
    }

    // Check unlock requirements based on user progress
    const unlockedScenarios: Scenario[] = [];
    
    for (const scenario of this.scenarios) {
      if (await this.isScenarioUnlocked(scenario, userId)) {
        unlockedScenarios.push(scenario);
      }
    }

    return unlockedScenarios;
  }

  async isScenarioUnlocked(scenario: Scenario, userId: string): Promise<boolean> {
    if (scenario.is_unlocked) {
      return true;
    }

    if (!scenario.unlock_requirements) {
      return false;
    }

    const requirements = scenario.unlock_requirements;

    // Check completed scenarios
    if (requirements.completed_scenarios) {
      for (const requiredScenarioId of requirements.completed_scenarios) {
        const progress = this.userProgress.get(`${userId}_${requiredScenarioId}`);
        if (!progress || !progress.is_completed) {
          return false;
        }
      }
    }

    // Check intimacy level
    if (requirements.intimacy_level !== undefined) {
      // This would typically come from character relationship data
      // For now, assume it's met if the user has completed enough scenarios
      const completedCount = Array.from(this.userProgress.values())
        .filter(p => p.user_id === userId && p.is_completed).length;
      
      if (completedCount < requirements.intimacy_level) {
        return false;
      }
    }

    return true;
  }

  // Search and filter methods
  async searchScenarios(query: ScenarioSearchQuery): Promise<Scenario[]> {
    let results = [...this.scenarios];

    // Apply text search
    if (query.query.trim()) {
      const searchTerm = query.query.toLowerCase();
      results = results.filter(scenario =>
        scenario.title.toLowerCase().includes(searchTerm) ||
        scenario.description.toLowerCase().includes(searchTerm) ||
        scenario.suggested_topics.some(topic => topic.toLowerCase().includes(searchTerm))
      );
    }

    // Apply filters
    results = this.applyFilters(results, query.filters);

    // Apply sorting
    results = this.sortScenarios(results, query.sort_by, query.sort_order);

    // Apply pagination
    if (query.offset !== undefined) {
      results = results.slice(query.offset);
    }
    if (query.limit !== undefined) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  private applyFilters(scenarios: Scenario[], filters: ScenarioFilter): Scenario[] {
    let filtered = [...scenarios];

    if (filters.categories) {
      filtered = filtered.filter(s => filters.categories!.includes(s.category));
    }

    if (filters.characters) {
      filtered = filtered.filter(s => 
        filters.characters!.some(char => s.compatible_characters.includes(char))
      );
    }

    if (filters.difficulty) {
      filtered = filtered.filter(s => filters.difficulty!.includes(s.difficulty));
    }

    if (filters.tags) {
      filtered = filtered.filter(s =>
        filters.tags!.some(tag => s.tags.includes(tag))
      );
    }

    if (filters.duration_range) {
      filtered = filtered.filter(s =>
        s.duration_estimate >= filters.duration_range!.min &&
        s.duration_estimate <= filters.duration_range!.max
      );
    }

    if (filters.only_unlocked) {
      filtered = filtered.filter(s => s.is_unlocked);
    }

    if (filters.only_favorites) {
      filtered = filtered.filter(s => s.is_favorite);
    }

    return filtered;
  }

  private sortScenarios(scenarios: Scenario[], sortBy: string, order: 'asc' | 'desc'): Scenario[] {
    const sorted = [...scenarios].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created_at':
          comparison = a.created_at.getTime() - b.created_at.getTime();
          break;
        case 'duration':
          comparison = a.duration_estimate - b.duration_estimate;
          break;
        case 'popularity':
          comparison = a.usage_count - b.usage_count;
          break;
        case 'rating':
          comparison = (a.user_rating || 0) - (b.user_rating || 0);
          break;
        default:
          comparison = 0;
      }

      return order === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  // Recommendation system
  async getRecommendations(userId: string, characterId?: CharacterType, limit: number = 5): Promise<ScenarioRecommendation[]> {
    if (!this.config.enableRecommendations) {
      return [];
    }

    const preferences = await this.getUserPreferences(userId);
    const userProgress = Array.from(this.userProgress.values()).filter(p => p.user_id === userId);
    
    const recommendations: ScenarioRecommendation[] = [];

    for (const scenario of this.scenarios) {
      if (!await this.isScenarioUnlocked(scenario, userId)) {
        continue;
      }

      // Skip if already completed and user prefers new content
      const isCompleted = userProgress.some(p => p.scenario_id === scenario.id && p.is_completed);
      if (isCompleted && preferences?.surprise_factor && preferences.surprise_factor > 0.7) {
        continue;
      }

      const compatibilityScore = this.calculateCompatibilityScore(scenario, preferences, characterId);
      
      if (compatibilityScore > 0.3) {
        recommendations.push({
          scenario,
          compatibility_score: compatibilityScore,
          reason: this.generateRecommendationReason(scenario, preferences, characterId),
          estimated_enjoyment: this.estimateEnjoyment(scenario, preferences, userProgress),
          similar_scenarios: this.findSimilarScenarios(scenario.id, 3),
        });
      }
    }

    // Sort by compatibility score and limit results
    return recommendations
      .sort((a, b) => b.compatibility_score - a.compatibility_score)
      .slice(0, limit);
  }

  private calculateCompatibilityScore(
    scenario: Scenario,
    preferences: ScenarioPreferences | null,
    characterId?: CharacterType
  ): number {
    let score = 0.5; // Base score

    if (preferences) {
      // Category preference
      if (preferences.preferred_categories.includes(scenario.category)) {
        score += 0.2;
      }

      // Character compatibility
      if (characterId && scenario.compatible_characters.includes(characterId)) {
        score += 0.15;
      }

      // Difficulty preference
      if (preferences.preferred_difficulty === scenario.difficulty) {
        score += 0.1;
      }

      // Duration preference
      const durationDiff = Math.abs(scenario.duration_estimate - preferences.preferred_duration);
      if (durationDiff <= 5) {
        score += 0.1;
      }

      // Tag preferences
      const matchingTags = scenario.tags.filter(tag => preferences.favorite_tags.includes(tag));
      score += matchingTags.length * 0.05;

      // Avoided tags
      const avoidedTags = scenario.tags.filter(tag => preferences.avoided_tags.includes(tag));
      score -= avoidedTags.length * 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  private generateRecommendationReason(
    scenario: Scenario,
    preferences: ScenarioPreferences | null,
    characterId?: CharacterType
  ): string {
    const reasons: string[] = [];

    if (preferences?.preferred_categories.includes(scenario.category)) {
      reasons.push(`${scenario.category}カテゴリがお好み`);
    }

    if (characterId && scenario.recommended_character === characterId) {
      reasons.push(`${characterId === 'aoi' ? '蒼' : '瞬'}におすすめ`);
    }

    if (scenario.difficulty === 'beginner') {
      reasons.push('初心者向けで始めやすい');
    }

    if (scenario.is_favorite) {
      reasons.push('人気のシナリオ');
    }

    return reasons.length > 0 ? reasons.join('、') : 'あなたに合いそうなシナリオ';
  }

  private estimateEnjoyment(
    scenario: Scenario,
    preferences: ScenarioPreferences | null,
    userProgress: ScenarioProgress[]
  ): number {
    let enjoyment = 0.7; // Base enjoyment

    // Historical satisfaction
    const avgSatisfaction = userProgress
      .filter(p => p.user_satisfaction !== undefined)
      .reduce((sum, p) => sum + (p.user_satisfaction || 0), 0) / userProgress.length;

    if (avgSatisfaction > 0) {
      enjoyment = avgSatisfaction / 5; // Convert 1-5 scale to 0-1
    }

    return Math.max(0.1, Math.min(1, enjoyment));
  }

  private findSimilarScenarios(scenarioId: string, limit: number): string[] {
    const currentScenario = this.scenarios.find(s => s.id === scenarioId);
    if (!currentScenario) return [];

    const similar = this.scenarios
      .filter(s => s.id !== scenarioId)
      .map(s => ({
        id: s.id,
        similarity: this.calculateSimilarity(currentScenario, s),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(s => s.id);

    return similar;
  }

  private calculateSimilarity(scenario1: Scenario, scenario2: Scenario): number {
    let similarity = 0;

    // Category match
    if (scenario1.category === scenario2.category) {
      similarity += 0.3;
    }

    // Tag overlap
    const commonTags = scenario1.tags.filter(tag => scenario2.tags.includes(tag));
    similarity += commonTags.length * 0.1;

    // Difficulty match
    if (scenario1.difficulty === scenario2.difficulty) {
      similarity += 0.2;
    }

    // Character compatibility overlap
    const commonCharacters = scenario1.compatible_characters.filter(char =>
      scenario2.compatible_characters.includes(char)
    );
    similarity += commonCharacters.length * 0.15;

    return Math.min(1, similarity);
  }

  // Progress tracking
  async startScenario(userId: string, scenarioId: string): Promise<ScenarioProgress> {
    if (!this.config.enableUserProgress) {
      throw new Error('User progress tracking is disabled');
    }

    const scenario = await this.getScenarioById(scenarioId);
    if (!scenario) {
      throw new Error('Scenario not found');
    }

    const progressId = `${userId}_${scenarioId}`;
    const progress: ScenarioProgress = {
      scenario_id: scenarioId,
      user_id: userId,
      started_at: new Date(),
      current_stage: 1,
      total_stages: scenario.emotional_progression.length,
      dialogue_count: 0,
      emotions_triggered: [],
      key_moments: [],
      is_completed: false,
    };

    this.userProgress.set(progressId, progress);
    
    // Update analytics
    if (this.config.enableAnalytics) {
      await this.updateAnalytics(scenarioId, 'session_start');
    }

    return progress;
  }

  async updateProgress(
    userId: string,
    scenarioId: string,
    updates: Partial<ScenarioProgress>
  ): Promise<ScenarioProgress | null> {
    const progressId = `${userId}_${scenarioId}`;
    const progress = this.userProgress.get(progressId);
    
    if (!progress) {
      return null;
    }

    const updatedProgress = { ...progress, ...updates };
    this.userProgress.set(progressId, updatedProgress);

    return updatedProgress;
  }

  async completeScenario(
    userId: string,
    scenarioId: string,
    satisfaction?: number
  ): Promise<ScenarioProgress | null> {
    const progressId = `${userId}_${scenarioId}`;
    const progress = this.userProgress.get(progressId);
    
    if (!progress) {
      return null;
    }

    progress.is_completed = true;
    progress.completed_at = new Date();
    if (satisfaction !== undefined) {
      progress.user_satisfaction = satisfaction;
    }

    // Update scenario usage count
    const scenario = await this.getScenarioById(scenarioId);
    if (scenario) {
      scenario.usage_count += 1;
      if (satisfaction !== undefined) {
        scenario.user_rating = scenario.user_rating
          ? (scenario.user_rating + satisfaction) / 2
          : satisfaction;
      }
    }

    // Update analytics
    if (this.config.enableAnalytics) {
      await this.updateAnalytics(scenarioId, 'completion', { satisfaction });
    }

    return progress;
  }

  // User preferences
  async getUserPreferences(userId: string): Promise<ScenarioPreferences | null> {
    try {
      const preferencesData = await storageService.getUserPreferences();
      // Extract scenario preferences from user preferences
      // This would be implemented based on the actual user preferences structure
      return this.userPreferences;
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      return null;
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<ScenarioPreferences>): Promise<void> {
    if (!this.userPreferences) {
      this.userPreferences = {
        user_id: userId,
        preferred_categories: [],
        preferred_characters: [],
        preferred_difficulty: 'beginner',
        preferred_duration: 15,
        favorite_tags: [],
        avoided_tags: [],
        emotional_preferences: [],
        conversation_style: 'casual',
        pacing_preference: 'medium',
        surprise_factor: 0.5,
        ...preferences,
      };
    } else {
      this.userPreferences = { ...this.userPreferences, ...preferences };
    }

    // Save to storage
    try {
      // This would save scenario preferences as part of user preferences
      // Implementation depends on the storage structure
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  // Analytics
  private async updateAnalytics(
    scenarioId: string,
    eventType: 'session_start' | 'completion' | 'rating',
    data?: any
  ): Promise<void> {
    if (!this.config.enableAnalytics) {
      return;
    }

    let analytics = this.analytics.get(scenarioId);
    if (!analytics) {
      analytics = {
        scenario_id: scenarioId,
        total_sessions: 0,
        completion_rate: 0,
        average_rating: 0,
        average_duration: 0,
        emotion_distribution: {
          neutral: 0,
          happy: 0,
          sad: 0,
          angry: 0,
          surprised: 0,
          embarrassed: 0,
        },
        most_common_dialogues: [],
        user_feedback: [],
        character_performance: {
          aoi: {
            usage_count: 0,
            satisfaction_rating: 0,
            preferred_dialogue_types: [],
          },
          shun: {
            usage_count: 0,
            satisfaction_rating: 0,
            preferred_dialogue_types: [],
          },
        },
      };
      this.analytics.set(scenarioId, analytics);
    }

    switch (eventType) {
      case 'session_start':
        analytics.total_sessions += 1;
        break;
      case 'completion':
        if (data?.satisfaction) {
          analytics.user_feedback.push({
            user_id: data.userId || 'anonymous',
            rating: data.satisfaction,
            feedback: data.feedback || '',
            created_at: new Date(),
          });
          
          // Update average rating
          const totalRatings = analytics.user_feedback.length;
          const sumRatings = analytics.user_feedback.reduce((sum, f) => sum + f.rating, 0);
          analytics.average_rating = sumRatings / totalRatings;
        }
        break;
    }
  }

  // Collections
  async getScenarioCollections(): Promise<ScenarioCollection[]> {
    return SCENARIO_COLLECTIONS;
  }

  async getCollectionById(collectionId: string): Promise<ScenarioCollection | null> {
    return SCENARIO_COLLECTIONS.find(c => c.id === collectionId) || null;
  }

  async getScenariosInCollection(collectionId: string): Promise<Scenario[]> {
    const collection = await this.getCollectionById(collectionId);
    if (!collection) {
      return [];
    }

    return this.scenarios.filter(s => collection.scenarios.includes(s.id));
  }

  // Templates
  async getScenarioTemplates(): Promise<ScenarioTemplate[]> {
    return SCENARIO_TEMPLATES;
  }

  async generateScenarioFromTemplate(
    templateId: string,
    parameters: Record<string, any>
  ): Promise<Scenario | null> {
    const template = SCENARIO_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      return null;
    }

    const baseScenario = template.generate_scenario(parameters);
    const scenario: Scenario = {
      ...baseScenario,
      id: `generated_${Date.now()}`,
      created_at: new Date(),
      updated_at: new Date(),
      usage_count: 0,
    };

    // Add to scenarios list
    this.scenarios.push(scenario);

    return scenario;
  }

  // Favorites
  async toggleFavorite(scenarioId: string): Promise<boolean> {
    const scenario = await this.getScenarioById(scenarioId);
    if (!scenario) {
      return false;
    }

    scenario.is_favorite = !scenario.is_favorite;
    return scenario.is_favorite;
  }

  async getFavoriteScenarios(): Promise<Scenario[]> {
    return this.scenarios.filter(s => s.is_favorite);
  }
}

export const scenarioService = new ScenarioService();