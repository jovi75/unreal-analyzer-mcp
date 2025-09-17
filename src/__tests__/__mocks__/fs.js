import { jest } from '@jest/globals';

export const mockFs = {
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue(''),
  writeFileSync: jest.fn(),
};

export const existsSync = mockFs.existsSync;
export const readFileSync = mockFs.readFileSync;
export const writeFileSync = mockFs.writeFileSync;

export default mockFs;
