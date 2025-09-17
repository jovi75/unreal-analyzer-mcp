declare module 'tree-sitter' {
  export interface Query {
    matches(node: SyntaxNode): QueryMatch[];
  }

  export interface QueryMatch {
    pattern: number;
    captures: QueryCapture[];
  }

  export interface QueryCapture {
    name: string;
    node: SyntaxNode;
  }

  export interface Language {
    query(source: string): Query;
  }

  export class Parser {
    setLanguage(language: Language): void;
    parse(input: string): Tree;
    getLanguage(): Language;
  }

  export interface Tree {
    rootNode: SyntaxNode;
  }

  export interface SyntaxNode {
    type: string;
    text: string;
    startPosition: Position;
    endPosition: Position;
    children: SyntaxNode[];
    parent: SyntaxNode | null;
    descendantsOfType(type: string): SyntaxNode[];
    hasError: boolean;
  }

  export interface Position {
    row: number;
    column: number;
  }
}

declare module 'tree-sitter-cpp' {
  const language: import('tree-sitter').Language;
  export = language;
}
