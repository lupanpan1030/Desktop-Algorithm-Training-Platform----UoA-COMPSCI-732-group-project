import type { Configuration } from 'webpack';
import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';
import HtmlWebpackPlugin from 'html-webpack-plugin';

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

const isDevelopment = process.env.NODE_ENV !== 'production';

export const rendererConfig: Configuration = {
  module: {
    rules,
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
            ? "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
            : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
        }
      }
    })
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
};
