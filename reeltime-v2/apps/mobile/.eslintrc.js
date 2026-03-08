/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['@reeltime/config/eslint/react'],
  env: {
    'react-native/react-native': true,
  },
  ignorePatterns: ['metro.config.js', 'babel.config.js', 'tailwind.config.ts'],
};
