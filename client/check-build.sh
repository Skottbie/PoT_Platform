# client/check-build.sh 
#!/bin/bash

echo "🔍 构建结果检查..."

# 1. 检查dist目录大小
DIST_SIZE=$(du -sh dist | cut -f1)
echo "📦 构建产物大小: $DIST_SIZE"

# 2. 检查JS文件数量和大小
echo "📄 JavaScript文件:"
find dist/assets -name "*.js" -exec ls -lh {} \; | awk '{print $5 " " $9}'

# 3. 检查CSS文件
echo "🎨 CSS文件:"
find dist/assets -name "*.css" -exec ls -lh {} \; | awk '{print $5 " " $9}'

# 4. 检查是否有source map（应该没有）
SOURCE_MAPS=$(find dist -name "*.map" | wc -l)
if [ $SOURCE_MAPS -eq 0 ]; then
    echo "✅ 无source map文件（正确）"
else
    echo "⚠️  发现 $SOURCE_MAPS 个source map文件"
fi

# 5. 检查gzip后大小
echo "🗜️  Gzip压缩后大小:"
find dist/assets -name "*.js" | while read file; do
    ORIGINAL=$(wc -c < "$file")
    GZIPPED=$(gzip -c "$file" | wc -c)
    RATIO=$(echo "scale=1; $GZIPPED*100/$ORIGINAL" | bc)
    echo "$(basename $file): $ORIGINAL -> $GZIPPED bytes (${RATIO}%)"
done