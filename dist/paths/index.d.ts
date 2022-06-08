import { T as TsConfigResult } from '../types-67cd9792.js';

/**
 * Reference:
 * https://github.com/microsoft/TypeScript/blob/3ccbe804f850f40d228d3c875be952d94d39aa1d/src/compiler/moduleNameResolver.ts#L2465
 */
declare function createPathsMatcher(tsconfig: TsConfigResult): ((specifier: string) => string[]) | null;

export { createPathsMatcher };
