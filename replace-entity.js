const fs = require('fs');
const path = require('path');

// 指向项目的实体类目录
const targetDir = path.resolve(__dirname, 'server/libs/common/src/entities');

// 需要排除的文件
const excludeFiles = ['job.entity.ts', 'menu.entity.ts'];

// 递归遍历目录文件
function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walk(filepath, callback);
    } else if (stats.isFile() && filepath.endsWith('.ts')) {
      callback(filepath);
    }
  });
}

let modifiedCount = 0;

walk(targetDir, (filepath) => {
  const filename = path.basename(filepath);
  
  // 过滤掉需要排除的文件
  if (excludeFiles.includes(filename)) {
    return;
  }

  let content = fs.readFileSync(filepath, 'utf8');
  let isModified = false;

  // 检查是否包含 extends BaseEntity
  if (content.includes('extends BaseEntity')) {
    // 1. 替换类继承 (例如: class SysNoticeEntity extends BaseEntity)
    content = content.replace(/extends\s+BaseEntity\b/g, 'extends FullBaseEntity');
    
    // 2. 替换导入语句 (例如: import { BaseEntity } from './base')
    content = content.replace(/import\s*\{\s*BaseEntity\s*\}\s*from/g, 'import { FullBaseEntity } from');
    content = content.replace(/import\s*\{\s*DeleteStatusEntity,\s*BaseEntity\s*\}\s*from/g, 'import { DeleteStatusEntity, FullBaseEntity } from');
    
    isModified = true;
  }

  if (isModified) {
    fs.writeFileSync(filepath, content, 'utf8');
    modifiedCount++;
    console.log(`[已修改] ${filepath}`);
  }
});

console.log(`\n替换完成！共修改了 ${modifiedCount} 个文件。`);