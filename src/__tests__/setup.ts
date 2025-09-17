import { jest, beforeEach } from '@jest/globals';

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});

// Mock implementations
export const mockTreeSitter = {
  setLanguage: jest.fn(),
  parse: jest.fn().mockReturnValue({
    rootNode: {
      hasError: false,
      descendantsOfType: jest.fn().mockReturnValue([]),
      children: [],
      startPosition: { row: 0, column: 0 },
      text: ''
    }
  })
};

export const mockCppBindings = {
  name: 'cpp',
  nodeTypeInfo: {
    typeIdentifier: 1,
    functionDefinition: 2,
    classSpecifier: 3,
  },
  query: jest.fn().mockReturnValue({
    matches: jest.fn().mockReturnValue([])
  })
};

export const mockGlob = {
  sync: jest.fn().mockReturnValue([])
};

export const mockFs = {
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue(''),
  writeFileSync: jest.fn()
};
