import {securityService} from '../securityService';
import {storageService} from '../storageService';
import {SecureDataContainer, SecurityLevel} from '../../types/ContentSecurity';

// Mock dependencies
jest.mock('../storageService');
const mockStorageService = storageService as jest.Mocked<typeof storageService>;

// Mock CryptoJS
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn().mockReturnValue({toString: () => 'encrypted_data'}),
    decrypt: jest.fn().mockReturnValue({toString: () => 'decrypted_data'}),
  },
  mode: {
    GCM: 'GCM',
  },
  pad: {
    NoPadding: 'NoPadding',
  },
  lib: {
    WordArray: {
      random: jest.fn().mockReturnValue({toString: () => 'random_bytes'}),
    },
  },
  PBKDF2: jest.fn().mockReturnValue({toString: () => 'derived_key'}),
  HmacSHA256: jest.fn().mockReturnValue({toString: () => 'hmac_hash'}),
  SHA256: jest.fn().mockReturnValue({toString: () => 'sha256_hash'}),
  enc: {
    Hex: {
      parse: jest.fn().mockReturnValue({}),
    },
    Utf8: 'Utf8',
  },
}));

describe('SecurityService', () => {
  const testPassword = 'test-password-123';
  const testData = 'test data to encrypt';
  const testUserId = 'test-user-123';

  beforeEach(async () => {
    jest.clearAllMocks();
    await securityService.initialize();
  });

  describe('initialization', () => {
    it('should initialize security service', async () => {
      await expect(securityService.initialize()).resolves.not.toThrow();
    });
  });

  describe('data encryption', () => {
    it('should encrypt data successfully', async () => {
      const container = await securityService.encryptData(testData, testPassword);

      expect(container).toMatchObject({
        id: expect.any(String),
        encryptedData: expect.any(String),
        algorithm: 'AES-256-GCM',
        iv: expect.any(String),
        salt: expect.any(String),
        timestamp: expect.any(Date),
        version: 1,
        integrity: expect.any(String),
      });
    });

    it('should handle public security level', async () => {
      const container = await securityService.encryptData(
        testData,
        testPassword,
        {encryptionLevel: 'public'}
      );

      expect(container.algorithm).toBe('none');
      expect(container.encryptedData).toBe(testData);
    });

    it('should encrypt with different security levels', async () => {
      const levels: SecurityLevel[] = ['private', 'encrypted', 'secure'];
      
      for (const level of levels) {
        const container = await securityService.encryptData(
          testData,
          testPassword,
          {encryptionLevel: level}
        );

        expect(container.algorithm).toBe('AES-256-GCM');
        expect(container.encryptedData).not.toBe(testData);
      }
    });
  });

  describe('data decryption', () => {
    it('should decrypt data successfully', async () => {
      const mockContainer: SecureDataContainer = {
        id: 'test-id',
        encryptedData: 'encrypted_data',
        algorithm: 'AES-256-GCM',
        iv: 'test_iv',
        salt: 'test_salt',
        timestamp: new Date(),
        version: 1,
        integrity: 'hmac_hash',
      };

      const decryptedData = await securityService.decryptData(mockContainer, testPassword);

      expect(decryptedData).toBe('decrypted_data');
    });

    it('should handle unencrypted data', async () => {
      const mockContainer: SecureDataContainer = {
        id: 'test-id',
        encryptedData: testData,
        algorithm: 'none',
        iv: '',
        salt: '',
        timestamp: new Date(),
        version: 1,
        integrity: 'test_hash',
      };

      const decryptedData = await securityService.decryptData(mockContainer, testPassword);

      expect(decryptedData).toBe(testData);
    });

    it('should throw error for invalid password', async () => {
      const mockContainer: SecureDataContainer = {
        id: 'test-id',
        encryptedData: 'encrypted_data',
        algorithm: 'AES-256-GCM',
        iv: 'test_iv',
        salt: 'test_salt',
        timestamp: new Date(),
        version: 1,
        integrity: 'wrong_hash',
      };

      await expect(
        securityService.decryptData(mockContainer, 'wrong-password')
      ).rejects.toThrow('Data decryption failed');
    });
  });

  describe('secure storage', () => {
    beforeEach(() => {
      mockStorageService.saveSecureData.mockResolvedValue();
      mockStorageService.getSecureData.mockResolvedValue(null);
      mockStorageService.deleteSecureData.mockResolvedValue();
    });

    it('should store data securely', async () => {
      const testKey = 'test-key';
      const testObj = {name: 'test', value: 123};

      await securityService.secureStore(testKey, testObj, testPassword);

      expect(mockStorageService.saveSecureData).toHaveBeenCalledWith(
        testKey,
        expect.objectContaining({
          id: expect.any(String),
          encryptedData: expect.any(String),
          algorithm: 'AES-256-GCM',
        })
      );
    });

    it('should retrieve data securely', async () => {
      const testKey = 'test-key';
      const mockContainer: SecureDataContainer = {
        id: 'test-id',
        encryptedData: 'encrypted_data',
        algorithm: 'AES-256-GCM',
        iv: 'test_iv',
        salt: 'test_salt',
        timestamp: new Date(),
        version: 1,
        integrity: 'hmac_hash',
      };

      mockStorageService.getSecureData.mockResolvedValue(mockContainer);

      const result = await securityService.secureRetrieve(testKey, testPassword);

      expect(result).toBe('decrypted_data');
      expect(mockStorageService.getSecureData).toHaveBeenCalledWith(testKey);
    });

    it('should return null for non-existent data', async () => {
      const testKey = 'non-existent-key';
      mockStorageService.getSecureData.mockResolvedValue(null);

      const result = await securityService.secureRetrieve(testKey, testPassword);

      expect(result).toBeNull();
    });

    it('should delete data securely', async () => {
      const testKey = 'test-key';

      await securityService.secureDelete(testKey);

      expect(mockStorageService.deleteSecureData).toHaveBeenCalledWith(testKey);
    });
  });

  describe('data hashing', () => {
    it('should hash sensitive data', async () => {
      const result = await securityService.hashSensitiveData(testData);

      expect(result).toMatchObject({
        hash: expect.any(String),
        salt: expect.any(String),
      });
    });

    it('should hash with provided salt', async () => {
      const customSalt = 'custom-salt';
      const result = await securityService.hashSensitiveData(testData, customSalt);

      expect(result.salt).toBe(customSalt);
    });

    it('should verify hashed data', async () => {
      const {hash, salt} = await securityService.hashSensitiveData(testData);
      const isValid = await securityService.verifyHashedData(testData, hash, salt);

      expect(isValid).toBe(true);
    });

    it('should reject invalid hash', async () => {
      const {salt} = await securityService.hashSensitiveData(testData);
      const isValid = await securityService.verifyHashedData(testData, 'wrong-hash', salt);

      expect(isValid).toBe(false);
    });
  });

  describe('data anonymization', () => {
    it('should anonymize personal data', async () => {
      const personalData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        address: '123 Main St',
        preferences: {
          theme: 'dark',
          language: 'en',
        },
      };

      const anonymized = await securityService.anonymizePersonalData(personalData);

      expect(anonymized.name).not.toBe(personalData.name);
      expect(anonymized.email).not.toBe(personalData.email);
      expect(anonymized.phone).not.toBe(personalData.phone);
      expect(anonymized.address).not.toBe(personalData.address);
      expect(anonymized.preferences).toEqual(personalData.preferences);
    });

    it('should handle arrays and nested objects', async () => {
      const complexData = {
        users: [
          {name: 'User1', email: 'user1@example.com'},
          {name: 'User2', email: 'user2@example.com'},
        ],
        metadata: {
          userId: 'user-123',
          settings: {
            theme: 'light',
          },
        },
      };

      const anonymized = await securityService.anonymizePersonalData(complexData);

      expect(anonymized.users[0].name).not.toBe('User1');
      expect(anonymized.users[0].email).not.toBe('user1@example.com');
      expect(anonymized.metadata.userId).not.toBe('user-123');
      expect(anonymized.metadata.settings.theme).toBe('light');
    });
  });

  describe('privacy compliance', () => {
    it('should generate privacy compliance report', async () => {
      const report = await securityService.generatePrivacyComplianceReport(testUserId);

      expect(report).toMatchObject({
        userId: testUserId,
        dataTypes: expect.arrayContaining([
          expect.objectContaining({
            type: expect.any(String),
            purpose: expect.any(String),
            retention: expect.any(String),
            consentGiven: expect.any(Boolean),
            consentTimestamp: expect.any(Date),
          }),
        ]),
        exportRequests: expect.any(Array),
        deletionRequests: expect.any(Array),
      });
    });

    it('should handle data export request', async () => {
      const exportData = await securityService.requestDataExport(testUserId, 'json');

      expect(exportData).toBeDefined();
      expect(typeof exportData).toBe('string');
    });

    it('should handle data export in different formats', async () => {
      const formats: Array<'json' | 'csv' | 'xml'> = ['json', 'csv', 'xml'];

      for (const format of formats) {
        const exportData = await securityService.requestDataExport(testUserId, format);
        expect(exportData).toBeDefined();
        expect(typeof exportData).toBe('string');
      }
    });

    it('should handle data deletion request', async () => {
      await expect(
        securityService.requestDataDeletion(testUserId, 'complete')
      ).resolves.not.toThrow();

      await expect(
        securityService.requestDataDeletion(testUserId, 'partial')
      ).resolves.not.toThrow();
    });
  });

  describe('security policy validation', () => {
    it('should validate security policies', async () => {
      const operation = 'data_access';
      const context = {userId: testUserId, resource: 'user_data'};

      const isAllowed = await securityService.validateSecurityPolicy(operation, context);

      expect(typeof isAllowed).toBe('boolean');
    });

    it('should handle policy validation errors', async () => {
      const operation = 'invalid_operation';
      const context = {};

      const isAllowed = await securityService.validateSecurityPolicy(operation, context);

      expect(isAllowed).toBe(false);
    });
  });

  describe('audit logging', () => {
    it('should get audit logs', async () => {
      const logs = await securityService.getAuditLogs();

      expect(Array.isArray(logs)).toBe(true);
    });

    it('should filter audit logs by date range', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const endDate = new Date();

      const logs = await securityService.getAuditLogs(startDate, endDate);

      expect(Array.isArray(logs)).toBe(true);
    });

    it('should filter audit logs by user', async () => {
      const logs = await securityService.getAuditLogs(
        undefined,
        undefined,
        testUserId
      );

      expect(Array.isArray(logs)).toBe(true);
    });

    it('should filter audit logs by operation', async () => {
      const logs = await securityService.getAuditLogs(
        undefined,
        undefined,
        undefined,
        'data_encryption'
      );

      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle encryption errors', async () => {
      // Mock encryption failure
      const CryptoJS = require('crypto-js');
      CryptoJS.AES.encrypt.mockImplementationOnce(() => {
        throw new Error('Encryption failed');
      });

      await expect(
        securityService.encryptData(testData, testPassword)
      ).rejects.toThrow('Data encryption failed');
    });

    it('should handle decryption errors', async () => {
      const invalidContainer: SecureDataContainer = {
        id: 'test-id',
        encryptedData: 'invalid_data',
        algorithm: 'AES-256-GCM',
        iv: 'test_iv',
        salt: 'test_salt',
        timestamp: new Date(),
        version: 1,
        integrity: 'test_hash',
      };

      // Mock decryption failure
      const CryptoJS = require('crypto-js');
      CryptoJS.AES.decrypt.mockImplementationOnce(() => {
        throw new Error('Decryption failed');
      });

      await expect(
        securityService.decryptData(invalidContainer, testPassword)
      ).rejects.toThrow('Data decryption failed');
    });

    it('should handle storage errors', async () => {
      const testKey = 'test-key';
      const testObj = {test: 'data'};

      mockStorageService.saveSecureData.mockRejectedValueOnce(new Error('Storage error'));

      await expect(
        securityService.secureStore(testKey, testObj, testPassword)
      ).rejects.toThrow();
    });
  });

  describe('integration tests', () => {
    it('should perform end-to-end encryption workflow', async () => {
      const originalData = {
        sensitive: 'secret information',
        public: 'public information',
        nested: {
          personal: 'private data',
          metadata: 'system data',
        },
      };

      // Encrypt data
      const container = await securityService.encryptData(
        JSON.stringify(originalData),
        testPassword
      );

      expect(container.encryptedData).not.toBe(JSON.stringify(originalData));

      // Decrypt data
      const decryptedData = await securityService.decryptData(container, testPassword);
      const parsedData = JSON.parse(decryptedData);

      expect(parsedData).toEqual(originalData);
    });

    it('should perform secure storage workflow', async () => {
      const testKey = 'integration-test-key';
      const testObject = {
        user: 'test-user',
        settings: {theme: 'dark', lang: 'ja'},
        timestamp: new Date().toISOString(),
      };

      mockStorageService.saveSecureData.mockResolvedValue();
      mockStorageService.getSecureData.mockResolvedValue({
        id: 'test-id',
        encryptedData: JSON.stringify(testObject),
        algorithm: 'none',
        iv: '',
        salt: '',
        timestamp: new Date(),
        version: 1,
        integrity: 'test_hash',
      });

      // Store data
      await securityService.secureStore(testKey, testObject, testPassword);

      // Retrieve data
      const retrievedData = await securityService.secureRetrieve(testKey, testPassword);

      expect(retrievedData).toEqual(testObject);

      // Delete data
      await securityService.secureDelete(testKey);

      expect(mockStorageService.deleteSecureData).toHaveBeenCalledWith(testKey);
    });
  });
});