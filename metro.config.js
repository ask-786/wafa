const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  // Generated on every Metro start; typed theme names for `Uniwind.setTheme`.
  dtsFile: './uniwind-types.d.ts',
});
