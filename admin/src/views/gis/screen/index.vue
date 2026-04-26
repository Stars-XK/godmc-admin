<template>
  <div class="gis-screen-container">
    <div id="map-container" class="map-container" v-loading="loading" element-loading-text="地图引擎加载中... 稍等片刻" element-loading-background="rgba(3, 11, 20, 0.9)"></div>
    
    <!-- 头部横幅 -->
    <div class="screen-header">
      <div class="header-left">
        <el-icon @click="goBack" class="back-btn"><ArrowLeft /></el-icon>
      </div>
      <div class="header-center">
        <h1>综合水务GIS监控舱</h1>
        <div class="header-subtitle">Intelligent Water Management System</div>
      </div>
      <div class="header-right">
        <span class="time">{{ currentTime }}</span>
      </div>
    </div>

    <!-- 左侧悬浮面板 (状态总览 & 告警滚动) -->
    <div class="panel-left glass-panel slide-in-left">
      <div class="panel-box">
        <h3 class="panel-title"><el-icon><Odometer /></el-icon> 资产全局感知</h3>
        <div v-if="initErrorMsg" class="error-alert">
          <el-icon><Warning /></el-icon> {{ initErrorMsg }}
        </div>
        <div v-else class="stat-grid">
          <div class="stat-card">
            <div class="stat-icon zones"><el-icon><MapLocation /></el-icon></div>
            <div class="stat-info">
              <span class="stat-label">供水分区</span>
              <span class="stat-value">{{ stats.zones }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stations"><el-icon><OfficeBuilding /></el-icon></div>
            <div class="stat-info">
              <span class="stat-label">监测站点</span>
              <span class="stat-value">{{ stats.stations }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon devices"><el-icon><Cpu /></el-icon></div>
            <div class="stat-info">
              <span class="stat-label">物联设备</span>
              <span class="stat-value">{{ stats.devices }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon alarms" :class="{ 'has-alarm': stats.alarms > 0 }"><el-icon><BellFilled /></el-icon></div>
            <div class="stat-info">
              <span class="stat-label">活跃告警</span>
              <span class="stat-value" :class="{ 'text-danger': stats.alarms > 0 }">{{ stats.alarms }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 告警播报栏 -->
      <div class="panel-box alarm-box">
        <h3 class="panel-title"><el-icon><WarningFilled /></el-icon> 实时告警动态</h3>
        <div class="alarm-list-wrapper">
          <div class="alarm-list" :class="{ 'scrolling': activeAlarms.length > 4 }">
            <div v-if="activeAlarms.length === 0" class="empty-state">
              <el-icon><CircleCheckFilled /></el-icon>
              <span>当前系统运行平稳，无活跃告警</span>
            </div>
            <div v-for="(alarm, index) in activeAlarms" :key="index" class="alarm-item">
              <div class="alarm-dot" :class="getAlarmLevelClass(alarm.alarmLevel)"></div>
              <div class="alarm-content">
                <div class="alarm-header">
                  <span class="alarm-rule">{{ alarm.ruleName }}</span>
                  <span class="alarm-time">{{ formatTime(alarm.alarmTime) }}</span>
                </div>
                <div class="alarm-desc">{{ alarm.alarmContent }}</div>
                <div class="alarm-source">来源: {{ alarm.alarmSource || '未知' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧悬浮面板 (图层控制) -->
    <div class="panel-right glass-panel slide-in-right">
      <div class="panel-box">
        <h3 class="panel-title"><el-icon><List /></el-icon> 空间图层控制</h3>
        <div class="layer-controls">
          <label class="layer-switch">
            <div class="switch-info">
              <span class="color-dot zone-dot"></span>
              <span class="layer-name">供水管网分区 (Polygons)</span>
            </div>
            <el-switch v-model="layerVisible.zones" @change="toggleLayer('zones')" active-color="#00e5ff" />
          </label>
          <label class="layer-switch">
            <div class="switch-info">
              <span class="color-dot station-dot"></span>
              <span class="layer-name">核心监测站点 (Stations)</span>
            </div>
            <el-switch v-model="layerVisible.stations" @change="toggleLayer('stations')" active-color="#ffd700" />
          </label>
          <label class="layer-switch">
            <div class="switch-info">
              <span class="color-dot device-dot"></span>
              <span class="layer-name">智能物联设备 (Devices)</span>
            </div>
            <el-switch v-model="layerVisible.devices" @change="toggleLayer('devices')" active-color="#00ffaa" />
          </label>
          <label class="layer-switch">
            <div class="switch-info">
              <span class="color-dot alarm-dot-legend"></span>
              <span class="layer-name">实时告警事件 (Alarms)</span>
            </div>
            <el-switch v-model="layerVisible.alarms" @change="toggleLayer('alarms')" active-color="#ff003c" />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import AMapLoader from '@amap/amap-jsapi-loader';
import { useRouter } from 'vue-router';
import { listConfig } from '@/api/system/config';
import { listStation, listDevice } from '@/api/water-basic/equipment';
import { listZoneTree } from '@/api/water-basic/zone';
import { listHistory } from '@/api/alarm/history';
import proj4 from 'proj4';
import { 
  ArrowLeft, Warning, Odometer, MapLocation, OfficeBuilding, 
  Cpu, BellFilled, WarningFilled, CircleCheckFilled, List 
} from '@element-plus/icons-vue';
import dayjs from 'dayjs';

const router = useRouter();
const loading = ref(true);
const currentTime = ref('');
const initErrorMsg = ref('');
let timer = null;

const stats = reactive({
  zones: 0,
  stations: 0,
  devices: 0,
  alarms: 0
});

const activeAlarms = ref([]);

const layerVisible = reactive({
  zones: true,
  stations: true,
  devices: true,
  alarms: true
});

const mapInstance = ref(null);
let currentMapType = '';

// 高德地图图层组
const overlayGroups = {
  zones: null,
  stations: null,
  devices: null,
  alarms: null
};

// proj4 配置
let transformEnabled = false;
let customProj4Str = '';

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
  }, 1000);
  
  initScreen();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (mapInstance.value && currentMapType === 'amap') {
    mapInstance.value.destroy();
  }
});

function goBack() {
  router.push('/index');
}

function formatTime(time) {
  return time ? dayjs(time).format('MM-DD HH:mm') : '';
}

function getAlarmLevelClass(level) {
  const map = { '1': 'level-1', '2': 'level-2', '3': 'level-3', '4': 'level-4' };
  return map[level] || 'level-3';
}

async function initScreen() {
  try {
    let rows = [];
    try {
      const res = await listConfig({ pageSize: 500 });
      rows = res.rows || [];
    } catch (e) {
      console.warn('获取配置失败，使用默认配置', e);
    }
    const configMap = {};
    rows.forEach(item => {
      configMap[item.configKey] = item.configValue;
    });

    const source = configMap['gis.map.source'] || 'amap';
    currentMapType = source;
    
    transformEnabled = configMap['gis.coord.transform'] === 'custom_proj4';
    customProj4Str = configMap['gis.custom.proj4'];

    await loadMapEngine(source, configMap);
    await loadAndScatterData();
    
    loading.value = false;
  } catch (error) {
    console.error('地图初始化失败:', error);
    initErrorMsg.value = error.message || '地图初始化失败';
    loading.value = false;
  }
}

function loadMapEngine(source, configMap) {
  return new Promise((resolve, reject) => {
    if (source === 'amap') {
      const key = configMap['gis.map.amap.key'] || 'f2ce1125b07fe3e22ebd5924b75ca6d1';
      const mapStyle = configMap['gis.map.style'] || 'amap://styles/darkblue';
      
      if (!window._AMapSecurityConfig) {
        window._AMapSecurityConfig = { securityJsCode: configMap['gis.map.amap.security'] || '610162c69ef7947baf638e9b445316c5' };
      }
      AMapLoader.load({
        key: key,
        version: '2.0',
        plugins: ['AMap.Marker', 'AMap.Polygon', 'AMap.OverlayGroup', 'AMap.InfoWindow']
      }).then((AMap) => {
        window.AMap = AMap;
        mapInstance.value = new AMap.Map('map-container', {
          zoom: 12,
          center: [118.60, 24.90],
          mapStyle: mapStyle,
          viewMode: '3D',
          pitch: 45 // 倾斜视角，增加科幻感
        });
        
        // 初始化图层组
        overlayGroups.zones = new AMap.OverlayGroup();
        overlayGroups.stations = new AMap.OverlayGroup();
        overlayGroups.devices = new AMap.OverlayGroup();
        overlayGroups.alarms = new AMap.OverlayGroup();
        
        mapInstance.value.add(overlayGroups.zones);
        mapInstance.value.add(overlayGroups.stations);
        mapInstance.value.add(overlayGroups.devices);
        mapInstance.value.add(overlayGroups.alarms);

        resolve();
      }).catch(reject);
    } else {
      reject(new Error('大屏当前仅支持高德地图(AMap)完整特性'));
    }
  });
}

// WGS84 -> GCJ02 (火星坐标)
const PI = 3.1415926535897932384626;
const a = 6378245.0;
const ee = 0.00669342162296594323;

function transformlat(lng, lat) {
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0;
  return ret;
}
function transformlng(lng, lat) {
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0;
  return ret;
}
function outOfChina(lng, lat) {
  return (lng < 72.004 || lng > 137.8347) || ((lat < 0.8293 || lat > 55.8271) || false);
}
function wgs84togcj02(lng, lat) {
  if (outOfChina(lng, lat)) return [lng, lat];
  let dlat = transformlat(lng - 105.0, lat - 35.0);
  let dlng = transformlng(lng - 105.0, lat - 35.0);
  let radlat = lat / 180.0 * PI;
  let magic = Math.sin(radlat);
  magic = 1 - ee * magic * magic;
  let sqrtmagic = Math.sqrt(magic);
  dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
  dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
  return [lng + dlng, lat + dlat];
}

function processCoord(lng, lat) {
  let x = Number(lng);
  let y = Number(lat);
  if (isNaN(x) || isNaN(y) || x === 0 || y === 0) return null;

  // 1. Proj4 投影转换 (Proj -> WGS84)
  if (transformEnabled && customProj4Str) {
    try {
      const res = proj4(customProj4Str, 'WGS84', [x, y]);
      x = res[0];
      y = res[1];
    } catch (e) {
      // 忽略转换失败，可能已经是经纬度
    }
  }

  // 2. WGS84 -> GCJ02 (针对高德)
  if (currentMapType === 'amap') {
    return wgs84togcj02(x, y);
  }
  return [x, y];
}

// 扁平化树
function flattenTree(tree, arr = []) {
  tree.forEach(node => {
    arr.push(node);
    if (node.children && node.children.length > 0) {
      flattenTree(node.children, arr);
    }
  });
  return arr;
}

async function loadAndScatterData() {
  try {
    const [zoneRes, stationRes, deviceRes, alarmRes] = await Promise.all([
      listZoneTree({}),
      listStation({ pageSize: 2000 }),
      listDevice({ pageSize: 2000 }),
      listHistory({ status: '0', pageSize: 100 }) // 未处理告警
    ]);

    const zones = flattenTree(zoneRes.data || []);
    const stations = stationRes.rows || [];
    const devices = deviceRes.rows || [];
    const alarms = alarmRes.rows || [];

    stats.zones = zones.length;
    stats.stations = stations.length;
    stats.devices = devices.length;
    stats.alarms = alarms.length;
    activeAlarms.value = alarms;

    // 建立源到告警的映射 (让产生告警的设备特殊显示)
    const alarmSourceMap = {};
    alarms.forEach(a => {
      if (a.alarmSource) alarmSourceMap[a.alarmSource] = a;
    });

    if (currentMapType !== 'amap' || !window.AMap) return;

    const AMap = window.AMap;
    const fitViewOverlays = [];

    // 1. 绘制分区 (Polygons)
    zones.forEach(zone => {
      // 优先绘制面
      if (zone.boundary) {
        try {
          const geoData = JSON.parse(zone.boundary);
          // 假设标准的 GeoJSON 或直接的坐标数组
          let coordsArray = [];
          if (geoData.type === 'Feature' && geoData.geometry) {
            coordsArray = geoData.geometry.coordinates[0]; // Polygon 第一层
          } else if (Array.isArray(geoData)) {
            coordsArray = geoData;
          }
          
          if (coordsArray.length > 0) {
            const path = [];
            coordsArray.forEach(coord => {
               // 可能是 [lng, lat] 或 {lng, lat}
               let lng = Array.isArray(coord) ? coord[0] : coord.lng;
               let lat = Array.isArray(coord) ? coord[1] : coord.lat;
               const pt = processCoord(lng, lat);
               if (pt) path.push(pt);
            });
            
            if (path.length > 2) {
              const polygon = new AMap.Polygon({
                path: path,
                strokeColor: '#00e5ff',
                strokeWeight: 2,
                strokeOpacity: 0.8,
                fillColor: '#0044ff',
                fillOpacity: 0.15,
                extData: zone
              });
              
              // 悬浮交互
              polygon.on('mouseover', () => {
                polygon.setOptions({ fillOpacity: 0.4, fillColor: '#00e5ff' });
              });
              polygon.on('mouseout', () => {
                polygon.setOptions({ fillOpacity: 0.15, fillColor: '#0044ff' });
              });

              overlayGroups.zones.addOverlay(polygon);
              fitViewOverlays.push(polygon);
            }
          }
        } catch (e) {
          console.warn('解析分区边界失败', zone.name, e);
        }
      }
      
      // 其次绘制中心点作为标签
      if (zone.longitude && zone.latitude) {
        const pt = processCoord(zone.longitude, zone.latitude);
        if (pt) {
          const marker = new AMap.Marker({
            position: pt,
            content: `<div class="cyber-label zone-label">${zone.name}</div>`,
            offset: new AMap.Pixel(-30, -15)
          });
          overlayGroups.zones.addOverlay(marker);
        }
      }
    });

    // 2. 绘制站点 (Stations)
    stations.forEach(s => {
      const pt = processCoord(s.longitude, s.latitude);
      if (pt) {
        const hasAlarm = alarmSourceMap[s.code];
        const marker = new AMap.Marker({
          position: pt,
          content: `
            <div class="cyber-marker station-marker ${hasAlarm ? 'alarming' : ''}">
              <div class="core"></div>
              <div class="pulse"></div>
            </div>`,
          offset: new AMap.Pixel(-12, -12),
          extData: s
        });
        marker.setLabel({
          content: `<div class="cyber-label station-label">${s.name}</div>`,
          direction: 'right'
        });
        
        if (hasAlarm) {
          overlayGroups.alarms.addOverlay(marker); // 归入告警图层
        } else {
          overlayGroups.stations.addOverlay(marker);
        }
        fitViewOverlays.push(marker);
      }
    });

    // 3. 绘制设备 (Devices)
    // 如果数量极大，这里可以引入点聚合 AMap.MarkerCluster
    // 由于我们配置了 concurrent 拉取 2000，直接散点在性能可接受范围，但做轻量化渲染
    devices.forEach(d => {
      const pt = processCoord(d.longitude, d.latitude);
      if (pt) {
        const hasAlarm = alarmSourceMap[d.code];
        const marker = new AMap.Marker({
          position: pt,
          content: `
            <div class="cyber-marker device-marker ${hasAlarm ? 'alarming' : ''}">
              <div class="core"></div>
            </div>`,
          offset: new AMap.Pixel(-6, -6),
          extData: d
        });
        // 设备太多不默认展示 label，悬浮才展示（可通过 AMap.InfoWindow 优化）
        marker.on('mouseover', () => {
          marker.setLabel({ content: `<div class="cyber-label device-label">${d.name}</div>`, direction: 'top' });
        });
        marker.on('mouseout', () => {
          marker.setLabel(null);
        });

        if (hasAlarm) {
          overlayGroups.alarms.addOverlay(marker);
        } else {
          overlayGroups.devices.addOverlay(marker);
        }
        fitViewOverlays.push(marker);
      }
    });

    // 自适应视野
    if (fitViewOverlays.length > 0) {
      mapInstance.value.setFitView(fitViewOverlays, false, [50, 50, 50, 350]); // 留出左侧面板的 padding
    }

  } catch (error) {
    console.error('拉取数据失败:', error);
  }
}

function toggleLayer(layerName) {
  const isVisible = layerVisible[layerName];
  const group = overlayGroups[layerName];
  if (group) {
    if (isVisible) {
      group.show();
    } else {
      group.hide();
    }
  }
}
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

.gis-screen-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #030b14;
  z-index: 9999;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;

  .map-container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    overflow: hidden;
  }

  .screen-header {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 90px;
    background: linear-gradient(180deg, rgba(3, 11, 20, 0.9) 0%, rgba(3, 11, 20, 0) 100%);
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 15px 30px 0;
    pointer-events: none; // 穿透点击地图

    .header-left, .header-center, .header-right {
      pointer-events: auto;
    }

    .header-left {
      width: 25%;
      .back-btn {
        color: #00e5ff;
        font-size: 28px;
        cursor: pointer;
        padding: 10px;
        background: rgba(0, 229, 255, 0.1);
        border: 1px solid rgba(0, 229, 255, 0.3);
        border-radius: 8px;
        backdrop-filter: blur(5px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        &:hover {
          color: #fff;
          background: rgba(0, 229, 255, 0.3);
          box-shadow: 0 0 15px rgba(0, 229, 255, 0.5);
          transform: translateX(-5px);
        }
      }
    }

    .header-center {
      width: 50%;
      text-align: center;
      h1 {
        margin: 0;
        color: #fff;
        font-size: 38px;
        font-weight: 700;
        letter-spacing: 6px;
        text-shadow: 0 0 15px rgba(0, 229, 255, 0.8), 0 0 30px rgba(0, 229, 255, 0.4);
      }
      .header-subtitle {
        color: #00e5ff;
        font-family: 'Orbitron', sans-serif;
        font-size: 12px;
        letter-spacing: 4px;
        margin-top: 5px;
        opacity: 0.8;
        text-transform: uppercase;
      }
    }

    .header-right {
      width: 25%;
      text-align: right;
      .time {
        color: #00e5ff;
        font-size: 22px;
        font-family: 'Orbitron', sans-serif;
        font-weight: 700;
        text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
      }
    }
  }

  /* 悬浮面板通用样式 */
  .glass-panel {
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 20px;
    pointer-events: none;
  }

  .panel-box {
    background: rgba(6, 15, 33, 0.75);
    border: 1px solid rgba(0, 229, 255, 0.2);
    border-radius: 12px;
    padding: 20px;
    backdrop-filter: blur(12px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 229, 255, 0.05);
    pointer-events: auto;
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 2px;
      background: linear-gradient(90deg, transparent, #00e5ff, transparent);
    }

    .panel-title {
      color: #fff;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 20px 0;
      display: flex;
      align-items: center;
      gap: 10px;
      .el-icon {
        color: #00e5ff;
        font-size: 20px;
      }
    }
  }

  /* 左侧面板 */
  .panel-left {
    position: absolute;
    top: 110px;
    left: 30px;
    width: 360px;
    bottom: 30px;

    .stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;

      .stat-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 15px;
        display: flex;
        align-items: center;
        gap: 15px;
        transition: all 0.3s;
        &:hover {
          background: rgba(0, 229, 255, 0.1);
          border-color: rgba(0, 229, 255, 0.3);
          transform: translateY(-2px);
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          
          &.zones { background: rgba(0, 229, 255, 0.15); color: #00e5ff; }
          &.stations { background: rgba(255, 215, 0, 0.15); color: #ffd700; }
          &.devices { background: rgba(0, 255, 170, 0.15); color: #00ffaa; }
          &.alarms { background: rgba(255, 255, 255, 0.1); color: #ccc; }
          &.alarms.has-alarm { background: rgba(255, 0, 60, 0.2); color: #ff003c; animation: pulse-red 2s infinite; }
        }

        .stat-info {
          display: flex;
          flex-direction: column;
          .stat-label { font-size: 12px; color: #8bb0d3; margin-bottom: 5px; }
          .stat-value { font-size: 24px; font-weight: bold; font-family: 'Orbitron', sans-serif; color: #fff; }
          .text-danger { color: #ff003c; text-shadow: 0 0 10px rgba(255, 0, 60, 0.5); }
        }
      }
    }

    .alarm-box {
      flex: 1;
      display: flex;
      flex-direction: column;
      
      .alarm-list-wrapper {
        flex: 1;
        overflow: hidden;
        position: relative;
        mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
      }

      .alarm-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        
        &.scrolling {
          animation: scroll-up 20s linear infinite;
          &:hover { animation-play-state: paused; }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
          color: #00ffaa;
          opacity: 0.7;
          gap: 10px;
          font-size: 14px;
          .el-icon { font-size: 40px; }
        }

        .alarm-item {
          background: rgba(255, 0, 60, 0.05);
          border-left: 3px solid #ff003c;
          padding: 12px;
          border-radius: 0 6px 6px 0;
          display: flex;
          gap: 12px;
          transition: background 0.3s;
          &:hover { background: rgba(255, 0, 60, 0.15); }

          .alarm-dot {
            width: 8px; height: 8px; border-radius: 50%; margin-top: 5px;
            box-shadow: 0 0 8px currentColor;
            &.level-1 { background: #ff003c; color: #ff003c; }
            &.level-2 { background: #ff5500; color: #ff5500; }
            &.level-3 { background: #ffd700; color: #ffd700; }
            &.level-4 { background: #00e5ff; color: #00e5ff; }
          }

          .alarm-content {
            flex: 1;
            .alarm-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              .alarm-rule { font-weight: bold; color: #ff003c; font-size: 14px; }
              .alarm-time { font-size: 12px; color: #8bb0d3; font-family: 'Orbitron', sans-serif; }
            }
            .alarm-desc { font-size: 13px; color: #e2e8f0; margin-bottom: 6px; line-height: 1.4; }
            .alarm-source { font-size: 12px; color: #8bb0d3; opacity: 0.8; }
          }
        }
      }
    }
  }

  /* 右侧面板 */
  .panel-right {
    position: absolute;
    top: 110px;
    right: 30px;
    width: 280px;

    .layer-controls {
      display: flex;
      flex-direction: column;
      gap: 15px;

      .layer-switch {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.3s;
        &:hover { background: rgba(255, 255, 255, 0.05); }

        .switch-info {
          display: flex;
          align-items: center;
          gap: 10px;
          .color-dot {
            width: 12px; height: 12px; border-radius: 3px;
            &.zone-dot { background: #00e5ff; box-shadow: 0 0 5px #00e5ff; }
            &.station-dot { background: #ffd700; box-shadow: 0 0 5px #ffd700; border-radius: 50%; }
            &.device-dot { background: #00ffaa; box-shadow: 0 0 5px #00ffaa; border-radius: 50%; }
            &.alarm-dot-legend { background: #ff003c; box-shadow: 0 0 8px #ff003c; border-radius: 50%; animation: pulse-red 2s infinite; }
          }
          .layer-name { color: #fff; font-size: 14px; font-weight: 500; }
        }
      }
    }
  }

  /* 动画 */
  .slide-in-left { animation: slideLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .slide-in-right { animation: slideRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

  @keyframes slideLeft { from { transform: translateX(-50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideRight { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes scroll-up { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
  @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(255, 0, 60, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(255, 0, 60, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 0, 60, 0); } }
  @keyframes pulse-cyan { 0% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(0, 229, 255, 0); } 100% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0); } }

  /* 覆盖错误提示 */
  .error-alert {
    color: #ff003c;
    background: rgba(255, 0, 60, 0.1);
    border: 1px solid rgba(255, 0, 60, 0.3);
    padding: 12px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
}
</style>

<style lang="scss">
/* 动态挂载到 DOM 的元素样式 (不加 scoped) */
.cyber-label {
  background: rgba(6, 15, 33, 0.85);
  border: 1px solid;
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);

  &.zone-label { border-color: #00e5ff; color: #00e5ff; box-shadow: 0 0 10px rgba(0, 229, 255, 0.2); }
  &.station-label { border-color: #ffd700; color: #ffd700; }
  &.device-label { border-color: #00ffaa; color: #00ffaa; }
}

.cyber-marker {
  position: relative;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  .core {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    z-index: 2;
  }

  &.station-marker .core { background: #ffd700; box-shadow: 0 0 10px #ffd700; }
  
  &.device-marker {
    width: 12px; height: 12px;
    .core { width: 8px; height: 8px; background: #00ffaa; box-shadow: 0 0 8px #00ffaa; }
  }

  &.alarming {
    .core { background: #ff003c !important; box-shadow: 0 0 15px #ff003c !important; }
    .pulse {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 100%; height: 100%;
      background: rgba(255, 0, 60, 0.5);
      border-radius: 50%;
      z-index: 1;
      animation: pulse-red-map 1.5s ease-out infinite;
    }
  }
}

@keyframes pulse-red-map {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
}

/* 隐藏高德地图logo */
.amap-logo, .amap-copyright {
  display: none !important;
}
</style>
