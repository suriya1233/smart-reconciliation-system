import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Gzip compression
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    // Brotli compression (better than gzip)
    compression({
      algorithm: 'brotliCompress',
      ext: '.br'
    })
  ],

  build: {
    sourcemap: false, // Disable sourcemaps in production for smaller bundles
    minify: 'esbuild', // Fast minification
    rollupOptions: {
      output: {
        // Code splitting for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase warning limit for vendor chunks
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],
})
