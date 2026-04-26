const fs = require('fs');
let content = fs.readFileSync('/workspace/admin/src/views/gis/screen/index.vue', 'utf8');

const stationCatStr = `
const stationCategories = [
  { value: '1', label: '水厂', color: '#3b82f6' },
  { value: '2', label: '泵站', color: '#f59e0b' },
  { value: '3', label: '二次供水', color: '#10b981' },
  { value: '4', label: '管网监测点', color: '#8b5cf6' },
  { value: '5', label: '污水处理厂', color: '#ec4899' }
];

const deviceCategories = [
  { value: '1', label: '水泵', color: '#06b6d4' },
  { value: '2', label: '阀门', color: '#f97316' },
  { value: '3', label: '流量计', color: '#14b8a6' },
  { value: '4', label: '压力计', color: '#6366f1' }
];
`;

content = content.replace('const stats = reactive({', stationCatStr + '\nconst stats = reactive({');

const oldLayerVisible = `
const layerVisible = reactive({
  zones: true,
  stations: true,
  devices: true,
  alarms: true
});
`;

const newLayerVisible = `
const layerVisible = reactive({
  zones: true,
  alarms: true,
  ...stationCategories.reduce((acc, c) => ({...acc, ['station_' + c.value]: true}), {}),
  ...deviceCategories.reduce((acc, c) => ({...acc, ['device_' + c.value]: true}), {})
});
`;

content = content.replace(oldLayerVisible.trim(), newLayerVisible.trim());

const oldOverlayGroup = `
// 高德地图图层组
const overlayGroups = {
  zones: null,
  stations: null,
  devices: null,
  alarms: null
};
`;

const newOverlayGroup = `
// 高德地图图层组
const overlayGroups = {
  zones: null,
  alarms: null
};
`;

content = content.replace(oldOverlayGroup.trim(), newOverlayGroup.trim());

const oldMapInit = `
        mapInstance.value = new AMap.Map('map-container', {
          zoom: mapZoom,
          center: [centerLng, centerLat],
          mapStyle: mapStyle,
          viewMode: '3D',
          pitch: 0 // 去除倾斜视角，恢复正视俯视
        });
`;

const newMapInit = `
        mapInstance.value = new AMap.Map('map-container', {
          zoom: mapZoom,
          center: [centerLng, centerLat],
          zooms: [3, 20], // 放宽缩放级别，允许继续放大
          mapStyle: mapStyle,
          viewMode: '3D',
          pitch: 0 // 去除倾斜视角，恢复正视俯视
        });
`;

content = content.replace(oldMapInit.trim(), newMapInit.trim());

fs.writeFileSync('/workspace/admin/src/views/gis/screen/index.vue', content);
