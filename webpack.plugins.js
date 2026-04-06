const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const quietTypecheckLogger = {
  log: () => {},
  error: (message) => {
    console.error(message);
  },
};

const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: quietTypecheckLogger,
  }),
];

module.exports = { plugins };
