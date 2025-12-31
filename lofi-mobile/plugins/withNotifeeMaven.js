const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withNotifeeMaven(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = addMaven(config.modResults.contents);
    }
    return config;
  });
};

function addMaven(buildGradle) {
  if (buildGradle.includes('@notifee/react-native/android/libs')) {
    return buildGradle;
  }

  // Append to allprojects repositories
  return buildGradle.replace(
    /allprojects\s*\{\s*repositories\s*\{/,
    `allprojects {
    repositories {
        maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }`
  );
}
