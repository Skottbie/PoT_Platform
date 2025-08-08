// scripts/s3-deploy.js
// 这是一个使用 ES 模块语法的 S3 部署脚本
import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 为了在 ES 模块中正确获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 开始 S3 优化部署...');

// 1. 构建项目
console.log('📦 构建项目...');
execSync('npm run build', { stdio: 'inherit' });

// 2. 统一上传所有文件
console.log('📁 上传所有文件...');
execSync('aws s3 sync dist/ s3://www.potacademy.net/ --delete --region ap-east-1', { stdio: 'inherit' });

// 3. 设置静态资源缓存
console.log('🔧 设置缓存策略...');
execSync('aws s3 cp s3://www.potacademy.net/assets/ s3://www.potacademy.net/assets/ --recursive --region ap-east-1 --metadata-directive REPLACE --cache-control "public,max-age=31536000,immutable"', { stdio: 'inherit' });

// 4. 单独处理 index.html（添加预连接头）
console.log('🔧 优化 index.html...');
execSync('aws s3 cp dist/index.html s3://www.potacademy.net/index.html --region ap-east-1 --content-type "text/html" --cache-control "no-cache" --metadata "preconnect=https://api.potacademy.net"', { stdio: 'inherit' });

console.log('✅ S3 部署完成！');

// 5. 输出优化报告
const assetsDir = path.join(__dirname, '../dist/assets');
if (existsSync(assetsDir)) {
  const files = readdirSync(assetsDir);
  const jsFiles = files.filter(f => f.endsWith('.js'));
  const cssFiles = files.filter(f => f.endsWith('.css'));
  
  console.log('\n📊 部署统计:');
  console.log(`JavaScript 文件: ${jsFiles.length}`);
  console.log(`CSS 文件: ${cssFiles.length}`);
  console.log(`总文件数: ${files.length}`);
}
