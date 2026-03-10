/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: [require.resolve("@reeltime/config/eslint/react")],
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
};
