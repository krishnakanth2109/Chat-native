const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAbiSplit(config) {
  return withAppBuildGradle(config, async (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      /def enableSeparateBuildPerCPUArchitecture = false/,
      'def enableSeparateBuildPerCPUArchitecture = true'
    );
    return config;
  });
};
