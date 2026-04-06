const webpack = require('webpack');

const { rules } = require('./webpack.rules.js');
const { plugins } = require('./webpack.plugins.js');

const mainConfig = {
  entry: './src/index.ts',
  module: {
    rules,
  },
  plugins: [
    ...plugins,
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    })
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
};

module.exports = { mainConfig };
