import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Gemini বা অন্যান্য API Key-এর জন্য
        'process.env': env
      },
      resolve: {
        alias: {
          // এখন থেকে @ লিখলে সে সরাসরি src ফোল্ডারকে বুঝবে
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false
      }
    };
});
