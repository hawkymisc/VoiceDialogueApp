import {
  DEFAULT_SCENARIOS,
  SCENARIO_CATEGORIES,
  getScenariosByCategory,
  getScenarioById,
  getRandomScenario,
  getScenariosByDifficulty,
  getScenariosByTags,
  searchScenarios,
} from '../scenarios';
import {DialogueCategory} from '../../types/Dialogue';

describe('Scenarios Data', () => {
  describe('DEFAULT_SCENARIOS', () => {
    it('should have at least one scenario for each category', () => {
      const categoriesWithScenarios = new Set(
        DEFAULT_SCENARIOS.map(scenario => scenario.category)
      );
      
      const allCategories = Object.keys(SCENARIO_CATEGORIES) as DialogueCategory[];
      
      allCategories.forEach(category => {
        expect(categoriesWithScenarios.has(category)).toBe(true);
      });
    });

    it('should have valid scenario structure', () => {
      DEFAULT_SCENARIOS.forEach(scenario => {
        expect(scenario.id).toBeDefined();
        expect(scenario.category).toBeDefined();
        expect(scenario.title).toBeDefined();
        expect(scenario.description).toBeDefined();
        expect(scenario.initialPrompt).toBeDefined();
        expect(Array.isArray(scenario.tags)).toBe(true);
        expect(['easy', 'medium', 'hard']).toContain(scenario.difficulty);
        expect(SCENARIO_CATEGORIES[scenario.category]).toBeDefined();
      });
    });

    it('should have unique scenario IDs', () => {
      const ids = DEFAULT_SCENARIOS.map(scenario => scenario.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('SCENARIO_CATEGORIES', () => {
    it('should have required properties for each category', () => {
      Object.entries(SCENARIO_CATEGORIES).forEach(([key, category]) => {
        expect(category.name).toBeDefined();
        expect(category.description).toBeDefined();
        expect(category.icon).toBeDefined();
        expect(category.color).toBeDefined();
        expect(category.color).toMatch(/^#[0-9A-F]{6}$/i); // Valid hex color
      });
    });
  });

  describe('getScenariosByCategory', () => {
    it('should return scenarios for valid category', () => {
      const dailyScenarios = getScenariosByCategory('daily');
      
      expect(dailyScenarios.length).toBeGreaterThan(0);
      dailyScenarios.forEach(scenario => {
        expect(scenario.category).toBe('daily');
      });
    });

    it('should return empty array for invalid category', () => {
      const invalidScenarios = getScenariosByCategory('invalid' as DialogueCategory);
      
      expect(invalidScenarios).toHaveLength(0);
    });

    it('should return different scenarios for different categories', () => {
      const dailyScenarios = getScenariosByCategory('daily');
      const workScenarios = getScenariosByCategory('work');
      
      expect(dailyScenarios).not.toEqual(workScenarios);
    });
  });

  describe('getScenarioById', () => {
    it('should return scenario for valid ID', () => {
      const scenario = getScenarioById('daily_morning');
      
      expect(scenario).toBeDefined();
      expect(scenario?.id).toBe('daily_morning');
      expect(scenario?.category).toBe('daily');
    });

    it('should return undefined for invalid ID', () => {
      const scenario = getScenarioById('invalid_id');
      
      expect(scenario).toBeUndefined();
    });
  });

  describe('getRandomScenario', () => {
    it('should return a random scenario from all scenarios', () => {
      const scenario = getRandomScenario();
      
      expect(scenario).toBeDefined();
      expect(DEFAULT_SCENARIOS).toContain(scenario);
    });

    it('should return a random scenario from specific category', () => {
      const scenario = getRandomScenario('daily');
      
      expect(scenario).toBeDefined();
      expect(scenario.category).toBe('daily');
    });

    it('should return different scenarios on multiple calls', () => {
      const scenarios = Array.from({ length: 10 }, () => getRandomScenario());
      const uniqueScenarios = new Set(scenarios.map(s => s.id));
      
      // With enough calls, we should get some variety (though not guaranteed)
      // This test might occasionally fail due to randomness, but very rarely
      expect(uniqueScenarios.size).toBeGreaterThan(1);
    });
  });

  describe('getScenariosByDifficulty', () => {
    it('should return scenarios for easy difficulty', () => {
      const easyScenarios = getScenariosByDifficulty('easy');
      
      expect(easyScenarios.length).toBeGreaterThan(0);
      easyScenarios.forEach(scenario => {
        expect(scenario.difficulty).toBe('easy');
      });
    });

    it('should return scenarios for medium difficulty', () => {
      const mediumScenarios = getScenariosByDifficulty('medium');
      
      expect(mediumScenarios.length).toBeGreaterThan(0);
      mediumScenarios.forEach(scenario => {
        expect(scenario.difficulty).toBe('medium');
      });
    });

    it('should return scenarios for hard difficulty', () => {
      const hardScenarios = getScenariosByDifficulty('hard');
      
      expect(hardScenarios.length).toBeGreaterThan(0);
      hardScenarios.forEach(scenario => {
        expect(scenario.difficulty).toBe('hard');
      });
    });
  });

  describe('getScenariosByTags', () => {
    it('should return scenarios with matching tags', () => {
      const morningScenarios = getScenariosByTags(['morning']);
      
      expect(morningScenarios.length).toBeGreaterThan(0);
      morningScenarios.forEach(scenario => {
        expect(scenario.tags).toContain('morning');
      });
    });

    it('should return scenarios matching any of the provided tags', () => {
      const scenarios = getScenariosByTags(['morning', 'romantic']);
      
      expect(scenarios.length).toBeGreaterThan(0);
      scenarios.forEach(scenario => {
        expect(
          scenario.tags.some(tag => ['morning', 'romantic'].includes(tag))
        ).toBe(true);
      });
    });

    it('should return empty array for non-existent tags', () => {
      const scenarios = getScenariosByTags(['nonexistent']);
      
      expect(scenarios).toHaveLength(0);
    });
  });

  describe('searchScenarios', () => {
    it('should find scenarios by title', () => {
      const scenarios = searchScenarios('朝');
      
      expect(scenarios.length).toBeGreaterThan(0);
      scenarios.forEach(scenario => {
        expect(
          scenario.title.toLowerCase().includes('朝') ||
          scenario.description.toLowerCase().includes('朝') ||
          scenario.tags.some(tag => tag.toLowerCase().includes('朝'))
        ).toBe(true);
      });
    });

    it('should find scenarios by description', () => {
      const scenarios = searchScenarios('会話');
      
      expect(scenarios.length).toBeGreaterThan(0);
      scenarios.forEach(scenario => {
        expect(
          scenario.title.toLowerCase().includes('会話') ||
          scenario.description.toLowerCase().includes('会話') ||
          scenario.tags.some(tag => tag.toLowerCase().includes('会話'))
        ).toBe(true);
      });
    });

    it('should find scenarios by tags', () => {
      const scenarios = searchScenarios('greeting');
      
      expect(scenarios.length).toBeGreaterThan(0);
      scenarios.forEach(scenario => {
        expect(
          scenario.title.toLowerCase().includes('greeting') ||
          scenario.description.toLowerCase().includes('greeting') ||
          scenario.tags.some(tag => tag.toLowerCase().includes('greeting'))
        ).toBe(true);
      });
    });

    it('should be case insensitive', () => {
      const lowerCaseResults = searchScenarios('morning');
      const upperCaseResults = searchScenarios('MORNING');
      const mixedCaseResults = searchScenarios('Morning');
      
      expect(lowerCaseResults).toEqual(upperCaseResults);
      expect(lowerCaseResults).toEqual(mixedCaseResults);
    });

    it('should return empty array for non-matching query', () => {
      const scenarios = searchScenarios('xyz123nonexistent');
      
      expect(scenarios).toHaveLength(0);
    });

    it('should return empty array for empty query', () => {
      const scenarios = searchScenarios('');
      
      expect(scenarios).toHaveLength(0);
    });
  });
});