import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/actions/**/*.test.ts', '**/actions/**/*.test.tsx'],
  moduleNameMapper: {
    // lodash-es ships ESM only; map to CJS build for Jest
    '^lodash-es$': 'lodash',
    '^lodash-es/(.*)$': 'lodash/$1',
  },
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  setupFiles: ['jest-fetch-mock/setupJest'],
};

export default config;
