import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

const createMockServer = () => ({
  setRequestHandler: jest.fn(),
  connect: jest.fn(() => Promise.resolve()),
  close: jest.fn(() => Promise.resolve()),
  onerror: undefined as ((error: Error) => void) | undefined,
});

const createMockAnalyzer = () => ({
  initialize: jest.fn(() => Promise.resolve()),
  initializeCustomCodebase: jest.fn(() => Promise.resolve()),
  isInitialized: jest.fn(() => true),
  analyzeClass: jest.fn(() => Promise.resolve({ name: 'TestClass' })),
  findClassHierarchy: jest.fn(() => Promise.resolve({ className: 'TestClass', superclasses: [], interfaces: [] })),
  findReferences: jest.fn(() => Promise.resolve([])),
  searchCode: jest.fn(() => Promise.resolve([])),
  analyzeSubsystem: jest.fn(() => Promise.resolve({ name: 'Rendering' })),
  detectPatterns: jest.fn(() => Promise.resolve([])),
  getBestPractices: jest.fn(() => ({
    name: 'UPROPERTY Macro',
    description: '',
    bestPractices: [],
    documentation: '',
    examples: [],
    relatedPatterns: [],
  })),
  queryApiReference: jest.fn(() => Promise.resolve([])),
});

describe('UnrealAnalyzerServer default construction', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('constructs MCP server with expected metadata', async () => {
    const mockServerInstance = createMockServer();
    const mockServerConstructor = jest.fn(() => mockServerInstance);

    await jest.unstable_mockModule('@modelcontextprotocol/sdk/server/index.js', () => ({
      Server: mockServerConstructor,
    }));
    await jest.unstable_mockModule('@modelcontextprotocol/sdk/server/stdio.js', () => ({
      StdioServerTransport: class {},
    }));

    const { UnrealAnalyzerServer } = await import('../index.js');
    new UnrealAnalyzerServer({ registerProcessHandlers: false });

    expect(mockServerConstructor).toHaveBeenCalledWith(
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
});

describe('UnrealAnalyzerServer request handlers', () => {
  let UnrealAnalyzerServer: typeof import('../index.js').UnrealAnalyzerServer;
  let mockServer: ReturnType<typeof createMockServer>;
  let mockAnalyzer: ReturnType<typeof createMockAnalyzer>;
  let listToolsHandler: (request: any, extra?: any) => any;
  let callToolHandler: (request: any, extra?: any) => any;

  beforeEach(async () => {
    jest.resetModules();
    ({ UnrealAnalyzerServer } = await import('../index.js'));

    mockServer = createMockServer();
    const toolHandlers = new Map<any, Function>();
    const setRequestHandlerMock = mockServer.setRequestHandler as jest.MockedFunction<(schema: unknown, handler: Function) => void>;
    setRequestHandlerMock.mockImplementation((schema: any, handler: Function) => {
      const methodKey = schema?.shape?.method?.value ?? schema?.shape?.method?._def?.value ?? schema?.shape?.method;
      toolHandlers.set(methodKey, handler);
    });

    mockAnalyzer = createMockAnalyzer();

    new UnrealAnalyzerServer({
      server: mockServer as any,
      analyzer: mockAnalyzer as any,
      registerProcessHandlers: false,
    });

    listToolsHandler = toolHandlers.get('tools/list') as typeof listToolsHandler;
    callToolHandler = toolHandlers.get('tools/call') as typeof callToolHandler;

    if (!listToolsHandler || !callToolHandler) {
      throw new Error('Handlers not registered');
    }
  });

  it('registers list_tools and call_tool handlers', () => {
    expect(typeof listToolsHandler).toBe('function');
    expect(typeof callToolHandler).toBe('function');
    expect(mockServer.onerror).toEqual(expect.any(Function));
  });

  it('returns available tools', async () => {
    const result = await listToolsHandler({ method: 'tools/list' }, {});
    const toolNames = result.tools.map((tool: any) => tool.name);
    expect(toolNames).toEqual(expect.arrayContaining([
      'set_unreal_path',
      'analyze_class',
      'query_api',
    ]));
  });

  it('enforces initialization requirement for analysis tools', async () => {
    (mockAnalyzer.isInitialized as jest.Mock).mockReturnValue(false);
    await expect(
      callToolHandler({
        method: 'tools/call',
        params: { name: 'analyze_class', arguments: { className: 'TestClass' } },
      }, {})
    ).rejects.toThrow('No codebase initialized');
  });

  it('handles set_unreal_path tool', async () => {
    const response = await callToolHandler({
      method: 'tools/call',
      params: { name: 'set_unreal_path', arguments: { path: '/mock/path' } },
    }, {});

    expect(mockAnalyzer.initialize).toHaveBeenCalledWith('/mock/path');
    expect(response.content[0].text).toContain('/mock/path');
  });

  it('handles set_custom_codebase tool', async () => {
    const response = await callToolHandler({
      method: 'tools/call',
      params: { name: 'set_custom_codebase', arguments: { path: '/custom/path' } },
    }, {});

    expect(mockAnalyzer.initializeCustomCodebase).toHaveBeenCalledWith('/custom/path');
    expect(response.content[0].text).toContain('/custom/path');
  });

  it('returns analyzer results for analyze_class', async () => {
    const result = await callToolHandler({
      method: 'tools/call',
      params: { name: 'analyze_class', arguments: { className: 'TestClass' } },
    }, {});

    expect(mockAnalyzer.analyzeClass).toHaveBeenCalledWith('TestClass');
    const payload = JSON.parse(result.content[0].text);
    expect(payload).toEqual(expect.objectContaining({ name: 'TestClass' }));
  });

  it('returns search results', async () => {
    (mockAnalyzer.searchCode as jest.Mock).mockImplementation(() => Promise.resolve([{ file: 'test.cpp' }]));
    const result = await callToolHandler({
      method: 'tools/call',
      params: { name: 'search_code', arguments: { query: 'Test', filePattern: '*.cpp', includeComments: true } },
    }, {});

    expect(mockAnalyzer.searchCode).toHaveBeenCalledWith('Test', '*.cpp', true);
    const searchPayload = JSON.parse(result.content[0].text);
    expect(searchPayload).toEqual([{ file: 'test.cpp' }]);
  });

  it('returns subsystem analysis', async () => {
    (mockAnalyzer.analyzeSubsystem as jest.Mock).mockImplementation(() => Promise.resolve({ name: 'Rendering' }));
    const result = await callToolHandler({
      method: 'tools/call',
      params: { name: 'analyze_subsystem', arguments: { subsystem: 'Rendering' } },
    }, {});

    expect(mockAnalyzer.analyzeSubsystem).toHaveBeenCalledWith('Rendering');
    const subsystemPayload = JSON.parse(result.content[0].text);
    expect(subsystemPayload).toEqual({ name: 'Rendering' });
  });

  it('handles query_api tool', async () => {
    (mockAnalyzer.queryApiReference as jest.Mock).mockImplementation(() => Promise.resolve([
      {
        reference: {
          className: 'Test',
          description: 'desc',
          module: 'Core',
          category: 'Actor',
          syntax: 'void Test()',
          examples: [],
          remarks: [],
        },
        context: 'context',
        relevance: 0.9,
        learningResources: [{ url: 'https://example.com' }],
      },
    ]));

    const result = await callToolHandler({
      method: 'tools/call',
      params: { name: 'query_api', arguments: { query: 'Test' } },
    }, {});

    expect(mockAnalyzer.queryApiReference).toHaveBeenCalledWith('Test', {
      category: undefined,
      includeExamples: undefined,
      maxResults: undefined,
      module: undefined,
    });
    expect(result.content[0].text).toContain('Test');
  });

  it('throws for unknown tools', async () => {
    await expect(
      callToolHandler({
        method: 'tools/call',
        params: { name: 'unknown_tool', arguments: {} },
      }, {})
    ).rejects.toThrow('Unknown tool: unknown_tool');
  });
});
