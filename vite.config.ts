import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'

export default defineConfig({
  plugins: [
    // RubyPlugin connects Vite to Rails
    RubyPlugin(),
    // Temporarily not using React plugin to debug preamble issue
  ],

  // Use esbuild for JSX transformation (built into Vite)
  // This works without the React plugin's Fast Refresh
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },

  // Server configuration for devcontainers
  server: {
    host: '0.0.0.0',
    hmr: {
      host: 'localhost',
    },
  },
})
