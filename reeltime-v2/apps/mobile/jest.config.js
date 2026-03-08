/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowImportingTsExtensions: false,
          paths: {
            '@/*': ['./src/*'],
          },
        },
      },
    ],
  },
  setupFiles: ['<rootDir>/src/__mocks__/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(zustand|@react-native-async-storage/async-storage)/)',
  ],
};
