#!/bin/bash
# 完全修复部署脚本 - 解决 ERR_CONTENT_DECODING_FAILED 问题

echo "🔧 开始修复 ERR_CONTENT_DECODING_FAILED 问题..."

# 1. 清理 S3 上所有文件
echo "🗑️ 清理 S3 旧文件..."
aws s3 rm s3://www.potacademy.net --recursive --region ap-east-1

# 2. 重新构建（确保构建正确）
echo "🔨 重新构建项目..."
npm run build

# 3. 检查构建产物
echo "📊 检查构建产物..."
if [ ! -d "dist" ]; then
    echo "❌ 构建失败：dist 目录不存在"
    exit 1
fi

# 4. 修复 index.html 中的图标路径
echo "🔧 修复 index.html..."
if [ -f "dist/index.html" ]; then
    # 使用 sed 安全地替换路径
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's|<link rel="icon" type="image/svg+xml" href="./vite.svg" />|<link rel="icon" type="image/png" href="./assets/images/logo-DR0gg9cS.png" />|g' dist/index.html
    else
        # Linux/Windows Git Bash
        sed -i 's|<link rel="icon" type="image/svg+xml" href="./vite.svg" />|<link rel="icon" type="image/png" href="./assets/images/logo-DR0gg9cS.png" />|g' dist/index.html
    fi
fi

# 5. 上传 HTML 文件（最高优先级，确保正确的 MIME 类型）
echo "📄 上传 HTML 文件..."
aws s3 cp dist/index.html s3://www.potacademy.net/index.html \
  --region ap-east-1 \
  --content-type "text/html; charset=utf-8" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --metadata-directive REPLACE

# 6. 上传 JavaScript 文件（关键：确保正确的 MIME 类型，无压缩）
echo "📦 上传 JavaScript 文件..."
find dist/assets -name "*.js" | while read file; do
    filename=$(basename "$file")
    echo "上传 JS: $filename"
    
    # 关键修复：明确指定 Content-Type 和禁用压缩
    aws s3 cp "$file" "s3://www.potacademy.net/assets/$filename" \
      --region ap-east-1 \
      --content-type "application/javascript; charset=utf-8" \
      --cache-control "public, max-age=31536000, immutable" \
      --metadata-directive REPLACE \
      --no-cli-pager
    
    # 验证上传是否成功
    if [ $? -ne 0 ]; then
        echo "❌ 上传失败: $filename"
        exit 1
    fi
done

# 7. 上传 CSS 文件
echo "🎨 上传 CSS 文件..."
find dist/assets -name "*.css" | while read file; do
    relative_path=${file#dist/}
    echo "上传 CSS: $relative_path"
    
    aws s3 cp "$file" "s3://www.potacademy.net/$relative_path" \
      --region ap-east-1 \
      --content-type "text/css; charset=utf-8" \
      --cache-control "public, max-age=31536000, immutable" \
      --metadata-directive REPLACE
done

# 8. 上传图片文件
echo "🖼️ 上传图片文件..."
find dist/assets -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.svg" -o -name "*.gif" \) | while read file; do
    relative_path=${file#dist/}
    echo "上传图片: $relative_path"
    
    # 根据文件扩展名设置正确的 MIME 类型
    case "$file" in
        *.png) content_type="image/png" ;;
        *.jpg|*.jpeg) content_type="image/jpeg" ;;
        *.svg) content_type="image/svg+xml" ;;
        *.gif) content_type="image/gif" ;;
        *) content_type="application/octet-stream" ;;
    esac
    
    aws s3 cp "$file" "s3://www.potacademy.net/$relative_path" \
      --region ap-east-1 \
      --content-type "$content_type" \
      --cache-control "public, max-age=31536000, immutable" \
      --metadata-directive REPLACE
done

# 9. 上传其他静态文件
echo "📄 上传其他文件..."
if [ -f "dist/vite.svg" ]; then
    aws s3 cp dist/vite.svg s3://www.potacademy.net/vite.svg \
      --region ap-east-1 \
      --content-type "image/svg+xml" \
      --cache-control "public, max-age=31536000" \
      --metadata-directive REPLACE
fi

# 10. 验证关键文件的上传和 MIME 类型
echo "🔍 验证关键文件..."
echo "检查 S3 文件列表："
aws s3 ls s3://www.potacademy.net/ --region ap-east-1
aws s3 ls s3://www.potacademy.net/assets/ --region ap-east-1

# 11. 检查一个关键 JS 文件的元数据
echo "🔍 检查关键文件的元数据..."
JS_FILE=$(aws s3 ls s3://www.potacademy.net/assets/ --region ap-east-1 | grep "\.js$" | head -1 | awk '{print $4}')
if [ -n "$JS_FILE" ]; then
    echo "检查文件: $JS_FILE"
    aws s3api head-object --bucket www.potacademy.net --key "assets/$JS_FILE" --region ap-east-1
fi

echo "✅ 修复部署完成！"
echo ""
echo "🌐 请访问 https://www.potacademy.net 检查是否正常"
echo "🔧 如果仍有问题，请："
echo "   1. 清除浏览器缓存"
echo "   2. 检查浏览器开发者工具的网络面板"
echo "   3. 确认 CloudFront 缓存已清理"