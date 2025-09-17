import { jest } from '@jest/globals';

const createQueryResult = () => ({
  matches: jest.fn().mockReturnValue([])
});

const mockParser = {
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

const ParserMock = jest.fn(() => mockParser);

ParserMock.Query = jest.fn().mockImplementation(() => createQueryResult());

export default ParserMock;
