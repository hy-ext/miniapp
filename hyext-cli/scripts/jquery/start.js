'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.NODE_ENV = 'development';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

const path = require('path')
const fs = require('fs');
const chalk = require('react-dev-utils/chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const clearConsole = require('react-dev-utils/clearConsole');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const {
  prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils');
const openBrowser = require('react-dev-utils/openBrowser');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');

function basename(file) {
  return path.basename(file);
}

function resolve(filePath) {
  return path.resolve(process.cwd(), filePath);
}

function htmlPluginsTpl(filename, template, chunks) {
  return {
    filename,
    template,
    chunks
  }
}

function shouldUseYarn() {
  try {
    execSync('yarnpkg --version', {
      stdio: 'ignore'
    });
    return true;
  } catch (e) {
    return false;
  }
}

function extend(target1, target2) {
  for (let key in target2) {
    target1[key] = target2[key]
  }

  return target1
}

module.exports = function(config) {
  let webpackConfig = require('./webpack.dev.js')(process.cwd(), config.devServer)

  let tempWebpackConfig = {
    entry: {},
    plugins: []
  }
  for (let i = 0; i < config.pages.length; i++) {
    const page = config.pages[i];
    const entryKey = Object.keys(page.entry)[0];

    if (typeof entryKey === 'undefined') {
      console.log(`${chalk.red('lack of app entry in project.config.js, please config it.')}`)
      process.exit(1)
    }

    tempWebpackConfig['entry'][entryKey] = resolve(page.entry[entryKey])
    tempWebpackConfig['plugins'].push(
      new HtmlWebpackPlugin(
        htmlPluginsTpl(basename(page.template), page.template, entryKey)
      )
    )
  }

  webpackConfig = merge(webpackConfig, tempWebpackConfig)

  const useYarn = shouldUseYarn();
  const isInteractive = process.stdout.isTTY;

  const HOST = process.env.HOST || config.devServer.host;
  const port = config.devServer.port || 8080

  if (process.env.HOST) {
    console.log(
      chalk.cyan(
        `Attempting to bind to HOST environment variable: ${chalk.yellow(
        chalk.bold(process.env.HOST)
      )}`
      )
    );
    console.log(
      `If this was unintentional, check that you haven't mistakenly set it in your shell.`
    );
    console.log();
  }

  const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
  const appName = 'appName';
  const urls = prepareUrls(protocol, HOST, port);
  // Serve webpack assets generated by the compiler over a web server.
  const serverConfig = extend({
    contentBase: path.join(process.cwd(), 'src'),
    hot: true,
    compress: true,
    open: true
  }, config.devServer);
  const devServer = new WebpackDevServer(webpack(webpackConfig), serverConfig);
  // Launch WebpackDevServer.
  devServer.listen(port, HOST, err => {
    if (err) {
      return console.log(err);
    }
    if (isInteractive) {
      clearConsole();
    }
    console.log(chalk.cyan('Starting the development server...\n'));
    openBrowser(urls.localUrlForBrowser);
  });

  ['SIGINT', 'SIGTERM'].forEach(function(sig) {
    process.on(sig, function() {
      devServer.close();
      process.exit();
    });
  });
}