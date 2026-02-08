const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

const makePluralPath = path.resolve(__dirname, 'node_modules/make-plural/plurals.js');

const config = {
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'css'],
    resolveRequest: (context, moduleName, platform) => {
      // make-plural has no "main" field; entry is ./plurals.js via "exports". Metro needs an explicit path.
      if (moduleName === 'make-plural' || moduleName === 'make-plural/plurals') {
        return { type: 'sourceFile', filePath: makePluralPath };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
