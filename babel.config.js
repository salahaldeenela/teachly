module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "nativewind/babel",
      // Removed expo-router/babel as it's now included in babel-preset-expo
    ],
  };
};
