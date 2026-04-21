const fs = require('fs');

let dev = fs.readFileSync('/workspace/server/apps/micro-water-basic/src/module/equipment/device.service.ts', 'utf8');
dev = dev.replace(/zoneCode/g, 'stationCode');
dev = dev.replace(/{ title: '地址', dataIndex: 'address' }/g, "{ title: '型号', dataIndex: 'model' }, { title: '厂家', dataIndex: 'manufacturer' }");
dev = dev.replace(/address: row\.getCell\(6\).value\?\.toString\(\) \|\| '',/g, "model: row.getCell(6).value?.toString() || '', manufacturer: row.getCell(7).value?.toString() || '',");
fs.writeFileSync('/workspace/server/apps/micro-water-basic/src/module/equipment/device.service.ts', dev);

let pt = fs.readFileSync('/workspace/server/apps/micro-water-basic/src/module/equipment/point.service.ts', 'utf8');
pt = pt.replace(/zoneCode/g, 'deviceCode');
pt = pt.replace(/stationCode/g, 'deviceCode');
pt = pt.replace(/{ title: '负责人', dataIndex: 'managerName' },\s*{ title: '电话', dataIndex: 'managerPhone' },\s*{ title: '地址', dataIndex: 'address' }/g, "{ title: '量程上限', dataIndex: 'rangeMax' }, { title: '量程下限', dataIndex: 'rangeMin' }, { title: '单位', dataIndex: 'unit' }");
pt = pt.replace(/managerName: row\.getCell\(4\)\.value\?\.toString\(\) \|\| '',\s*managerPhone: row\.getCell\(5\)\.value\?\.toString\(\) \|\| '',\s*address: row\.getCell\(6\)\.value\?\.toString\(\) \|\| '',/g, "rangeMax: parseFloat(row.getCell(4).value?.toString() || '0'), rangeMin: parseFloat(row.getCell(5).value?.toString() || '0'), unit: row.getCell(6).value?.toString() || '',");
fs.writeFileSync('/workspace/server/apps/micro-water-basic/src/module/equipment/point.service.ts', pt);
