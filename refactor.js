const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('server/apps/api-gateway/src');
files.push('server/apps/api-gateway/src/app.module.ts');
files.push('server/apps/api-gateway/src/main.ts');
const libFiles = walk('server/libs/common/src');
files.push(...libFiles);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace "src/common/xxx" -> "@app/common/xxx"
  content = content.replace(/['"]src\/common\/(.*?)['"]/g, "'@app/common/$1'");
  
  // Replace "src/config/xxx" -> "@app/common/config/xxx"
  content = content.replace(/['"]src\/config\/(.*?)['"]/g, "'@app/common/config/$1'");
  
  // Replace "src/config" -> "@app/common/config"
  content = content.replace(/['"]src\/config['"]/g, "'@app/common/config'");

  // Replace "src/utils/xxx" -> "@app/common/utils/xxx"
  content = content.replace(/['"]src\/utils\/(.*?)['"]/g, "'@app/common/utils/$1'");

  // Replace "src/module/common/xxx" -> "@app/common/shared/xxx"
  content = content.replace(/['"]src\/module\/common\/(.*?)['"]/g, "'@app/common/shared/$1'");

  // Replace "src/module/xxx" -> "@app/api-gateway/module/xxx"
  content = content.replace(/['"]src\/module\/(.*?)['"]/g, "'@app/api-gateway/module/$1'");

  // Also replace some relative paths in libs/common
  content = content.replace(/['"]\.\.\/\.\.\/module\/system\/config\/config\.service['"]/g, "'@app/api-gateway/module/system/config/config.service'");
  content = content.replace(/['"]\.\.\/\.\.\/module\/common\/redis\/redis\.service['"]/g, "'@app/common/shared/redis/redis.service'");

  
  // Replace relative entity imports
  content = content.replace(/from\s+['"]\.\.\/entities\/(.*?)['"]/g, "from '@app/common'");
  content = content.replace(/from\s+['"]\.\/entities\/(.*?)['"]/g, "from '@app/common'");
  content = content.replace(/from\s+['"]\.\.\/\.\.\/entities\/(.*?)['"]/g, "from '@app/common'");

  // some might just be importing entities
  content = content.replace(/from\s+['"].*?entities\/(.*?)['"]/g, "from '@app/common'");
  
  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
  }
});
