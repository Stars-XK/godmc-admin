const fs = require('fs');
const deptFile = '/workspace/server/apps/api-gateway/src/module/system/dept/dept.service.ts';
let deptCode = fs.readFileSync(deptFile, 'utf8');
deptCode = deptCode.replace(/queryBuilder:\s*SelectQueryBuilder<any>/g, 'queryBuilder: any');
fs.writeFileSync(deptFile, deptCode);
