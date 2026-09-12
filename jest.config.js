module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps/api/src', '<rootDir>/apps/api/test'],
  testMatch: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'apps/api/src/modules/**/*.ts',
    '!apps/api/src/**/*.spec.ts',
    '!apps/api/src/main.ts',
  ],
  coverageDirectory: '<rootDir>/coverage/api',
  moduleNameMapper: {
    '^@sigrade/shared-prisma$': '<rootDir>/libs/shared/prisma/src/index.ts',
  },
  // setupFilesAfterEnv: ['<rootDir>/apps/api/test/jest.setup.ts'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'apps/api/tsconfig.spec.json',
    }],
  },
};