module.exports = {
  presets: [
    ['module:metro-react-native-babel-preset', {
      unstable_transformProfile: 'hermes-stable',
    }],
  ],
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-transform-private-methods', { loose: true }],
    ['@babel/plugin-transform-private-property-in-object', { loose: true }],
  ],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', {
          targets: {
            node: 'current',
          },
        }],
        '@babel/preset-typescript',
      ],
    },
    web: {
      presets: [
        ['@babel/preset-env', {
          targets: {
            browsers: ['last 2 versions', 'not dead'],
          },
          useBuiltIns: 'usage',
          corejs: 3,
        }],
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
      plugins: [
        ['@babel/plugin-transform-runtime', {
          regenerator: true,
        }],
        ['@babel/plugin-proposal-class-properties', { loose: true }],
        ['@babel/plugin-transform-private-methods', { loose: true }],
        ['@babel/plugin-transform-private-property-in-object', { loose: true }],
      ],
    },
  },
};