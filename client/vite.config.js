import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'react-hot-toast'],
          'vendor-modal': ['react-modal'], // 分离modal
          'vendor-markdown': ['react-markdown', 'remark-gfm'], // 分离markdown
          'vendor-syntax': ['react-syntax-highlighter'], // 独立语法高亮
          'vendor-utils': ['axios', 'papaparse', 'clsx']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        // 更激进的压缩
        unsafe: true,
        unsafe_comps: true,
        passes: 2
      },
      mangle: {
        safari10: true
      }
    },
    chunkSizeWarningLimit: 500, // 降低警告阈值
    sourcemap: false
  }
})