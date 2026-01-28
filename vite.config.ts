import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'

export default defineConfig({
  plugins: [
    // RubyPlugin connects Vite to Rails
    // Note: @vitejs/plugin-react-swc conflicts with vite-plugin-ruby (preamble error)
    RubyPlugin(),
  ],

  // Use esbuild for JSX transformation (built into Vite)
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },

  // Ensure all packages use the same React instance
  resolve: {
    dedupe: ['react', 'react-dom'],
  },

  // Pre-bundle dependencies for faster dev startup
  optimizeDeps: {
    include: ['react', 'react-dom', '@tanstack/react-query'],
  },

  // Server configuration for devcontainers
  server: {
    host: '0.0.0.0',
    hmr: {
      host: 'localhost',
    },
  },
})
