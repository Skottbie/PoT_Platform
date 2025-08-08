import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // 🚀 开发服务器优化
  server: {
    host: true,
    port: 5173,
    // 预热经常访问的文件
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
    // 🎯 优化分包策略，提升缓存命中率
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心React库 - 变化最少，缓存时间最长
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // UI库 - 相对稳定
          'vendor-ui': ['framer-motion', 'react-hot-toast', 'clsx'],
          
          // 大型组件库 - 独立分包
          'vendor-modal': ['react-modal'],
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
          'vendor-syntax': ['react-syntax-highlighter'],
          
          // 工具库 - 更新频率中等
          'vendor-utils': ['axios', 'papaparse'],
          
          // 🚀 修复：使用正确的路径格式进行页面分包
          'pages-auth': [
            '/src/pages/Login.jsx',
            '/src/pages/Register.jsx'
          ],
          'pages-dashboard': [
            '/src/pages/StudentDashboard.jsx', 
            '/src/pages/TeacherDashboard.jsx'
          ]
        },
        // 🔧 确保所有 JS 文件都有正确的扩展名
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
    
    // 🎯 压缩优化 - 针对广深网络环境
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        // 针对移动端网络优化
        unsafe: true,
        unsafe_comps: true,
        passes: 3, // 增加压缩轮数
        reduce_vars: true,
        reduce_funcs: true
      },
      mangle: {
        safari10: true,
        // 保持函数名简短
        toplevel: true
      }
    },
    
    // 🚀 关键优化：更激进的分包大小
    chunkSizeWarningLimit: 300, // 降低至300KB
    sourcemap: false,
    
    // 🎯 CSS优化
    cssCodeSplit: true,
    cssMinify: true,
    
    // 📦 压缩优化
    reportCompressedSize: false, // 构建时跳过大小报告，提升构建速度
    
    // 🚀 现代浏览器优化
    target: ['es2015', 'chrome79', 'safari13'],
    
    // 🔧 确保输出目录清理
    emptyOutDir: true
  },
  
  // 🎯 预加载优化
  optimizeDeps: {
    include: [
      'react',
      'react-dom', 
      'react-router-dom',
      'axios',
      'framer-motion'
    ],
    // 强制预构建，避免首次加载时的依赖发现
    force: true
  },

  // 🚀 esbuild 优化
  esbuild: {
    // 移除所有调试代码
    drop: ['console', 'debugger'],
    // 最小化标识符名称
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    // 🔧 确保 JSX 文件正确转换
    jsx: 'automatic'
  }
})