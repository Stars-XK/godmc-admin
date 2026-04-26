const fs = require('fs');
let content = fs.readFileSync('/workspace/admin/src/views/gis/screen/index.vue', 'utf8');

const oldToggle = `
  if (group) {
    if ((layerName === 'devices' || layerName === 'stations') && group instanceof window.AMap.MarkerCluster) {
      if (isVisible) {
        group.setMap(mapInstance.value);
      } else {
        group.setMap(null);
      }
    } else {
      if (isVisible) {
        group.show();
      } else {
        group.hide();
      }
    }
  }
`;

const newToggle = `
  if (group) {
    if ((layerName.startsWith('device_') || layerName.startsWith('station_')) && group instanceof window.AMap.MarkerCluster) {
      if (isVisible) {
        group.setMap(mapInstance.value);
      } else {
        group.setMap(null);
      }
    } else {
      if (isVisible) {
        group.show();
      } else {
        group.hide();
      }
    }
  }
`;

content = content.replace(oldToggle.trim(), newToggle.trim());
fs.writeFileSync('/workspace/admin/src/views/gis/screen/index.vue', content);
