/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^tree-sitter-cpp/bindings/node$': '<rootDir>/src/__tests__/__mocks__/tree-sitter-cpp.js',
    '^tree-sitter-cpp$': '<rootDir>/src/__tests__/__mocks__/tree-sitter-cpp.js',
    '^tree-sitter$': '<rootDir>/src/__tests__/__mocks__/tree-sitter.js'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__mocks__/',
    '/build/',
    'setup.ts',
    '\\.d\\.ts$'
  ],
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
  modulePathIgnorePatterns: ['/build/']
};
