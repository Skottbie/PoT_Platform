#!/bin/bash
# cloudflare_spa_fix.sh - 修复Cloudflare + S3 SPA路由问题

echo "🌐 修复Cloudflare SPA路由配置..."

# 1. 修复 Vite 配置 - 确保使用绝对路径
echo "🔧 更新 Vite 配置..."
cat > vite.config.js << 'EOF'
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
EOF

# 2. 更新 index.html 确保使用绝对路径
echo "📝 更新 index.html..."
cat > index.html << 'EOF'
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta name="color-scheme" content="light dark">
    <meta charset="UTF-8" />
    
    <!-- 🚀 关键资源预加载优化 -->
    <link rel="preconnect" href="https://api.potacademy.net" crossorigin>
    <link rel="dns-prefetch" href="https://api.potacademy.net">
    
    <!-- 🔧 修复：使用绝对路径的 logo -->
    <link rel="icon" type="image/png" href="/src/assets/logo.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- 🎯 SEO优化 -->
    <title>PoTAcademy - AI时代教学新范式</title>
    <meta name="description" content="AI时代教学新范式，负责任使用AI教学管理平台">
    
    <!-- 🔧 性能提示 -->
    <meta name="resource-hints" content="preconnect, dns-prefetch">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# 3. 创建 Cloudflare Pages 配置文件
echo "☁️ 创建 Cloudflare Pages 配置..."
mkdir -p public

# _redirects 文件用于 Cloudflare Pages
cat > public/_redirects << 'EOF'
# SPA路由重定向 - Cloudflare Pages
/*    /index.html   200
EOF

# _headers 文件用于设置安全头
cat > public/_headers << 'EOF'
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: no-cache, no-store, must-revalidate
EOF

# 4. 创建用于S3+Cloudflare的部署脚本
cat > deploy_cloudflare_s3.sh << 'EOF'
#!/bin/bash
echo "🚀 部署到 S3 + Cloudflare..."

# 重新构建
npm run build

# 确保 dist 目录存在 _redirects
cp public/_redirects dist/ 2>/dev/null || true

# 清理 S3
aws s3 rm s3://www.potacademy.net --recursive --region ap-east-1

# 上传所有文件
aws s3 sync dist/ s3://www.potacademy.net/ --delete --region ap-east-1

# 设置 HTML 文件不缓存
find dist -name "*.html" -exec basename {} \; | while read file; do
  aws s3 cp "dist/$file" "s3://www.potacademy.net/$file" \
    --region ap-east-1 \
    --content-type "text/html; charset=utf-8" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --metadata-directive REPLACE
done

# 设置静态资源长期缓存
aws s3 cp s3://www.potacademy.net/assets/ s3://www.potacademy.net/assets/ \
  --recursive --region ap-east-1 \
  --metadata-directive REPLACE \
  --cache-control "public,max-age=31536000,immutable"

echo "✅ 部署完成！"
echo "🌐 请在 Cloudflare 控制台配置页面规则："
echo "   URL: www.potacademy.net/*"
echo "   设置: Browser Cache TTL = 4 hours"
echo "   设置: Edge Cache TTL = 2 hours"
echo "   设置: Origin Cache Control = On"
EOF

chmod +x deploy_cloudflare_s3.sh

# 5. 重新构建和部署
echo "🔨 重新构建应用..."
npm run build

# 检查构建结果的路径
echo "🔍 检查构建结果..."
if [ -f "dist/index.html" ]; then
    echo "✅ index.html 存在"
    grep -n "assets/" dist/index.html | head -3
else
    echo "❌ index.html 不存在"
fi

# 复制重定向文件到构建目录
cp public/_redirects dist/ 2>/dev/null || echo "⚠️ _redirects 文件不存在"

# 清理并重新上传
echo "🧹 清理 S3..."
aws s3 rm s3://www.potacademy.net --recursive --region ap-east-1

echo "📤 上传新文件..."
aws s3 sync dist/ s3://www.potacademy.net/ --delete --region ap-east-1

# 特别设置 HTML 文件
echo "🔧 配置 HTML 缓存..."
aws s3 cp dist/index.html s3://www.potacademy.net/index.html \
  --region ap-east-1 \
  --content-type "text/html; charset=utf-8" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --metadata-directive REPLACE

echo "✅ Cloudflare SPA 修复完成！"
echo ""
echo "🌐 现在请在 Cloudflare 控制台配置页面规则："
echo "   1. 进入 Cloudflare 控制台"
echo "   2. 选择 potacademy.net 域名"
echo "   3. 进入 'Page Rules'"
echo "   4. 创建页面规则："
echo "      URL: *potacademy.net/*"
echo "      设置: Forwarding URL = 302 重定向"
echo "      目标: https://www.potacademy.net/\$1"
echo ""
echo "   5. 创建另一个页面规则："
echo "      URL: www.potacademy.net/*"
echo "      设置: Always Use HTTPS = On"
echo "      设置: Browser Cache TTL = 4 hours"
echo ""
echo "🔍 如果问题仍然存在，请检查："
echo "   - Cloudflare DNS 设置是否正确"
echo "   - S3 bucket 网站托管配置"
echo "   - Cloudflare Page Rules 是否生效"
EOF

chmod +x cloudflare_spa_fix.sh
echo "✅ 修复脚本已创建，请运行: ./cloudflare_spa_fix.sh"