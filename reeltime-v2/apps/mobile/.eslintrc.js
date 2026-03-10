/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: [require.resolve('@reeltime/config/eslint/react')],
  env: {
    node: true,
  },
  rules: {
    'react/no-unescaped-entities': 'off',
  },
  ignorePatterns: ['metro.config.js', 'babel.config.js', 'tailwind.config.ts'],
};
