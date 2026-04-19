const fs = require('fs');

const files = process.argv.slice(2);
files.forEach(file => {
    let code = fs.readFileSync(file, 'utf8');
    
    // remove import { InjectRepository } from '@nestjs/typeorm';
    code = code.replace(/import\s*\{\s*InjectRepository[\s\S]*?\}\s*from\s*['"]@nestjs\/typeorm['"];?\n?/g, '');
    
    // remove typeorm imports
    // this can be `import { Repository, In, Not } from 'typeorm';`
    code = code.replace(/import\s*\{[^}]*\}\s*from\s*['"]typeorm['"];?\n?/g, '');
    
    fs.writeFileSync(file, code);
});
