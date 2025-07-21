// Mock for @react-native-async-storage/async-storage in web environment

const AsyncStorage = {
  _storage: new Map(),

  getItem: async (key) => {
    const value = AsyncStorage._storage.get(key);
    return value || null;
  },

  setItem: async (key, value) => {
    AsyncStorage._storage.set(key, value);
  },

  removeItem: async (key) => {
    AsyncStorage._storage.delete(key);
  },

  clear: async () => {
    AsyncStorage._storage.clear();
  },

  getAllKeys: async () => {
    return Array.from(AsyncStorage._storage.keys());
  },

  multiGet: async (keys) => {
    return keys.map(key => [key, AsyncStorage._storage.get(key) || null]);
  },

  multiSet: async (keyValuePairs) => {
    keyValuePairs.forEach(([key, value]) => {
      AsyncStorage._storage.set(key, value);
    });
  },

  multiRemove: async (keys) => {
    keys.forEach(key => {
      AsyncStorage._storage.delete(key);
    });
  }
};

export default AsyncStorage;