// types/bun-types.d.ts
declare module 'bun:sqlite' {
  export class Database {
    constructor(
      filename?: string,
      options?: {
        readonly?: boolean;
        create?: boolean;
        timeout?: number;
      }
    );

    exec(sql: string): void;
    prepare(query: string): Statement;
    transaction<T extends (...args: any[]) => any>(
      fn: T
    ): ((...args: Parameters<T>) => ReturnType<T>) & {
      run: (...args: Parameters<T>) => void;
      rollback: (...args: Parameters<T>) => void;
    };

    close(): void;
    dump(): Buffer;

    // Properties
    readonly closed: boolean;
    readonly filepath: string;
    readonly in_transaction: boolean;
  }

  export class Statement {
    run(...params: any[]): any;
    get(...params: any[]): any;
    all(...params: any[]): any[];
    values(...params: any[]): any[][];
    iterate(...params: any[]): IterableIterator<any>;
  }
}