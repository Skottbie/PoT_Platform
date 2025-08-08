#!/bin/bash
# 紧急修复脚本 - 解决压缩和编码问题

echo "🚨 开始紧急修复部署问题..."

# 1. 首先修复 index.html 中的图标路径
echo "🔧 修复 index.html..."
sed -i 's|<link rel="icon" type="image/svg+xml" href="./vite.svg" />|<link rel="icon" type="image/png" href="./assets/images/logo-DR0gg9cS.png" />|g' dist/index.html

# 2. 清除 S3 上所有旧文件
echo "🗑️ 清理 S3 旧文件..."
aws s3 rm s3://www.potacademy.net --recursive --region ap-east-1

# 3. 上传所有文件，明确禁用压缩
echo "📤 重新上传所有文件（禁用压缩）..."

# 上传 HTML 文件
echo "📄 上传 HTML..."
aws s3 cp dist/index.html s3://www.potacademy.net/index.html \
  --content-type "text/html" \
  --cache-control "no-cache" \
  --content-encoding "" \
  --region ap-east-1

# 上传 JS 文件 - 明确指定不压缩
echo "📦 上传 JS 文件..."
find dist/assets -name "*.js" | while read file; do
    filename=$(basename "$file")
    echo "上传 JS: $filename"
    aws s3 cp "$file" "s3://www.potacademy.net/assets/$filename" \
      --content-type "application/javascript" \
      --cache-control "public,max-age=31536000" \
      --content-encoding "" \
      --region ap-east-1
done

# 上传 CSS 文件
echo "🎨 上传 CSS 文件..."
find dist/assets -name "*.css" | while read file; do
    # 保持 CSS 的目录结构
    relative_path=${file#dist/}
    echo "上传 CSS: $relative_path"
    aws s3 cp "$file" "s3://www.potacademy.net/$relative_path" \
      --content-type "text/css" \
      --cache-control "public,max-age=31536000" \
      --content-encoding "" \
      --region ap-east-1
done

# 上传图片文件
echo "🖼️ 上传图片文件..."
find dist/assets -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.svg" | while read file; do
    relative_path=${file#dist/}
    echo "上传图片: $relative_path"
    # 根据文件扩展名设置正确的 MIME 类型
    case "$file" in
        *.png) content_type="image/png" ;;
        *.jpg|*.jpeg) content_type="image/jpeg" ;;
        *.svg) content_type="image/svg+xml" ;;
        *) content_type="application/octet-stream" ;;
    esac
    
    aws s3 cp "$file" "s3://www.potacademy.net/$relative_path" \
      --content-type "$content_type" \
      --cache-control "public,max-age=31536000" \
      --content-encoding "" \
      --region ap-east-1
done

# 上传 vite.svg 文件（如果存在）
if [ -f "dist/vite.svg" ]; then
    echo "📄 上传 vite.svg..."
    aws s3 cp dist/vite.svg s3://www.potacademy.net/vite.svg \
      --content-type "image/svg+xml" \
      --cache-control "public,max-age=31536000" \
      --content-encoding "" \
      --region ap-east-1
fi

echo "✅ 紧急修复完成！"
echo "🔍 验证文件上传..."

# 验证关键文件
echo "检查关键文件："
aws s3 ls s3://www.potacademy.net/ --region ap-east-1
aws s3 ls s3://www.potacademy.net/assets/ --region ap-east-1

echo "🌐 请访问 https://www.potacademy.net 检查是否正常"
echo "🔧 如果仍有问题，请检查浏览器开发者工具的网络面板"