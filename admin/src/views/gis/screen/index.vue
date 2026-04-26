<template>
  <div class="gis-screen-container" :class="isDarkTheme ? 'theme-dark' : 'theme-light'">
    <div id="map-container" class="map-container" v-loading="loading" element-loading-text="地图引擎加载中... 稍等片刻" :element-loading-background="isDarkTheme ? 'rgba(3, 11, 20, 0.9)' : 'rgba(255, 255, 255, 0.9)'"></div>

    
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

const isDarkTheme = ref(true);

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
let transformMode = 'none';
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
    
    transformMode = configMap['gis.coord.transform'] || 'none';
    customProj4Str = configMap['gis.custom.proj4'];

    const mapStyle = configMap['gis.map.style'] || 'amap://styles/light';
    isDarkTheme.value = mapStyle.includes('dark');

    await loadMapEngine(source, configMap, mapStyle);
    await loadAndScatterData();
    
    loading.value = false;
  } catch (error) {
    console.error('地图初始化失败:', error);
    initErrorMsg.value = error.message || '地图初始化失败';
    loading.value = false;
  }
}

function loadMapEngine(source, configMap, mapStyle) {
  return new Promise((resolve, reject) => {
    if (source === 'amap') {
      const key = configMap['gis.map.amap.key'] || 'f2ce1125b07fe3e22ebd5924b75ca6d1';
      const securityCode = configMap['gis.map.amap.security'] || '610162c69ef7947baf638e9b445316c5';
      const centerLng = Number(configMap['gis.map.center.lng']) || 118.60;
      const centerLat = Number(configMap['gis.map.center.lat']) || 24.90;
      const mapZoom = Number(configMap['gis.map.zoom']) || 12;
      
      // 彻底解决高德 API V2 安全码被覆盖失效的终极方案：使用代理机制配置
      window._AMapSecurityConfig = { 
        securityJsCode: securityCode,
        // 增加兜底的安全机制，防止由于 JS 代码注入较晚导致瓦片被 Cancel
      };

      AMapLoader.load({
        key: key,
        version: '2.0',
        plugins: ['AMap.Marker', 'AMap.Polygon', 'AMap.OverlayGroup', 'AMap.InfoWindow', 'AMap.MarkerCluster']
      }).then((AMap) => {
        window.AMap = AMap;
        mapInstance.value = new AMap.Map('map-container', {
          zoom: mapZoom,
          center: [centerLng, centerLat],
          mapStyle: mapStyle,
          viewMode: '3D',
            pitch: 0 // 去除倾斜视角，恢复正视俯视
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

  // 智能判断：如果已经在正常的中国经纬度范围内 (70~140, 10~60)
  // 说明它本来就是经纬度，绝对不能再做 Proj4 投影转换，否则会变成乱码坐标
  const isAlreadyLatLng = (x > 70 && x < 140 && y > 10 && y < 60);

  // 1. Proj4 投影转换 (仅对非经纬度的大数值投影系坐标，如 x=39500000 进行转换)
  if (transformMode === 'custom_proj4' && customProj4Str && !isAlreadyLatLng) {
    try {
      const res = proj4(customProj4Str, 'WGS84', [x, y]);
      x = res[0];
      y = res[1];
    } catch (e) {
      // 忽略转换失败
    }
  }

  // 2. WGS84 -> GCJ02 (针对高德)
  if (currentMapType === 'amap') {
    // 只有明确配置了 WGS84_to_GCJ02，或者我们刚刚从 Proj4 转换出 WGS84，才进行纠偏。
    // 如果它本来就是 isAlreadyLatLng，通常意味着在系统里录入的就是准确的底图经纬度（如 GCJ02），
    // 所以不强制纠偏，除非用户强制选了 'WGS84_to_GCJ02'。
    if (transformMode === 'WGS84_to_GCJ02' || (transformMode === 'custom_proj4' && !isAlreadyLatLng)) {
      return wgs84togcj02(x, y);
    }
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
      listStation({ pageNum: 1, pageSize: 10000 }), // 获取尽可能多的点位用于全网展示
      listDevice({ pageNum: 1, pageSize: 10000 }),
      listHistory({ status: '0', pageNum: 1, pageSize: 500 }) // 未处理告警
    ]);

    const zones = flattenTree(zoneRes.data || []);
    const stations = stationRes.data?.list || stationRes.rows || [];
    const devices = deviceRes.data?.list || deviceRes.rows || [];
    const alarms = alarmRes.data?.list || alarmRes.rows || [];

    // 读取真实的统计总数
    stats.zones = zones.length;
    stats.stations = stationRes.data?.total || stationRes.total || stations.length;
    stats.devices = deviceRes.data?.total || deviceRes.total || devices.length;
    stats.alarms = alarmRes.data?.total || alarmRes.total || alarms.length;
    
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
          
          let features = [];
          if (geoData.type === 'FeatureCollection' && Array.isArray(geoData.features)) {
            features = geoData.features;
          } else if (geoData.type === 'Feature') {
            features = [geoData];
          } else if (Array.isArray(geoData)) {
            // 兼容直接存坐标数组的旧格式
            features = [{
              geometry: { type: 'Polygon', coordinates: [geoData] },
              properties: {}
            }];
          }

          // 如果顶级带有 properties（如你提供的JSON结构），把它作为默认属性
          const globalProps = geoData.properties || {};

          features.forEach(feature => {
            if (!feature.geometry) return;
            
            let coordsArray = [];
            if (feature.geometry.type === 'Polygon') {
              coordsArray = feature.geometry.coordinates[0]; // Polygon 的第一层外圈
            } else if (feature.geometry.type === 'MultiPolygon') {
              // 简单处理：取第一个 Polygon 的外圈
              coordsArray = feature.geometry.coordinates[0][0]; 
            }

            if (coordsArray && coordsArray.length > 0) {
              const path = [];
              coordsArray.forEach(coord => {
                 let lng = Array.isArray(coord) ? coord[0] : coord.lng;
                 let lat = Array.isArray(coord) ? coord[1] : coord.lat;
                 const pt = processCoord(lng, lat);
                 if (pt) path.push(pt);
              });
              
              if (path.length > 2) {
                // 尝试读取颜色配置 (优先 feature 自身，其次 global)
                const props = feature.properties || globalProps;
                
                let fillColor = props.fill || '';
                let strokeColor = props.stroke || '';
                let fillOpacity = 0.15; // 默认透明度

                // 如果带了 rgba 的透明度，提取出来以便交互时变化
                if (fillColor && fillColor.startsWith('rgba')) {
                  const match = fillColor.match(/rgba\((.*),\s*([0-9.]+)\)/);
                  if (match) {
                    fillOpacity = parseFloat(match[2]);
                    // AMap.Polygon 的 fillColor 支持 rgba，但分开设置更容易控制
                  }
                }

                const polygon = new AMap.Polygon({
            path: path,
            strokeColor: strokeColor || (isDarkTheme.value ? '#00e5ff' : '#3b82f6'),
            strokeWeight: 2,
            strokeOpacity: 0.8,
            fillColor: fillColor || (isDarkTheme.value ? '#0044ff' : '#3b82f6'),
            fillOpacity: fillOpacity,
            extData: zone
          });
          
          // 悬浮交互
              polygon.on('mouseover', () => {
                polygon.setOptions({ fillOpacity: fillOpacity + 0.3, fillColor: isDarkTheme.value ? '#00e5ff' : '#2563eb' });
              });
              polygon.on('mouseout', () => {
                polygon.setOptions({ fillOpacity: fillOpacity, fillColor: fillColor || (isDarkTheme.value ? '#0044ff' : '#3b82f6') });
              }); // end of polygon.on('mouseout')

              overlayGroups.zones.addOverlay(polygon);
              fitViewOverlays.push(polygon);
            } // end of if (path.length > 2)
          } // end of if (coordsArray && coordsArray.length > 0)
        }); // end of features.forEach
      } catch (e) {
        console.warn('解析分区边界失败', zone.name, e);
      }
    } // end of if (zone.boundary)
      
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
    // 采用数据驱动的 MarkerCluster (极大提升 5000+ 点位的初始化性能)
    const stationDataList = [];
    stations.forEach(s => {
      const pt = processCoord(s.longitude, s.latitude);
      // 过滤掉非中国的异常坐标，防止 setFitView 拉到非洲 [0, 0] 导致显示全世界
      if (pt && pt[0] > 70 && pt[0] < 140 && pt[1] > 10 && pt[1] < 60) {
        const hasAlarm = alarmSourceMap[s.code];
        
        if (hasAlarm) {
          // 告警的点独立绘制，为了能有脉冲特效和悬浮框
          const marker = new AMap.Marker({
            position: pt,
            content: `
              <div class="cyber-marker station-marker alarming">
                <div class="core"></div>
                <div class="pulse"></div>
              </div>`,
            offset: new AMap.Pixel(-12, -12),
            extData: s
          });
          marker.on('mouseover', () => {
            marker.setLabel({ content: `<div class="cyber-label station-label">${s.name}</div>`, direction: 'right' });
          });
          marker.on('mouseout', () => { marker.setLabel(null); });
          overlayGroups.alarms.addOverlay(marker);
          fitViewOverlays.push(marker); // 告警点参与视野自适应
        } else {
          // 正常点塞入原始数据，交给 Cluster 批量按需渲染
          stationDataList.push({ lnglat: pt, extData: s });
        }
      }
    });

    if (stationDataList.length > 0) {
      const cluster = new AMap.MarkerCluster(mapInstance.value, stationDataList, {
        gridSize: 70,
        maxZoom: 16, // 放大到 16 级时完全展开
        renderClusterMarker: (context) => {
          const count = context.count;
          const content = `<div class="cluster-marker station-cluster"><div>${count}</div></div>`;
          context.marker.setContent(content);
          context.marker.setOffset(new AMap.Pixel(-25, -25));
        },
        renderMarker: (context) => {
          const s = context.data[0].extData;
          context.marker.setContent(`
            <div class="cyber-marker station-marker">
              <div class="core"></div>
            </div>`);
          context.marker.setOffset(new AMap.Pixel(-12, -12));
          context.marker.on('mouseover', () => {
            context.marker.setLabel({ content: `<div class="cyber-label station-label">${s.name}</div>`, direction: 'right' });
          });
          context.marker.on('mouseout', () => { context.marker.setLabel(null); });
        }
      });
      overlayGroups.stations = cluster; 
    }

    // 3. 绘制设备 (Devices)
    // 同样采用数据驱动
    const deviceDataList = [];
    devices.forEach(d => {
      const pt = processCoord(d.longitude, d.latitude);
      if (pt && pt[0] > 70 && pt[0] < 140 && pt[1] > 10 && pt[1] < 60) {
        const hasAlarm = alarmSourceMap[d.code];
        if (hasAlarm) {
          const marker = new AMap.Marker({
            position: pt,
            content: `
              <div class="cyber-marker device-marker alarming">
                <div class="core"></div>
                <div class="pulse"></div>
              </div>`,
            offset: new AMap.Pixel(-6, -6),
            extData: d
          });
          marker.on('mouseover', () => {
            marker.setLabel({ content: `<div class="cyber-label device-label">${d.name}</div>`, direction: 'top' });
          });
          marker.on('mouseout', () => { marker.setLabel(null); });
          overlayGroups.alarms.addOverlay(marker);
          fitViewOverlays.push(marker); // 告警点参与视野自适应
        } else {
          deviceDataList.push({ lnglat: pt, extData: d });
        }
      }
    });

    if (deviceDataList.length > 0) {
      const cluster = new AMap.MarkerCluster(mapInstance.value, deviceDataList, {
        gridSize: 60,
        maxZoom: 17,
        renderClusterMarker: (context) => {
          const count = context.count;
          const content = `<div class="cluster-marker"><div>${count}</div></div>`;
          context.marker.setContent(content);
          context.marker.setOffset(new AMap.Pixel(-20, -20));
        },
        renderMarker: (context) => {
          const d = context.data[0].extData;
          context.marker.setContent(`
            <div class="cyber-marker device-marker">
              <div class="core"></div>
            </div>`);
          context.marker.setOffset(new AMap.Pixel(-6, -6));
          context.marker.on('mouseover', () => {
            context.marker.setLabel({ content: `<div class="cyber-label device-label">${d.name}</div>`, direction: 'top' });
          });
          context.marker.on('mouseout', () => { context.marker.setLabel(null); });
        }
      });
      overlayGroups.devices = cluster; 
    }

    // 自适应视野，但仅根据 "管网分区" (Polygons) 或者是 "有告警的设备" 的位置自适应
    // 防止某些游离的非法坐标 [0, 0] 把地图拉到了非洲/全世界
    if (fitViewOverlays.length > 0) {
      // 检查是否有异常坐标拉远了视野，我们简单过滤掉太离谱的点（仅在非全局自适应时有用）
      // 实际上 AMap.setFitView 接受 overlays，我们只把分区和告警的 overlay 传进去即可
      mapInstance.value.setFitView(fitViewOverlays, false, [100, 100, 100, 400]); // 留出左侧面板的 padding
    }

  } catch (error) {
    console.error('拉取数据失败:', error);
  }
}

function toggleLayer(layerName) {
  const isVisible = layerVisible[layerName];
  const group = overlayGroups[layerName];
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
/* 主题动态切换 (深色 / 浅色) */
.gis-screen-container {
  &.theme-dark {
    background-color: #030b14;
    .screen-header {
      background: linear-gradient(180deg, rgba(3, 11, 20, 0.9) 0%, rgba(3, 11, 20, 0) 100%);
      h1 { color: #fff; text-shadow: 0 0 15px rgba(0, 229, 255, 0.8), 0 0 30px rgba(0, 229, 255, 0.4); }
      .header-subtitle { color: #00e5ff; }
      .time { color: #00e5ff; text-shadow: 0 0 10px rgba(0, 229, 255, 0.5); }
      .back-btn { color: #00e5ff; background: rgba(0, 229, 255, 0.1); border-color: rgba(0, 229, 255, 0.3); }
    }
    .panel-box {
      background: rgba(6, 15, 33, 0.75);
      border-color: rgba(0, 229, 255, 0.2);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 229, 255, 0.05);
      &::after { background: linear-gradient(90deg, transparent, #00e5ff, transparent); }
      .panel-title { color: #fff; }
      .stat-card {
        background: rgba(255, 255, 255, 0.03);
        border-color: rgba(255, 255, 255, 0.05);
        .stat-label { color: #8bb0d3; }
        .stat-value { color: #fff; }
      }
      .alarm-list {
        .empty-state { color: #00ffaa; }
        .alarm-item {
          .alarm-header .alarm-time { color: #8bb0d3; }
          .alarm-desc { color: #e2e8f0; }
          .alarm-source { color: #8bb0d3; }
        }
      }
      .layer-switch {
        background: rgba(255, 255, 255, 0.02);
        .layer-name { color: #fff; }
      }
    }
  }

  &.theme-light {
    background-color: #f3f4f6;
    .screen-header {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 100%);
      h1 { color: #111827; text-shadow: none; font-weight: bold; }
      .header-subtitle { color: #3b82f6; }
      .time { color: #3b82f6; text-shadow: none; }
      .back-btn { 
        color: #3b82f6; background: rgba(255, 255, 255, 0.8); border: 1px solid #bfdbfe;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        &:hover { background: #eff6ff; box-shadow: none; }
      }
    }
    .panel-box {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      &::after { background: linear-gradient(90deg, transparent, #3b82f6, transparent); }
      .panel-title { color: #111827; .el-icon { color: #3b82f6; text-shadow: none; } }
      .stat-card {
        background: #f9fafb;
        border: 1px solid #f3f4f6;
        box-shadow: none;
        &:hover { background: #eff6ff; border-color: #bfdbfe; transform: translateY(-2px); }
        .stat-info {
          .stat-label { color: #6b7280; }
          .stat-value { color: #111827; text-shadow: none; }
          .text-danger { color: #ef4444; text-shadow: none; }
        }
        .stat-icon {
          &.zones { background: #dbeafe; color: #3b82f6; }
          &.stations { background: #fef3c7; color: #d97706; }
          &.devices { background: #d1fae5; color: #10b981; }
          &.alarms { background: #f3f4f6; color: #6b7280; }
          &.alarms.has-alarm { background: #fee2e2; color: #ef4444; animation: none; }
        }
      }
      .alarm-list {
        .empty-state { color: #10b981; }
        .alarm-item {
          background: #fff;
          border: 1px solid #f3f4f6;
          border-left: 3px solid #ef4444;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
          &:hover { background: #fef2f2; }
          .alarm-header .alarm-rule { color: #ef4444; }
          .alarm-header .alarm-time { color: #6b7280; text-shadow: none; }
          .alarm-desc { color: #4b5563; }
          .alarm-source { color: #9ca3af; }
          .alarm-dot { box-shadow: none; }
        }
      }
      .layer-switch {
        background: #f9fafb;
        border: 1px solid #f3f4f6;
        box-shadow: none;
        &:hover { background: #f3f4f6; border-color: #e5e7eb; }
        .switch-info {
          .layer-name { color: #374151; font-weight: 500; }
          .color-dot {
            &.zone-dot { background: #3b82f6; box-shadow: none; }
            &.station-dot { background: #f59e0b; box-shadow: none; }
            &.device-dot { background: #10b981; box-shadow: none; }
            &.alarm-dot-legend { background: #ef4444; box-shadow: none; animation: none; }
          }
        }
      }
    }
    .error-alert {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #ef4444;
    }
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

  /* 适配浅色主题 */
  .theme-light & {
    background: rgba(255, 255, 255, 0.95);
    color: #111827;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    &.zone-label { border-color: #3b82f6; color: #3b82f6; box-shadow: none; }
    &.station-label { border-color: #f59e0b; color: #f59e0b; }
    &.device-label { border-color: #10b981; color: #10b981; }
  }
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

  /* 适配浅色主题 */
  .theme-light & {
    .core { box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important; border: 1.5px solid #fff; }
    &.station-marker .core { background: #f59e0b; }
    &.device-marker .core { background: #10b981; }
    &.alarming .core { background: #ef4444 !important; border-color: #fca5a5; }
    &.alarming .pulse { background: rgba(239, 68, 68, 0.3); }
  }
}

@keyframes pulse-red-map {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
}

.cluster-marker {
  width: 40px;
  height: 40px;
  background: rgba(0, 255, 170, 0.2);
  border: 2px solid #00ffaa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00ffaa;
  font-weight: bold;
  font-family: 'Orbitron', sans-serif;
  box-shadow: 0 0 15px rgba(0, 255, 170, 0.5);
  backdrop-filter: blur(4px);
  transition: all 0.3s;

  &:hover {
    transform: scale(1.1);
    background: rgba(0, 255, 170, 0.4);
  }

  /* 适配浅色主题 */
  .theme-light & {
    background: rgba(16, 185, 129, 0.1);
    border-color: #10b981;
    color: #10b981;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    &:hover { background: rgba(16, 185, 129, 0.2); }
  }
  
  &.station-cluster {
    background: rgba(255, 215, 0, 0.2);
    border-color: #ffd700;
    color: #ffd700;
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
    width: 50px;
    height: 50px;
    &:hover { background: rgba(255, 215, 0, 0.4); }
    
    .theme-light & {
      background: rgba(245, 158, 11, 0.1);
      border-color: #f59e0b;
      color: #f59e0b;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      &:hover { background: rgba(245, 158, 11, 0.2); }
    }
  }
}
.amap-logo, .amap-copyright {
  display: none !important;
}
</style>
