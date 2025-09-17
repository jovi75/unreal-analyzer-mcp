import { jest } from '@jest/globals';

export const mockServer = {
  setRequestHandler: jest.fn(),
  connect: jest.fn(),
  close: jest.fn(),
  onerror: jest.fn()
};

export const Server = jest.fn(() => mockServer);
export const StdioServerTransport = jest.fn();

export const resetMockServer = () => {
  mockServer.setRequestHandler.mockReset();
  mockServer.connect.mockReset();
  mockServer.close.mockReset();
  mockServer.onerror.mockReset();
  Server.mockClear();
  StdioServerTransport.mockClear();
};
