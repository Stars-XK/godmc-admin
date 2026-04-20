const yaml = require('js-yaml');
const fs = require('fs');
const doc = yaml.load(fs.readFileSync('server/libs/shared/src/config/dev.yml', 'utf8'));
console.log(doc.app.prefix);
