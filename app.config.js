const { version } = require('./package.json');

/** Amber, so the dev build is tellable apart from the release one on the home screen. */
const DEV_COLOR = '#F18437';

module.exports = ({ config }) => {
  // Single source of truth: `pnpm version:*` bumps package.json, never app.json.
  const base = { ...config, version };

  if (process.env.APP_VARIANT !== 'development') return base;

  return {
    ...base,
    name: `${base.name} (Dev)`,
    icon: './assets/icon-dev.png',
    ios: { ...base.ios, bundleIdentifier: `${base.ios.bundleIdentifier}.dev` },
    android: {
      ...base.android,
      package: `${base.android.package}.dev`,
      adaptiveIcon: { ...base.android.adaptiveIcon, backgroundColor: DEV_COLOR },
    },
  };
};
