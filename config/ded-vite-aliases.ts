import { resolve } from 'node:path';

/**
 * Vite/Vitest resolve aliases for @ded workspace packages.
 * Trailing slashes are required so subpaths like `@ded/engine/foo.js` resolve correctly.
 */
export function createDedAliases(root: string): Record<string, string> {
  return {
    '@data/': resolve(root, 'data/'),
    '@ded/types/': resolve(root, 'packages/types/src/'),
    '@ded/engine/': resolve(root, 'packages/engine/src/'),
    '@ded/network/': resolve(root, 'packages/network/src/'),
    '@ded/game-logic/': resolve(root, 'packages/game-logic/src/'),
  };
}
