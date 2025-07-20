import {dailyContentService} from '../../services/dailyContentService';
import {storageService} from '../../services/storageService';
import {scenarioService} from '../../services/scenarioService';
import {DailyContent, SpecialEvent, CharacterMoment} from '../../types/Engagement';

// Mock dependencies
jest.mock('../../services/storageService', () => ({
  storageService: {
    saveUserProfile: jest.fn(),
    getUserProfile: jest.fn(),
    saveUserPreferences: jest.fn(),
    getUserPreferences: jest.fn(),
    saveFavoriteConversations: jest.fn(),
    getFavoriteConversations: jest.fn(),
    saveUnlockedContent: jest.fn(),
    getUnlockedContent: jest.fn(),
    clearAllData: jest.fn(),
    exportData: jest.fn(),
    importData: jest.fn(),
    get: jest.fn(),
    save: jest.fn(),
  },
}));

jest.mock('../../services/scenarioService', () => ({
  scenarioService: {
    getScenarios: jest.fn(),
    getScenarioById: jest.fn(),
    createCustomScenario: jest.fn(),
    updateProgress: jest.fn(),
    completeScenario: jest.fn(),
  },
}));

const mockStorageService = require('../../services/storageService').storageService;
const mockScenarioService = require('../../services/scenarioService').scenarioService;

describe('DailyContentService Integration Tests', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock storage service
    mockStorageService.get.mockResolvedValue(null);
    mockStorageService.save.mockResolvedValue();
    
    // Mock scenario service
    mockScenarioService.getAllScenarios.mockResolvedValue([
      {
        id: 'daily_morning',
        title: '朝の挨拶',
        description: '朝の挨拶シナリオ',
        category: 'daily',
        compatible_characters: ['aoi', 'shun'],
        difficulty: 'beginner',
        estimated_duration: 10,
        is_premium: false,
        tags: ['morning', 'greeting'],
        popularity_score: 85,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'spring_picnic',
        title: '春のピクニック',
        description: '桜の下でピクニック',
        category: 'romance',
        compatible_characters: ['aoi'],
        difficulty: 'intermediate',
        estimated_duration: 20,
        is_premium: false,
        tags: ['spring', 'picnic', 'romance'],
        popularity_score: 90,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(dailyContentService.initialize()).resolves.not.toThrow();
    });

    it('should load seasonal themes on initialization', async () => {
      await dailyContentService.initialize();
      
      const currentTheme = dailyContentService.getCurrentSeasonalTheme();
      expect(currentTheme).toBeDefined();
      expect(currentTheme?.season).toMatch(/^(spring|summer|autumn|winter)$/);
    });

    it('should handle initialization errors gracefully', async () => {
      mockStorageService.get.mockRejectedValue(new Error('Storage error'));
      
      await expect(dailyContentService.initialize()).rejects.toThrow('Daily content service initialization failed');
    });
  });

  describe('Daily Content Generation', () => {
    beforeEach(async () => {
      await dailyContentService.initialize();
    });

    it('should generate daily content for a given date', async () => {
      const testDate = new Date('2024-07-15');
      const content = await dailyContentService.generateDailyContent(testDate, testUserId);
      
      expect(content).toHaveLength(1);
      expect(content[0]).toMatchObject({
        id: expect.stringContaining('daily_2024-07-15'),
        date: testDate,
        type: expect.stringMatching(/^(scenario|dialogue_starter|special_event|character_moment)$/),
        title: expect.any(String),
        description: expect.any(String),
        difficulty: expect.stringMatching(/^(easy|medium|hard)$/),
        estimatedDuration: expect.any(Number),
        rewards: expect.any(Array),
        isCompleted: false,
      });
    });

    it('should return cached content for the same date', async () => {
      const testDate = new Date('2024-07-15');
      
      // Generate content first time
      const content1 = await dailyContentService.generateDailyContent(testDate, testUserId);
      
      // Generate content second time - should return cached
      const content2 = await dailyContentService.generateDailyContent(testDate, testUserId);
      
      expect(content1).toEqual(content2);
      expect(mockScenarioService.getAllScenarios).toHaveBeenCalledTimes(1);
    });

    it('should generate different content for different dates', async () => {
      const date1 = new Date('2024-07-15');
      const date2 = new Date('2024-07-16');
      
      const content1 = await dailyContentService.generateDailyContent(date1, testUserId);
      const content2 = await dailyContentService.generateDailyContent(date2, testUserId);
      
      expect(content1[0].id).not.toEqual(content2[0].id);
    });

    it('should handle scenario service errors gracefully', async () => {
      mockScenarioService.getAllScenarios.mockRejectedValue(new Error('Scenario service error'));
      
      const testDate = new Date('2024-07-15');
      const content = await dailyContentService.generateDailyContent(testDate, testUserId);
      
      expect(content).toEqual([]);
    });
  });

  describe('Content Completion', () => {
    beforeEach(async () => {
      await dailyContentService.initialize();
    });

    it('should complete content successfully', async () => {
      const testDate = new Date('2024-07-15');
      const content = await dailyContentService.generateDailyContent(testDate, testUserId);
      
      const success = await dailyContentService.completeContent(content[0].id, testUserId);
      
      expect(success).toBe(true);
    });

    it('should not complete already completed content', async () => {
      const testDate = new Date('2024-07-15');
      const content = await dailyContentService.generateDailyContent(testDate, testUserId);
      
      // Complete first time
      await dailyContentService.completeContent(content[0].id, testUserId);
      
      // Try to complete again
      const success = await dailyContentService.completeContent(content[0].id, testUserId);
      
      expect(success).toBe(false);
    });

    it('should handle non-existent content completion', async () => {
      const success = await dailyContentService.completeContent('non-existent-id', testUserId);
      
      expect(success).toBe(false);
    });
  });

  describe('Special Events', () => {
    beforeEach(async () => {
      await dailyContentService.initialize();
    });

    it('should return active special events for current date', async () => {
      // Mock current date to be Valentine's Day
      const valentinesDay = new Date('2024-02-14');
      jest.useFakeTimers();
      jest.setSystemTime(valentinesDay);
      
      await dailyContentService.initialize(); // Reinitialize with mocked date
      
      const events = await dailyContentService.getActiveSpecialEvents(valentinesDay);
      
      expect(events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'valentine_day',
            name: 'バレンタインデー',
            isActive: true,
          }),
        ])
      );
      
      jest.useRealTimers();
    });

    it('should return empty array when no events are active', async () => {
      const regularDay = new Date('2024-05-15');
      const events = await dailyContentService.getActiveSpecialEvents(regularDay);
      
      expect(events).toHaveLength(0);
    });

    it('should handle summer festival event correctly', async () => {
      const summerFestivalDay = new Date('2024-08-15');
      jest.useFakeTimers();
      jest.setSystemTime(summerFestivalDay);
      
      await dailyContentService.initialize();
      
      const events = await dailyContentService.getActiveSpecialEvents(summerFestivalDay);
      
      expect(events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'summer_festival',
            type: 'seasonal',
            season: 'summer',
          }),
        ])
      );
      
      jest.useRealTimers();
    });
  });

  describe('Character Moments', () => {
    beforeEach(async () => {
      await dailyContentService.initialize();
    });

    it('should return available character moments based on user progress', async () => {
      // Mock user progress to meet unlock conditions
      const mockUserProgress = {
        characterAffinities: {
          aoi: {level: 35, timeSpent: 70},
          shun: {level: 45, timeSpent: 450},
        },
        completedScenarios: ['daily_morning', 'daily_weather', 'work_project', 'work_overtime'],
      };
      
      mockStorageService.get.mockResolvedValueOnce(mockUserProgress);
      
      const aoiMoments = await dailyContentService.getAvailableCharacterMoments('aoi', testUserId);
      const shunMoments = await dailyContentService.getAvailableCharacterMoments('shun', testUserId);
      
      expect(aoiMoments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            characterId: 'aoi',
            title: '蒼の子供時代',
          }),
        ])
      );
      
      expect(shunMoments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            characterId: 'shun',
            title: '瞬の仕事への想い',
          }),
        ])
      );
    });

    it('should return empty array when unlock conditions are not met', async () => {
      // Mock user progress with low levels
      const mockUserProgress = {
        characterAffinities: {
          aoi: {level: 10, timeSpent: 20},
          shun: {level: 15, timeSpent: 30},
        },
        completedScenarios: [],
      };
      
      mockStorageService.get.mockResolvedValueOnce(mockUserProgress);
      
      const aoiMoments = await dailyContentService.getAvailableCharacterMoments('aoi', testUserId);
      
      expect(aoiMoments).toHaveLength(0);
    });
  });

  describe('Seasonal Themes', () => {
    beforeEach(async () => {
      await dailyContentService.initialize();
    });

    it('should return correct seasonal theme for spring', async () => {
      const springDate = new Date('2024-04-15');
      const theme = dailyContentService.getCurrentSeasonalTheme(springDate);
      
      expect(theme).toMatchObject({
        season: 'spring',
        name: '春の訪れ',
        colors: expect.objectContaining({
          primary: '#FFB7C5',
          secondary: '#98FB98',
        }),
      });
    });

    it('should return correct seasonal theme for summer', async () => {
      const summerDate = new Date('2024-07-15');
      const theme = dailyContentService.getCurrentSeasonalTheme(summerDate);
      
      expect(theme).toMatchObject({
        season: 'summer',
        name: '夏の輝き',
        colors: expect.objectContaining({
          primary: '#00BFFF',
          secondary: '#FFD700',
        }),
      });
    });

    it('should return null for invalid date', async () => {
      const invalidDate = new Date('invalid');
      const theme = dailyContentService.getCurrentSeasonalTheme(invalidDate);
      
      expect(theme).toBeNull();
    });
  });

  describe('Content History', () => {
    beforeEach(async () => {
      await dailyContentService.initialize();
    });

    it('should return content history for specified number of days', async () => {
      // Generate content for multiple days
      const dates = [
        new Date('2024-07-15'),
        new Date('2024-07-16'),
        new Date('2024-07-17'),
      ];
      
      for (const date of dates) {
        await dailyContentService.generateDailyContent(date, testUserId);
      }
      
      const history = await dailyContentService.getContentHistory(testUserId, 7);
      
      expect(history).toHaveLength(3);
      expect(history[0].date.getTime()).toBeGreaterThanOrEqual(history[1].date.getTime());
    });

    it('should return empty array when no history exists', async () => {
      const history = await dailyContentService.getContentHistory('new-user', 30);
      
      expect(history).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors during content generation', async () => {
      await dailyContentService.initialize();
      
      mockStorageService.get.mockRejectedValue(new Error('Storage error'));
      
      const testDate = new Date('2024-07-15');
      const content = await dailyContentService.generateDailyContent(testDate, testUserId);
      
      // Should still generate content even with storage errors
      expect(content).toHaveLength(1);
    });

    it('should handle scenario service unavailability', async () => {
      await dailyContentService.initialize();
      
      mockScenarioService.getAllScenarios.mockRejectedValue(new Error('Service unavailable'));
      
      const testDate = new Date('2024-07-15');
      const content = await dailyContentService.generateDailyContent(testDate, testUserId);
      
      expect(content).toEqual([]);
    });

    it('should handle completion errors gracefully', async () => {
      await dailyContentService.initialize();
      
      // Mock storage save to fail
      mockStorageService.save.mockRejectedValue(new Error('Save failed'));
      
      const testDate = new Date('2024-07-15');
      const content = await dailyContentService.generateDailyContent(testDate, testUserId);
      
      const success = await dailyContentService.completeContent(content[0].id, testUserId);
      
      expect(success).toBe(false);
    });
  });

  describe('Content Types and Difficulty', () => {
    beforeEach(async () => {
      await dailyContentService.initialize();
    });

    it('should generate content with appropriate difficulty levels', async () => {
      const testDate = new Date('2024-07-15');
      const content = await dailyContentService.generateDailyContent(testDate, testUserId);
      
      expect(content[0].difficulty).toMatch(/^(easy|medium|hard)$/);
      expect(content[0].estimatedDuration).toBeGreaterThan(0);
    });

    it('should include appropriate rewards for content', async () => {
      const testDate = new Date('2024-07-15');
      const content = await dailyContentService.generateDailyContent(testDate, testUserId);
      
      expect(content[0].rewards).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            type: expect.stringMatching(/^(experience|affinity|unlock|item|achievement)$/),
            description: expect.any(String),
          }),
        ])
      );
    });

    it('should alternate character assignment for daily content', async () => {
      await dailyContentService.initialize();
      
      const date1 = new Date('2024-07-15'); // Day 197 of year (odd)
      const date2 = new Date('2024-07-16'); // Day 198 of year (even)
      
      const content1 = await dailyContentService.generateDailyContent(date1, testUserId);
      const content2 = await dailyContentService.generateDailyContent(date2, testUserId);
      
      // Characters should alternate based on day of year
      expect(content1[0].characterId).toEqual('shun'); // odd day
      expect(content2[0].characterId).toEqual('aoi');  // even day
    });
  });
});