const fs = require('fs');
const path = require('path');

const GATEWAY_MODULES_DIR = path.join(__dirname, 'server/apps/api-gateway/src/module');
const MICROSERVICES_DIR = path.join(__dirname, 'server/apps');

// 映射网关模块到具体的子微服务
const moduleMapping = {
  'system': 'micro-system',
  'monitor': 'micro-monitor',
  'upload': 'micro-upload'
};

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      // 检查微服务是否已经有同名文件
      if (fs.existsSync(destPath)) {
        // 对于 controller, 我们直接覆盖，因为我们要将 HTTP controller 迁移过去
        if (entry.name.endsWith('.controller.ts')) {
          fs.copyFileSync(srcPath, destPath);
        } else if (entry.name.endsWith('.service.ts')) {
          // Service 需要特殊处理：网关里的 service 是代理，子微服务里的是真实逻辑
          // 所以我们不能覆盖微服务里的 service！但是对于 import/export 等基于 HTTP 的方法，
          // 我们需要合并。为了脚本安全，我们只移动 DTO 和覆盖 Controller。
          // 真正的 service 逻辑合并需要通过正则/AST，这里我们跳过 service 覆盖，保留微服务原本的 service。
        } else {
          // dto, types, enum 等，如果不存在则复制，如果存在则覆盖（通常网关的更全）
          fs.copyFileSync(srcPath, destPath);
        }
      } else {
        // 微服务中不存在的文件，直接复制过去
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// 遍历网关的模块
for (const [gatewayModuleName, microserviceName] of Object.entries(moduleMapping)) {
  const srcDir = path.join(GATEWAY_MODULES_DIR, gatewayModuleName);
  const destDir = path.join(MICROSERVICES_DIR, microserviceName, 'src/module', gatewayModuleName);
  
  if (fs.existsSync(srcDir)) {
    console.log(`Migrating ${gatewayModuleName} to ${microserviceName}...`);
    // 复制并合并文件夹
    copyDirectory(srcDir, destDir);
    console.log(`Completed migration of ${gatewayModuleName}`);
  }
}
