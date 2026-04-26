const fs = require('fs');
const lines = fs.readFileSync('/workspace/admin/src/views/gis/screen/index.vue', 'utf8').split('\n');

const start = lines.findIndex(l => l.includes('// 2. 绘制站点 (Stations)'));
const end = lines.findIndex(l => l.includes('// 彻底移除 setFitView'));

if (start === -1 || end === -1) {
  console.log("NOT FOUND");
  process.exit(1);
}

const replacement = `
    // 2. 绘制分类站点 (Stations)
    const stationDataMap = {};
    stationCategories.forEach(c => stationDataMap[c.value] = []);
    stations.forEach(s => {
      const pt = processCoord(s.longitude, s.latitude);
      if (pt && pt[0] > 70 && pt[0] < 140 && pt[1] > 10 && pt[1] < 60) {
        const hasAlarm = alarmSourceMap[s.code];
        if (hasAlarm) {
          const marker = new AMap.Marker({
            position: pt,
            content: \`
              <div class="cyber-marker alarming">
                <div class="core"></div>
                <div class="pulse"></div>
              </div>\`,
            offset: new AMap.Pixel(-12, -12),
            extData: s
          });
          marker.on('mouseover', () => marker.setLabel({ content: \`<div class="cyber-label">\${s.name}</div>\`, direction: 'right' }));
          marker.on('mouseout', () => marker.setLabel(null));
          overlayGroups.alarms.addOverlay(marker);
        } else {
          if (stationDataMap[s.type]) {
            stationDataMap[s.type].push({ lnglat: pt, extData: s });
          }
        }
      }
    });

    stationCategories.forEach(cat => {
      const dataList = stationDataMap[cat.value];
      if (dataList.length > 0) {
        const cluster = new AMap.MarkerCluster(mapInstance.value, dataList, {
          gridSize: 70, maxZoom: 16,
          renderClusterMarker: (context) => {
            const count = context.count;
            context.marker.setContent(\`<div class="cluster-marker" style="background: rgba(255,255,255,0.85); border: 2px solid \${cat.color}; color: \${cat.color};">\${count}</div>\`);
            context.marker.setOffset(new AMap.Pixel(-20, -20));
          },
          renderMarker: (context) => {
            const s = context.data[0].extData;
            context.marker.setContent(\`<div class="simple-marker" style="background: \${cat.color}"></div>\`);
            context.marker.setOffset(new AMap.Pixel(-6, -6));
            context.marker.on('mouseover', () => context.marker.setLabel({ content: \`<div class="simple-label">\${s.name}</div>\`, direction: 'right' }));
            context.marker.on('mouseout', () => context.marker.setLabel(null));
          }
        });
        overlayGroups['station_' + cat.value] = cluster;
      }
    });

    // 3. 绘制分类设备 (Devices)
    const deviceDataMap = {};
    deviceCategories.forEach(c => deviceDataMap[c.value] = []);
    devices.forEach(d => {
      const pt = processCoord(d.longitude, d.latitude);
      if (pt && pt[0] > 70 && pt[0] < 140 && pt[1] > 10 && pt[1] < 60) {
        const hasAlarm = alarmSourceMap[d.code];
        if (hasAlarm) {
          const marker = new AMap.Marker({
            position: pt,
            content: \`
              <div class="cyber-marker alarming">
                <div class="core" style="width:10px;height:10px;"></div>
                <div class="pulse"></div>
              </div>\`,
            offset: new AMap.Pixel(-5, -5),
            extData: d
          });
          marker.on('mouseover', () => marker.setLabel({ content: \`<div class="cyber-label">\${d.name}</div>\`, direction: 'top' }));
          marker.on('mouseout', () => marker.setLabel(null));
          overlayGroups.alarms.addOverlay(marker);
        } else {
          if (deviceDataMap[d.type]) {
            deviceDataMap[d.type].push({ lnglat: pt, extData: d });
          }
        }
      }
    });

    deviceCategories.forEach(cat => {
      const dataList = deviceDataMap[cat.value];
      if (dataList.length > 0) {
        const cluster = new AMap.MarkerCluster(mapInstance.value, dataList, {
          gridSize: 60, maxZoom: 17,
          renderClusterMarker: (context) => {
            const count = context.count;
            context.marker.setContent(\`<div class="cluster-marker" style="background: rgba(255,255,255,0.85); border: 2px solid \${cat.color}; color: \${cat.color};">\${count}</div>\`);
            context.marker.setOffset(new AMap.Pixel(-15, -15));
          },
          renderMarker: (context) => {
            const d = context.data[0].extData;
            context.marker.setContent(\`<div class="simple-marker mini" style="background: \${cat.color}"></div>\`);
            context.marker.setOffset(new AMap.Pixel(-4, -4));
            context.marker.on('mouseover', () => context.marker.setLabel({ content: \`<div class="simple-label">\${d.name}</div>\`, direction: 'top' }));
            context.marker.on('mouseout', () => context.marker.setLabel(null));
          }
        });
        overlayGroups['device_' + cat.value] = cluster;
      }
    });

`;

lines.splice(start, end - start, replacement);
fs.writeFileSync('/workspace/admin/src/views/gis/screen/index.vue', lines.join('\n'));
