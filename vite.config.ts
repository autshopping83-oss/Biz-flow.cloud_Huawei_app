
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Aumenta o limite de aviso para 1600kB (aplicações modernas toleram chunks maiores)
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separa bibliotecas principais para cache eficiente
          'vendor-react': ['react', 'react-dom'],
          'vendor-utils': ['@supabase/supabase-js', '@google/genai']
        }
      }
    }
  }
});
