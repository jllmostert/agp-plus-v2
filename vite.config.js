import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'lucide': ['lucide-react'],
        },
      },
    },
    
    // Increase chunk size warning limit for medical data processing
    chunkSizeWarningLimit: 1000,
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@core': '/src/core',
      '@components': '/src/components',
      '@hooks': '/src/hooks',
      '@styles': '/src/styles',
    },
  },
});
