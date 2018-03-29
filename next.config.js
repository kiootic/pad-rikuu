const withTypescript = require('@zeit/next-typescript');
const withSass = require('@zeit/next-sass');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const path = require('path');

module.exports = withTypescript(withSass({
  cssModules: true,
  webpack(config, options) {
    // Do not run type checking twice:
    if (options.isServer) config.plugins.push(new ForkTsCheckerWebpackPlugin());
    config.resolve.alias['app'] = path.resolve('./app');
    config.resolve.alias['styles'] = path.resolve('./styles');
    return config;
  }
}));
