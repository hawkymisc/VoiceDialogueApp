const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'index.web.js'),
  output: {
    path: path.resolve(__dirname, 'web-build'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            envName: 'web'
          }
        }
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'assets/'
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.web.js', '.js', '.web.ts', '.ts', '.web.tsx', '.tsx', '.json'],
    alias: {
      'react-native$': 'react-native-web',
      'react-native-fs': path.resolve(__dirname, 'src/mocks/react-native-fs.js'),
      'react-native-sound': path.resolve(__dirname, 'src/mocks/react-native-sound.js'),
      'react-native-vector-icons/MaterialIcons': path.resolve(__dirname, 'src/mocks/MaterialIcons.js'),
      'react-native-gesture-handler': path.resolve(__dirname, 'src/mocks/react-native-gesture-handler.js'),
      'react-native-reanimated': path.resolve(__dirname, 'src/mocks/react-native-reanimated.js'),
      'react-native-safe-area-context': path.resolve(__dirname, 'src/mocks/react-native-safe-area-context.js'),
      'react-native-screens': path.resolve(__dirname, 'src/mocks/react-native-screens.js'),
      '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/mocks/async-storage.js'),
      '@': path.resolve(__dirname, 'src')
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
      inject: true
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public')
    },
    port: 3001,
    open: false,
    historyApiFallback: true,
    hot: true
  }
};