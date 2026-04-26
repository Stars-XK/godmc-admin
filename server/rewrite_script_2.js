const fs = require('fs');
let content = fs.readFileSync('/workspace/admin/src/views/gis/screen/index.vue', 'utf8');

const oldMapAdd = `
        // 初始化图层组
        overlayGroups.zones = new AMap.OverlayGroup();
        overlayGroups.stations = new AMap.OverlayGroup();
        overlayGroups.devices = new AMap.OverlayGroup();
        overlayGroups.alarms = new AMap.OverlayGroup();
        
        mapInstance.value.add(overlayGroups.zones);
        mapInstance.value.add(overlayGroups.stations);
        mapInstance.value.add(overlayGroups.devices);
        mapInstance.value.add(overlayGroups.alarms);
`;

const newMapAdd = `
        // 初始化图层组
        overlayGroups.zones = new AMap.OverlayGroup();
        overlayGroups.alarms = new AMap.OverlayGroup();
        
        mapInstance.value.add(overlayGroups.zones);
        mapInstance.value.add(overlayGroups.alarms);
`;

content = content.replace(oldMapAdd.trim(), newMapAdd.trim());
fs.writeFileSync('/workspace/admin/src/views/gis/screen/index.vue', content);
