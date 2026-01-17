import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Paviotti Gestión Vehicular',
        short_name: 'Paviotti',
        description: 'Sistema de Gestión de Flota Paviotti',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      }
    })
  ],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },

  // 🚀 Optimizaciones de Build
  build: {
    // Aumentar límite de warning a 1000 kB
    chunkSizeWarningLimit: 1000,

    // Rollup options para code splitting
    rollupOptions: {
      output: {
        // Separar código vendor automáticamente por node_modules
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Separar React en su propio chunk
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }

            // Separar gráficos en su propio chunk
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }

            // Todo lo demás de node_modules va a vendor
            return 'vendor';
          }
        },

        // Nombres de archivo optimizados
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },

    // Minificación con esbuild (más rápido y compatible)
    minify: 'esbuild',

    // Source maps solo en desarrollo
    sourcemap: false,

    // Reportar tamaños comprimidos
    reportCompressedSize: true
  },

  // Optimizaciones de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios'
    ]
  }
})
