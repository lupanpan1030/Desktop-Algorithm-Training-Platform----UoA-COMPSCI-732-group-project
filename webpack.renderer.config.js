console.log('✅ MonacoWebpackPlugin injected');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const { rules } = require('./webpack.rules.js');
const { plugins } = require('./webpack.plugins.js');

const devRendererCsp =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*; img-src 'self' data:; worker-src 'self' blob:;";
const prodRendererCsp =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' http://localhost:6785 http://127.0.0.1:6785; img-src 'self' data:; worker-src 'self' blob:;";

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

// Additional rule for Monaco Editor's worker files
rules.push({
  test: /\.ttf$/,
  type: 'asset/resource',
});

const isDevelopment = process.env.NODE_ENV === 'development';
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log(`Building in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
console.log('Current directory:', __dirname);

let rendererConfigPreparation;

if (!isDevelopment) {
  rendererConfigPreparation = {
    devtool: false,
    module: {
      rules,
    },
    output: {
      publicPath: './../',
      globalObject: 'self',
    },
    plugins: [
      ...plugins,
      new HtmlWebpackPlugin({
        template: './src/index.html',
        inject: 'body',
        meta: {
          'Content-Security-Policy': {
            'http-equiv': 'Content-Security-Policy',
            content: prodRendererCsp
          }
        }
      }),
      new MonacoWebpackPlugin({
        languages: ['javascript', 'python', 'cpp', 'java'],
        filename: 'monaco-editor-workers/[name].worker.js',
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'node_modules/monaco-editor/min/vs'),
            to: 'vs',
          },
        ],
      })
    ],
    resolve: {
      extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
      fallback: {
        path: false,
        fs: false,
      },
    },
    optimization: {
      minimize: false,
      splitChunks: {
        cacheGroups: {
          monacoCommon: {
            test: /[\\/]node_modules[\\/]monaco-editor/,
            name: 'monaco-editor-common',
            chunks: 'async',
          },
        },
      },
    },
  };
} else {
  rendererConfigPreparation = {
    devtool: 'source-map',
    module: {
      rules,
    },
    output: {
      publicPath: './../',
    },
    plugins: [
      ...plugins,
      new HtmlWebpackPlugin({
        template: './src/index.html',
        inject: 'body',
        meta: {
          'Content-Security-Policy': {
            'http-equiv': 'Content-Security-Policy',
            content: devRendererCsp
          }
        }
      }),
      new MonacoWebpackPlugin({
        filename: 'vs/[name].worker.js',
        publicPath: 'vs/',
        globalAPI: true,
        languages: ['javascript', 'python', 'cpp', 'java'],
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'node_modules/monaco-editor/min/vs'),
            to: 'vs',
          },
        ],
      })
    ],
    resolve: {
      extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    },
  };
}

const rendererConfig = rendererConfigPreparation;

module.exports = { rendererConfig };
