module.exports = {
  extends: [require.resolve('@reeltime/config/eslint/node')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
