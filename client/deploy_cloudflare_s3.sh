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
