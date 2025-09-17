import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';

let toolHandlers: { [key: string]: Function } = {};
type UnrealCodeAnalyzer = import('../analyzer.js').UnrealCodeAnalyzer;

let MockServer: jest.Mock;
let MockTransport: jest.Mock;
let mockServer: {
  setRequestHandler: jest.Mock;
  connect: jest.Mock;
  close: jest.Mock;
  onerror: jest.Mock;
};
let resetMockServer: () => void;

const MockUnrealCodeAnalyzer = jest.fn();

describe('UnrealAnalyzerServer', () => {
  let mockAnalyzer: jest.Mocked<UnrealCodeAnalyzer>;
  let consoleErrorSpy: any;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Mock Analyzer implementation
    mockAnalyzer = {
      initialize: jest.fn(),
      initializeCustomCodebase: jest.fn(),
      isInitialized: jest.fn(),
      analyzeClass: jest.fn(),
      findClassHierarchy: jest.fn(),
      findReferences: jest.fn(),
      searchCode: jest.fn(),
      analyzeSubsystem: jest.fn(),
    } as any;

    // Mock UnrealCodeAnalyzer constructor
    MockUnrealCodeAnalyzer.mockImplementation(() => mockAnalyzer);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    toolHandlers = {};

    jest.resetModules();
    const createServerModule = await import('@modelcontextprotocol/create-server');
    MockServer = createServerModule.Server as jest.Mock;
    MockTransport = createServerModule.StdioServerTransport as jest.Mock;
    mockServer = (createServerModule as any).mockServer;
    resetMockServer = (createServerModule as any).resetMockServer;

    resetMockServer();
    mockServer.setRequestHandler.mockImplementation((type: unknown, handler: unknown) => {
      const key = String(type);
      if (typeof handler === 'function') {
        toolHandlers[key] = handler;
      }
    });
    mockServer.connect.mockImplementation(() => Promise.resolve());
    mockServer.close.mockImplementation(() => Promise.resolve());
    MockServer.mockReturnValue(mockServer);
    MockTransport.mockReturnValue({});

    MockUnrealCodeAnalyzer.mockImplementation(() => mockAnalyzer);

    await jest.unstable_mockModule('../analyzer.js', () => ({
      UnrealCodeAnalyzer: MockUnrealCodeAnalyzer,
    }));

    await import('../index.js');
    await new Promise(resolve => setTimeout(resolve, 0));
    process.removeAllListeners('SIGINT');
  });

  describe('Server Initialization', () => {
    it('should initialize server with correct configuration', () => {
      expect(MockServer).toHaveBeenCalledWith(
        {
          name: 'unreal-analyzer',
          version: '0.1.0',
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );
    });

    it('should set up error handler', () => {
      expect(mockServer.onerror).toBeDefined();
    });
  });

  describe('Tool Handlers', () => {
    it('should register list_tools handler', () => {
      expect(toolHandlers['list_tools']).toBeDefined();
    });

    it('should register call_tool handler', () => {
      expect(toolHandlers['call_tool']).toBeDefined();
    });

    it('should return correct tool list', async () => {
      const listToolsHandler = toolHandlers['list_tools'];
      const result = await listToolsHandler();

      expect(result.tools).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'set_unreal_path',
            description: expect.any(String),
            inputSchema: expect.any(Object),
          }),
          expect.objectContaining({
            name: 'analyze_class',
            description: expect.any(String),
            inputSchema: expect.any(Object),
          }),
          // Add more tool checks as needed
        ])
      );
    });
  });

  describe('Tool Execution', () => {
    const callToolHandler = async (name: string, args: any) => {
      return await toolHandlers['call_tool']({
        params: {
          name,
          arguments: args,
        },
      });
    };

    describe('set_unreal_path', () => {
      it('should initialize analyzer with path', async () => {
        const path = '/test/path';
        await callToolHandler('set_unreal_path', { path });
        expect(mockAnalyzer.initialize).toHaveBeenCalledWith(path);
      });

      it('should handle initialization errors', async () => {
        mockAnalyzer.initialize.mockRejectedValue(new Error('Invalid path'));
        await expect(
          callToolHandler('set_unreal_path', { path: '/invalid' })
        ).rejects.toThrow('Invalid path');
      });
    });

    describe('analyze_class', () => {
      it('should require initialization', async () => {
        mockAnalyzer.isInitialized.mockReturnValue(false);
        await expect(
          callToolHandler('analyze_class', { className: 'TestClass' })
        ).rejects.toThrow('No codebase initialized');
      });

      it('should return class analysis', async () => {
        mockAnalyzer.isInitialized.mockReturnValue(true);
        const mockClassInfo = {
          name: 'TestClass',
          file: 'test.h',
          line: 1,
          superclasses: [],
          interfaces: [],
          methods: [],
          properties: [],
          comments: []
        };
        mockAnalyzer.analyzeClass.mockResolvedValue(mockClassInfo);

        const result = await callToolHandler('analyze_class', {
          className: 'TestClass',
        });
        expect(result.content[0].text).toBe(JSON.stringify(mockClassInfo, null, 2));
      });
    });

    describe('find_references', () => {
      it('should require initialization', async () => {
        mockAnalyzer.isInitialized.mockReturnValue(false);
        await expect(
          callToolHandler('find_references', { identifier: 'test' })
        ).rejects.toThrow('No codebase initialized');
      });

      it('should return references', async () => {
        mockAnalyzer.isInitialized.mockReturnValue(true);
        const mockRefs = [{
          file: 'test.cpp',
          line: 1,
          column: 1,
          context: 'test context'
        }];
        mockAnalyzer.findReferences.mockResolvedValue(mockRefs);

        const result = await callToolHandler('find_references', {
          identifier: 'test',
          type: 'class',
        });
        expect(result.content[0].text).toBe(JSON.stringify(mockRefs, null, 2));
      });
    });

    describe('search_code', () => {
      it('should require initialization', async () => {
        mockAnalyzer.isInitialized.mockReturnValue(false);
        await expect(
          callToolHandler('search_code', { query: 'test' })
        ).rejects.toThrow('No codebase initialized');
      });

      it('should return search results', async () => {
        mockAnalyzer.isInitialized.mockReturnValue(true);
        const mockResults = [{
          file: 'test.cpp',
          line: 1,
          column: 1,
          context: 'test'
        }];
        mockAnalyzer.searchCode.mockResolvedValue(mockResults);

        const result = await callToolHandler('search_code', {
          query: 'test',
          filePattern: '*.cpp',
          includeComments: true,
        });
        expect(result.content[0].text).toBe(JSON.stringify(mockResults, null, 2));
      });
    });

    describe('analyze_subsystem', () => {
      it('should require initialization', async () => {
        mockAnalyzer.isInitialized.mockReturnValue(false);
        await expect(
          callToolHandler('analyze_subsystem', { subsystem: 'Rendering' })
        ).rejects.toThrow('No codebase initialized');
      });

      it('should return subsystem analysis', async () => {
        mockAnalyzer.isInitialized.mockReturnValue(true);
        const mockSubsystemInfo = {
          name: 'Rendering',
          mainClasses: ['RenderClass'],
          keyFeatures: ['Feature1'],
          dependencies: ['Dep1'],
          sourceFiles: ['file1.cpp']
        };
        mockAnalyzer.analyzeSubsystem.mockResolvedValue(mockSubsystemInfo);

        const result = await callToolHandler('analyze_subsystem', {
          subsystem: 'Rendering',
        });
        expect(result.content[0].text).toBe(
          JSON.stringify(mockSubsystemInfo, null, 2)
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown tool errors', async () => {
      await expect(
        toolHandlers['call_tool']({
          params: { name: 'unknown_tool', arguments: {} },
        })
      ).rejects.toThrow('Unknown tool: unknown_tool');
    });

    it('should handle analyzer errors', async () => {
      mockAnalyzer.isInitialized.mockReturnValue(true);
      mockAnalyzer.analyzeClass.mockRejectedValue(new Error('Analysis failed'));

      await expect(
        toolHandlers['call_tool']({
          params: { name: 'analyze_class', arguments: { className: 'Test' } },
        })
      ).rejects.toThrow('Analysis failed');
    });
  });
});
