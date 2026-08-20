import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    'src/lib/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  // Bound the worker pool: the CI machine is shared by several self-hosted runners, and an
  // unbounded jest (one worker per CPU, no memory ceiling) is what tipped it into an OOM kill that
  // took a runner down. Same limits the API package already uses.
  maxWorkers: '50%',
  workerIdleMemoryLimit: '512MB',
};

export default createJestConfig(config);
