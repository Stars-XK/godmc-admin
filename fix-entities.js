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

const libFiles = walk('server/libs/common/src/entities');

libFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/from '@app\/common'/g, "from './base'");
  content = content.replace(/from '@app\/common\/utils\/index'/g, "from '../utils/index'");

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
  }
});
