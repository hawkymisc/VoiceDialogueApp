const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [],
  resetCache: true,
  server: {
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Add CORS headers
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        return middleware(req, res, next);
      };
    },
  },
  resolver: {
    blacklistRE: /(\.disabled|node_modules[/\\]react[/\\]dist[/\\].*|website\\node_modules\\.*|heapCapture\\bundle\.js|.*\\__tests__\\.*)/,
  },
  watcher: {
    additionalExts: ['ts', 'tsx'],
    healthCheck: {
      enabled: true,
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
