import {
  formatTime,
  formatDate,
  debounce,
  validateEmail,
  generateId,
  capitalizeFirst,
  truncateText,
  parseJSON,
  isValidUrl,
  calculateAge,
  getRandomElement,
  deepClone,
  isObjectEmpty,
  mergeObjects,
  sleep,
} from '../helpers';

describe('helpers', () => {
  describe('formatTime', () => {
    it('should format time in seconds to MM:SS format', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(30)).toBe('00:30');
      expect(formatTime(60)).toBe('01:00');
      expect(formatTime(90)).toBe('01:30');
      expect(formatTime(3661)).toBe('61:01');
    });

    it('should handle negative time', () => {
      expect(formatTime(-10)).toBe('00:00');
    });

    it('should handle floating point seconds', () => {
      expect(formatTime(30.5)).toBe('00:30');
      expect(formatTime(60.9)).toBe('01:00');
    });
  });

  describe('formatDate', () => {
    it('should format timestamp to Japanese date format', () => {
      const timestamp = new Date('2023-12-25T10:30:00Z').getTime();
      const result = formatDate(timestamp);
      
      expect(result).toContain('2023');
      expect(result).toContain('12');
      expect(result).toContain('25');
    });

    it('should handle Date object', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const result = formatDate(date);
      
      expect(result).toContain('2023');
      expect(result).toContain('12');
      expect(result).toContain('25');
    });

    it('should handle invalid date', () => {
      expect(() => formatDate(NaN)).toThrow();
      expect(() => formatDate(new Date('invalid'))).toThrow();
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test1');
      debouncedFn('test2');
      debouncedFn('test3');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test3');
    });

    it('should handle multiple debounced calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test1');
      jest.advanceTimersByTime(50);
      debouncedFn('test2');
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test2');
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.jp')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test..test@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('should generate IDs with specified length', () => {
      const id = generateId(10);
      
      expect(id.length).toBe(10);
    });

    it('should handle edge cases', () => {
      expect(generateId(0)).toBe('');
      expect(generateId(-1)).toBe('');
      expect(generateId(1)).toHaveLength(1);
    });
  });

  describe('capitalizeFirst', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
      expect(capitalizeFirst('world')).toBe('World');
      expect(capitalizeFirst('test string')).toBe('Test string');
    });

    it('should handle edge cases', () => {
      expect(capitalizeFirst('')).toBe('');
      expect(capitalizeFirst('a')).toBe('A');
      expect(capitalizeFirst('HELLO')).toBe('HELLO');
    });
  });

  describe('truncateText', () => {
    it('should truncate text to specified length', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...');
      expect(truncateText('Short', 10)).toBe('Short');
      expect(truncateText('Exactly10C', 10)).toBe('Exactly10C');
    });

    it('should handle edge cases', () => {
      expect(truncateText('', 5)).toBe('');
      expect(truncateText('Test', 0)).toBe('...');
      expect(truncateText('Test', -1)).toBe('...');
    });
  });

  describe('parseJSON', () => {
    it('should parse valid JSON', () => {
      expect(parseJSON('{"key": "value"}')).toEqual({key: 'value'});
      expect(parseJSON('[1, 2, 3]')).toEqual([1, 2, 3]);
      expect(parseJSON('null')).toBeNull();
    });

    it('should return default value for invalid JSON', () => {
      expect(parseJSON('invalid json', {})).toEqual({});
      expect(parseJSON('', [])).toEqual([]);
      expect(parseJSON('{invalid}', null)).toBeNull();
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://sub.domain.com/path?query=value')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('invalid-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('just-text')).toBe(false);
    });
  });

  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const now = new Date();
      const birthDate = new Date(now.getFullYear() - 25, now.getMonth(), now.getDate());
      
      expect(calculateAge(birthDate.getTime())).toBe(25);
    });

    it('should handle Date objects', () => {
      const now = new Date();
      const birthDate = new Date(now.getFullYear() - 30, now.getMonth(), now.getDate());
      
      expect(calculateAge(birthDate)).toBe(30);
    });

    it('should handle edge cases', () => {
      const now = new Date();
      const future = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      expect(calculateAge(future.getTime())).toBe(0);
    });
  });

  describe('getRandomElement', () => {
    it('should return random element from array', () => {
      const array = [1, 2, 3, 4, 5];
      const element = getRandomElement(array);
      
      expect(array).toContain(element);
    });

    it('should handle single element array', () => {
      const array = ['only'];
      const element = getRandomElement(array);
      
      expect(element).toBe('only');
    });

    it('should handle empty array', () => {
      const array: any[] = [];
      const element = getRandomElement(array);
      
      expect(element).toBeUndefined();
    });
  });

  describe('deepClone', () => {
    it('should deep clone objects', () => {
      const original = {
        name: 'Test',
        nested: {
          value: 42,
          array: [1, 2, 3],
        },
      };
      
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
      expect(cloned.nested.array).not.toBe(original.nested.array);
    });

    it('should handle arrays', () => {
      const original = [1, {name: 'test'}, [2, 3]];
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
    });

    it('should handle primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('string')).toBe('string');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBeNull();
    });
  });

  describe('isObjectEmpty', () => {
    it('should detect empty objects', () => {
      expect(isObjectEmpty({})).toBe(true);
      expect(isObjectEmpty({key: 'value'})).toBe(false);
      expect(isObjectEmpty({key: undefined})).toBe(false);
    });

    it('should handle non-objects', () => {
      expect(isObjectEmpty(null)).toBe(true);
      expect(isObjectEmpty(undefined)).toBe(true);
      expect(isObjectEmpty([])).toBe(true);
      expect(isObjectEmpty('string')).toBe(false);
    });
  });

  describe('mergeObjects', () => {
    it('should merge objects deeply', () => {
      const obj1 = {a: 1, b: {c: 2}};
      const obj2 = {b: {d: 3}, e: 4};
      
      const result = mergeObjects(obj1, obj2);
      
      expect(result).toEqual({
        a: 1,
        b: {c: 2, d: 3},
        e: 4,
      });
    });

    it('should handle overlapping keys', () => {
      const obj1 = {a: 1, b: 2};
      const obj2 = {b: 3, c: 4};
      
      const result = mergeObjects(obj1, obj2);
      
      expect(result).toEqual({a: 1, b: 3, c: 4});
    });

    it('should handle empty objects', () => {
      expect(mergeObjects({}, {})).toEqual({});
      expect(mergeObjects({a: 1}, {})).toEqual({a: 1});
      expect(mergeObjects({}, {b: 2})).toEqual({b: 2});
    });
  });

  describe('sleep', () => {
    jest.useFakeTimers();

    it('should resolve after specified time', async () => {
      const promise = sleep(1000);
      
      jest.advanceTimersByTime(1000);
      
      await expect(promise).resolves.toBeUndefined();
    });

    it('should handle zero delay', async () => {
      const promise = sleep(0);
      
      jest.advanceTimersByTime(0);
      
      await expect(promise).resolves.toBeUndefined();
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });
});