const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (file.indexOf('node_modules') === -1 && file.indexOf('dist') === -1) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('server/apps');
files.push(...walk('server/libs/common/src'));
files.push(...walk('server/libs/shared/src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replacements
  // from '@app/common/shared/common.module' -> from '@app/shared'
  content = content.replace(/from '@app\/common\/shared\/common\.module'/g, "from '@app/shared'");
  content = content.replace(/from '@app\/common\/shared\/redis\/redis\.service'/g, "from '@app/shared'");
  content = content.replace(/from '@app\/common\/shared\/axios\/axios\.service'/g, "from '@app/shared'");
  content = content.replace(/from '@app\/common\/config\/index'/g, "from '@app/shared'");
  content = content.replace(/from '@app\/common\/config'/g, "from '@app/shared'");
  
  // What if they imported CommonModule from '@app/common'?
  // Replace CommonModule with SharedModule
  content = content.replace(/\bCommonModule\b/g, 'SharedModule');

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
  }
});
