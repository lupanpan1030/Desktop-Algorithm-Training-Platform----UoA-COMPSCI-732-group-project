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

const isDevelopment = process.env.NODE_ENV !== 'production';

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  output: {
    publicPath: '/',
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

    // ✅ 插入 Monaco 支持插件
    new MonacoWebpackPlugin({
      filename: 'vs/[name].worker.js',
      publicPath: 'vs/',
      globalAPI: true, // ⬅️ 添加这个强制使用全局 loader 配置
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
