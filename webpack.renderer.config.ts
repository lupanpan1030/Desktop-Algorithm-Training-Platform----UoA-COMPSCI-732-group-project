console.log('✅ MonacoWebpackPlugin injected');

import CopyWebpackPlugin from 'copy-webpack-plugin';
import * as path from 'path';
import type { Configuration } from 'webpack';
import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'; // ✅ 引入插件

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

// Additional rule for Monaco Editor's worker files
rules.push({
  test: /\.ttf$/,
  type: 'asset/resource',
});

// 更可靠的环境检测
const isDevelopment = process.env.NODE_ENV === 'development';
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log(`Building in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
console.log('Current directory:', __dirname);

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  output: {
    publicPath: isDevelopment ? '/' : './../',
    globalObject: 'self',  // 确保worker正确初始化
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

    // Monaco支持插件配置
    new MonacoWebpackPlugin({
      languages: ['javascript', 'python', 'cpp', 'java'],
      filename: 'monaco-editor-workers/[name].worker.js',
    }),

    // 复制Monaco编辑器资源 - 确保vs文件夹在正确位置
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
