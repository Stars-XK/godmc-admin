const fs = require('fs');
const file = '/workspace/server/apps/api-gateway/src/app.module.ts';
let code = fs.readFileSync(file, 'utf8');

// remove import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
code = code.replace(/import\s*\{\s*TypeOrmModule[\s\S]*?\}\s*from\s*['"]@nestjs\/typeorm['"];?\n?/, '');

// remove TypeOrmModule.forRootAsync(...) block
code = code.replace(/\s*\/\/\s*数据库\s*TypeOrmModule\.forRootAsync\(\{[\s\S]*?\}\),\s*/, '');
// just in case the comment is not exactly that:
code = code.replace(/\s*\/\/\s*数据库\s*/, '');
code = code.replace(/TypeOrmModule\.forRootAsync\(\{[\s\S]*?\}\),?\s*/, '');

fs.writeFileSync(file, code);
