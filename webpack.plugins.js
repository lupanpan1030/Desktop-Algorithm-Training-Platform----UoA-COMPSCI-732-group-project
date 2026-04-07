const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const quietTypecheckLogger = {
  log: () => {},
  error: (message) => {
    console.error(message);
  },
};

const shouldSkipWebpackTypecheck =
  process.env.SKIP_WEBPACK_TYPECHECK === 'true';

const plugins = shouldSkipWebpackTypecheck
  ? []
  : [
      new ForkTsCheckerWebpackPlugin({
        logger: quietTypecheckLogger,
      }),
    ];

module.exports = { plugins };
