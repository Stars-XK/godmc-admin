const fs = require('fs');

const files = process.argv.slice(2);
files.forEach(file => {
    let code = fs.readFileSync(file, 'utf8');
    
    // remove TypeOrmModule import
    code = code.replace(/import\s*\{\s*TypeOrmModule[\s\S]*?\}\s*from\s*['"]@nestjs\/typeorm['"];?\n?/g, '');
    
    // remove TypeOrmModule.forFeature([...]),
    code = code.replace(/TypeOrmModule\.forFeature\(\[.*?\]\),?\s*/g, '');
    
    fs.writeFileSync(file, code);
});
