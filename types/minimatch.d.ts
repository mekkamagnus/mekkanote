// Temporary declaration to resolve TypeScript issue with minimatch
declare module "minimatch" {
  export function minimatch(version: string, range: string, options?: any): boolean;
  export class Minimatch {
    constructor(pattern: string, options?: any);
    match(name: string): boolean;
    set: string[][];
    pattern: string;
  }
}