module.exports = function (api) {
  api.cache(true);

  const plugins = [];

  // Add reanimated plugin only for mobile platforms
  if (process.env.EXPO_PLATFORM !== 'web') {
    plugins.push('react-native-reanimated/plugin');
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};