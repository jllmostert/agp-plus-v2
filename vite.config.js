import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json as fallback
const packageJson = JSON.parse(
  readFileSync(join(__dirname, 'package.json'), 'utf-8')
);

export default {
  // Base URL for custom domain
  base: '/',
  
  // Build output
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Generate source maps for debugging
    sourcemap: false,
    // Optimize chunks
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'pdf-vendor': ['pdfjs-dist'],
        }
      }
    }
  },
  
  server: {
    port: 3001,
    open: true,
    host: true,
  },
  
  define: {
    // Inject version at build time (fallback to package.json if .env missing)
    '__APP_VERSION__': JSON.stringify(process.env.VITE_APP_VERSION || packageJson.version),
  },
};
