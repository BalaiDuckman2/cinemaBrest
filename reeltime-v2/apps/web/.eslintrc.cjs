/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: [require.resolve("@reeltime/config/eslint/react")],
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
  // `*.config.d.ts` : tsc -b émet une déclaration à côté de chaque config,
  // artefact de build hors du tsconfig, que le linter typé ne sait pas parser.
  ignorePatterns: ['vite.config.ts', 'vitest.config.ts', 'tailwind.config.ts', '*.config.d.ts', 'dist/**'],
  rules: {
    'react/no-unescaped-entities': 'off',
  },
};
