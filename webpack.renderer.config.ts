console.log('✅ MonacoWebpackPlugin injected');

import CopyWebpackPlugin from 'copy-webpack-plugin';
import * as path from 'path';
import type { Configuration } from 'webpack';
import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'; 

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

// Additional rule for Monaco Editor's worker files
rules.push({
  test: /\.ttf$/,
  type: 'asset/resource',
});

// More reliable environmental detection
const isDevelopment = process.env.NODE_ENV === 'development';
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log(`Building in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
console.log('Current directory:', __dirname);

let rendererConfigPreparation: Configuration;

if (!isDevelopment) {
  rendererConfigPreparation = {
    module: {
      rules,
    },
    output: {
      publicPath: './../',
      globalObject: 'self',  // Make sure the worker is initialized correctly
    },
    
    plugins: [
      ...plugins,
      new HtmlWebpackPlugin({
        template: './src/index.html',
        inject: 'body',
        meta: {
          'Content-Security-Policy': {
            'http-equiv': 'Content-Security-Policy',
            content: isDevelopment
              ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http://localhost:6785; connect-src 'self' http://localhost:6785; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
              : "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http://localhost:6785; connect-src 'self' http://localhost:6785; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:;"
          }
        }
      }),

      // Monaco supports plugin configuration
      new MonacoWebpackPlugin({
        languages: ['javascript', 'python', 'cpp', 'java'],
        filename: 'monaco-editor-workers/[name].worker.js',
      }),

      // Copy the Monaco editor resources - make sure the vs folder is in the correct location
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
}
else {
  rendererConfigPreparation = {
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
            content: isDevelopment
              ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http://localhost:6785; connect-src 'self' http://localhost:6785; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
              : "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http://localhost:6785; connect-src 'self' http://localhost:6785; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
          }
        }
      }),

      // Insert Monaco support plugin
      new MonacoWebpackPlugin({
        filename: 'vs/[name].worker.js',
        publicPath: 'vs/',
        globalAPI: true, // Add this to force the use of global loader configuration
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

export const rendererConfig = rendererConfigPreparation;