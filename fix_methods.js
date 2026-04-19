const fs = require('fs');

// Fix dept.service.ts
const deptFile = '/workspace/server/apps/api-gateway/src/module/system/dept/dept.service.ts';
let deptCode = fs.readFileSync(deptFile, 'utf8');
deptCode = deptCode.replace(/\/\*\*[\s\S]*?\*\/[\s\S]*?private\s+addQueryForDeptDataScope[\s\S]*?\}/, '');
deptCode = deptCode.replace(/\/\*\*[\s\S]*?\*\/[\s\S]*?private\s+addQueryForDeptAndChildDataScope[\s\S]*?\}/, '');
fs.writeFileSync(deptFile, deptCode);

// Fix menu.service.ts
const menuFile = '/workspace/server/apps/api-gateway/src/module/system/menu/menu.service.ts';
let menuCode = fs.readFileSync(menuFile, 'utf8');
menuCode = menuCode.replace(/async\s+findMany\s*\(where:\s*FindManyOptions<SysMenuEntity>\)\s*\{[\s\S]*?\}/, '');
fs.writeFileSync(menuFile, menuCode);

// Fix role.service.ts
const roleFile = '/workspace/server/apps/api-gateway/src/module/system/role/role.service.ts';
let roleCode = fs.readFileSync(roleFile, 'utf8');
roleCode = roleCode.replace(/async\s+findRoles\s*\(where:\s*FindManyOptions<SysRoleEntity>\)\s*\{[\s\S]*?\}/, '');
fs.writeFileSync(roleFile, roleCode);

