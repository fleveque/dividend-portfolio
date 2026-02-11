import path from "path"
import { defineConfig, PluginOption } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'

// Custom plugin to trigger full page reload on React file changes
// (needed because @vitejs/plugin-react conflicts with vite-plugin-ruby)
function reactFullReload(): PluginOption {
  return {
    name: 'react-full-reload',
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        server.ws.send({ type: 'full-reload' })
        return []
      }
    },
  }
}

export default defineConfig({
  plugins: [
    RubyPlugin(),
    reactFullReload(),
  ],

  // Use esbuild for JSX transformation (built into Vite)
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },

  // Ensure all packages use the same React instance
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app/frontend"),
    },
    dedupe: ['react', 'react-dom'],
  },

  // Pre-bundle dependencies for faster dev startup
  optimizeDeps: {
    include: ['react', 'react-dom', '@tanstack/react-query'],
  },

  // Server configuration for devcontainer
  server: {
    host: '0.0.0.0',
    strictPort: true,
    hmr: {
      // For devcontainers: client connects to forwarded port on localhost
      clientPort: 3036,
    },
    // Enable polling for file watching (needed in Docker/WSL2)
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
})
