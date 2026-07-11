import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'coverage/bundle-report.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
    watch: {
      ignored: (path) => {
        if (path.includes('.agents') || path.includes('scratch')) return true;
        if (path.endsWith('.html') && !path.endsWith('index.html')) return true;
        return false;
      },
    },
  },
  build: {
    target: 'es2022',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router-dom')
          )
            return 'react-vendor';
          if (id.includes('node_modules/@google/generative-ai')) return 'ai-vendor';
          if (id.includes('node_modules/dompurify') || id.includes('node_modules/lucide-react'))
            return 'ui-vendor';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['node_modules', 'e2e', 'dist', '.agents'],
    setupFiles: './src/setupTests.js',
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.test.{js,jsx}',
        'src/setupTests.js',
        'src/main.jsx',
        'src/data/mockContext.json',
      ],
      thresholds: {
        statements: 83,
        branches: 72,
        functions: 86,
        lines: 84,
      },
    },
  },
});
