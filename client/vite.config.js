import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // 🚀 开发服务器优化
  server: {
    host: true,
    port: 5173,
    warmup: {
      clientFiles: [
        './src/main.jsx',
        './src/App.jsx', 
        './src/pages/Login.jsx',
        './src/pages/StudentDashboard.jsx',
        './src/pages/TeacherDashboard.jsx'
      ]
    }
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'react-hot-toast', 'clsx'],
          'vendor-modal': ['react-modal'],
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
          'vendor-syntax': ['react-syntax-highlighter'],
          'vendor-utils': ['axios', 'papaparse']
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        unsafe: false,
        unsafe_comps: false,
        passes: 2,
        reduce_vars: true,
        reduce_funcs: false
      },
      mangle: {
        safari10: true,
        toplevel: false
      },
      format: {
        ascii_only: true,
        beautify: false,
        comments: false
      }
    },
    
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    cssCodeSplit: true,
    cssMinify: true,
    reportCompressedSize: false,
    target: ['es2020', 'chrome80', 'safari14', 'firefox78'],
    emptyOutDir: true,
    assetsInlineLimit: 4096,
    watch: null
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom', 
      'react-router-dom',
      'axios',
      'framer-motion'
    ],
    force: false
  },

  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    jsx: 'automatic',
    target: 'es2020'
  },

  // 🔧 关键修复：使用绝对路径
  base: '/',
  
  preview: {
    port: 4173,
    host: true
  }
})
