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
          'vendor-utils': ['axios', 'papaparse']
        },
        // 🔧 确保所有文件都有正确的扩展名和命名
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
    
    // 🎯 关键修复：使用更保守的压缩设置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        // 🔧 使用更保守的压缩选项，避免编码问题
        unsafe: false,
        unsafe_comps: false,
        passes: 2, // 减少压缩轮数
        reduce_vars: true,
        reduce_funcs: false // 关闭函数简化，避免潜在问题
      },
      mangle: {
        safari10: true,
        // 🔧 保守的标识符混淆
        toplevel: false
      },
      format: {
        // 🔧 确保输出格式兼容性
        ascii_only: true, // 确保只使用 ASCII 字符
        beautify: false,
        comments: false
      }
    },
    
    // 🚀 调整分包大小限制
    chunkSizeWarningLimit: 500, // 提高到 500KB，减少过度分包
    sourcemap: false,
    
    // 🎯 CSS优化
    cssCodeSplit: true,
    cssMinify: true,
    
    // 📦 关闭压缩大小报告
    reportCompressedSize: false,
    
    // 🚀 兼容性目标 - 确保广泛兼容性
    target: ['es2020', 'chrome80', 'safari14', 'firefox78'],
    
    // 🔧 确保输出目录清理
    emptyOutDir: true,
    
    // 🔧 关键修复：确保正确的文件输出
    assetsInlineLimit: 4096, // 4KB 以下的资源内联
    
    // 🔧 确保构建过程稳定
    watch: null
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
    force: false // 改为 false，避免不必要的重建
  },

  // 🚀 esbuild 优化 - 使用更保守的设置
  esbuild: {
    // 保留必要的调试信息用于生产环境故障排查
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // 🔧 保守的压缩设置
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    // 🔧 确保 JSX 转换正确
    jsx: 'automatic',
    target: 'es2020'
  },

  // 🔧 新增：确保正确的基础路径
  base: './',
  
  // 🔧 新增：预览配置
  preview: {
    port: 4173,
    host: true
  }
})