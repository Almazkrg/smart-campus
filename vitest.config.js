import { defineConfig } from 'vitest/config';

// versions/ holds frozen earlier copies of the project; their tests must not run here.
export default defineConfig({ test: { exclude: ['node_modules/**', 'versions/**'] } });
