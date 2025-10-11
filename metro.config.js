// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for import.meta issue on web
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  // Disable Hermes for web to fix import.meta issues
  hermesParser: false,
};

// Platform-specific settings
config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'web'],
};

module.exports = config;