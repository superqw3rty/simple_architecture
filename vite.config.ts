import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// BASE_PATH is set by the GitHub Pages workflow to "/<repo-name>/".
export default defineConfig(({ command }) => {
  return {
    base: process.env.BASE_PATH ?? '/',
    plugins: [react()],
    css: {
      modules: {
        // dev: readable (Header__title__aB3xZ); build: short hash (aB3xZ)
        generateScopedName:
          command === 'build' ? '[hash:base64:5]' : '[name]__[local]__[hash:base64:5]',
        localsConvention: 'camelCase',
      },
      preprocessorOptions: {
        scss: {
          // Mixins (screen-from, screen-below, visually-hidden) are available in every SCSS file without a manual @use.
          additionalData: (source: string, filename: string) =>
            /[\\/]styles[\\/](breakpoints|mixins)\.scss$/.test(filename)
              ? source
              : `@use '@/styles/breakpoints' as *;\n@use '@/styles/mixins' as *;\n${source}`,
        },
      },
    },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.ts'],
      restoreMocks: true,
    },
  };
});
