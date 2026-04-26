<template>
  <div class="gis-screen-container">
    <div id="map-container" class="map-container" v-loading="loading" element-loading-text="地图引擎加载中... 稍等片刻" element-loading-background="rgba(0, 0, 0, 0.8)"></div>
    
    <!-- 头部横幅 -->
    <div class="screen-header">
      <div class="header-left">
        <el-icon @click="goBack" class="back-btn"><ArrowLeft /></el-icon>
      </div>
      <div class="header-center">
        <h1>综合水务GIS大屏监控</h1>
      </div>
      <div class="header-right">
        <span class="time">{{ currentTime }}</span>
      </div>
    </div>

    <!-- 左侧悬浮面板 -->
    <div class="panel-left">
      <div class="panel-box">
        <h3 class="panel-title">设备总览</h3>
        <div class="stat-items">
          <div class="stat-item">
            <span class="stat-label">监测站点</span>
            <span class="stat-value text-blue">{{ stationCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">物联设备</span>
            <span class="stat-value text-green">{{ deviceCount }}</span>
          </div>
        </div>
      </div>
      <div class="panel-box">
        <h3 class="panel-title">系统告警</h3>
        <div v-if="initErrorMsg" class="error-alert">
          <el-icon><Warning /></el-icon> {{ initErrorMsg }}
        </div>
        <div v-else class="stat-items" style="opacity: 0.5">
          <span style="color: #fff">系统运行正常，无告警</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import AMapLoader from '@amap/amap-jsapi-loader';
import { useRouter } from 'vue-router';
import { listConfig } from '@/api/system/config';
import { listStation, listDevice } from '@/api/water-basic/equipment';
import { ArrowLeft, Warning } from '@element-plus/icons-vue';
import dayjs from 'dayjs';

const router = useRouter();
const loading = ref(true);
const currentTime = ref('');
const initErrorMsg = ref('');
let timer = null;

const stationCount = ref(0);
const deviceCount = ref(0);

const mapInstance = ref(null);
let currentMapType = '';

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

async function initScreen() {
  try {
    // 1. 加载 GIS 配置 (如果未登录等原因请求失败，提供兜底配置)
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

    // 2. 根据配置动态加载地图引擎
    await loadMapEngine(source, configMap);

    // 3. 加载并绘制点位数据
    await loadAndScatterPoints();
    
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
      const key = configMap['gis.map.amap.key'] || 'f2ce1125b07fe3e22ebd5924b75ca6d1'; // 增加默认硬编码兜底
      const mapStyle = configMap['gis.map.style'] || 'amap://styles/light';
      
      if (!key) {
        console.error('地图初始化失败: 请填写高德地图 Key');
        reject(new Error('请填写高德地图 Key'));
        return;
      }
      
      if (!window._AMapSecurityConfig) {
        window._AMapSecurityConfig = { securityJsCode: configMap['gis.map.amap.security'] || '610162c69ef7947baf638e9b445316c5' };
      }
      AMapLoader.load({
        key: key,
        version: '2.0',
        plugins: ['AMap.Marker']
      }).then((AMap) => {
        window.AMap = AMap; // 挂载到全局供撒点使用
        mapInstance.value = new AMap.Map('map-container', {
            zoom: 12,
            center: [118.60, 24.90], // 默认泉州附近，后续会根据点位自适应
            mapStyle: mapStyle,
            viewMode: '3D'
          });
        resolve();
      }).catch(reject);
    } else if (source === 'baidu') {
      const key = configMap['gis.map.baidu.key'] || '';
      const mapStyle = configMap['gis.map.style'] || '';
      window.initBMapCallback = () => {
        const BMap = window.BMap || window.BMapGL;
        if (BMap) {
            mapInstance.value = new BMap.Map('map-container');
            mapInstance.value.centerAndZoom(new BMap.Point(118.60, 24.90), 12);
            mapInstance.value.enableScrollWheelZoom(true);
            if (mapStyle && mapStyle.includes('3d')) {
              mapInstance.value.setMapStyleV2({ styleId: mapStyle });
            } else if (mapStyle) {
              mapInstance.value.setMapStyle({ style: mapStyle });
            }
            resolve();
          } else {
          reject(new Error('百度地图加载失败'));
        }
      };
      loadScript(`https://api.map.baidu.com/api?v=3.0&type=webgl&ak=${key}&callback=initBMapCallback`).catch(reject);

    } else if (source === 'tianditu') {
      const key = configMap['gis.map.tianditu.key'] || '';
      loadScript(`http://api.tianditu.gov.cn/api?v=4.0&tk=${key}`)
        .then(() => {
          const T = window.T;
          mapInstance.value = new T.Map('map-container');
          mapInstance.value.centerAndZoom(new T.LngLat(118.60, 24.90), 12);
          resolve();
        }).catch(reject);
    } else {
      resolve(); // custom 暂时不处理
    }
  });
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    // 防止重复加载
    if (document.querySelector(`script[src^="${url.split('?')[0]}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function loadAndScatterPoints() {
  try {
    // 并发拉取站点和设备数据
    const [stationRes, deviceRes] = await Promise.all([
      listStation({ pageSize: 1000 }),
      listDevice({ pageSize: 1000 })
    ]);

    const stations = stationRes.rows || [];
    const devices = deviceRes.rows || [];

    stationCount.value = stations.length;
    deviceCount.value = devices.length;

    const points = [];

    // 收集有效坐标
    stations.forEach(s => {
      if (s.longitude && s.latitude) {
        points.push({ lng: Number(s.longitude), lat: Number(s.latitude), name: s.name, type: 'station' });
      }
    });

    devices.forEach(d => {
      if (d.longitude && d.latitude) {
        points.push({ lng: Number(d.longitude), lat: Number(d.latitude), name: d.name, type: 'device' });
      }
    });

    // 根据不同地图引擎渲染点位
    if (currentMapType === 'amap' && window.AMap) {
      const markers = points.map(p => {
        const marker = new window.AMap.Marker({
          position: [p.lng, p.lat],
          title: p.name
        });
        
        // 在 v2.0 API 中，建议使用 content 属性来设置自定义标签
        const labelContent = `<div class="map-label ${p.type}">${p.name}</div>`;
        marker.setLabel({
          content: labelContent,
          direction: 'right'
        });
        return marker;
      });
      mapInstance.value.add(markers);
      if (markers.length > 0) {
        mapInstance.value.setFitView(markers);
      }
    } 
    else if (currentMapType === 'baidu' && (window.BMap || window.BMapGL)) {
      const BMap = window.BMap || window.BMapGL;
      const pointArray = [];
      points.forEach(p => {
        const pt = new BMap.Point(p.lng, p.lat);
        pointArray.push(pt);
        const marker = new BMap.Marker(pt);
        mapInstance.value.addOverlay(marker);
        const label = new BMap.Label(p.name, { offset: new BMap.Size(20, -10) });
        label.setStyle({ border: 'none', background: 'transparent', color: p.type === 'station' ? '#00e5ff' : '#00ffaa' });
        marker.setLabel(label);
      });
      if (pointArray.length > 0) {
        mapInstance.value.setViewport(pointArray);
      }
    }
    else if (currentMapType === 'tianditu' && window.T) {
      const T = window.T;
      const lnglats = [];
      points.forEach(p => {
        const pt = new T.LngLat(p.lng, p.lat);
        lnglats.push(pt);
        const marker = new T.Marker(pt);
        mapInstance.value.addOverLay(marker);
      });
      if (lnglats.length > 0) {
        mapInstance.value.setViewport(lnglats);
      }
    }
  } catch (error) {
    console.error('拉取点位数据失败:', error);
  }
}
</script>

<style lang="scss" scoped>
.gis-screen-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #030b14;
  z-index: 9999;
  overflow: hidden;

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
  height: 80px;
  background: url('https://img.alicdn.com/tfs/TB1Jc0bzbvpK1RjSZFqXXcXgVXa-1920-80.png') no-repeat center top;
  background-size: 100% 100%;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;

  .header-left {
    width: 25%;
    .back-btn {
      color: #00e5ff;
      font-size: 24px;
      cursor: pointer;
      transition: all 0.3s;
      &:hover {
        color: #fff;
        transform: scale(1.1);
      }
    }
  }

  .header-center {
    width: 50%;
    text-align: center;
    h1 {
      margin: 0;
      color: #fff;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 4px;
      text-shadow: 0 0 10px rgba(0, 229, 255, 0.8);
      line-height: 80px;
    }
  }

  .header-right {
    width: 25%;
    text-align: right;
    .time {
      color: #00e5ff;
      font-size: 18px;
      font-family: 'Courier New', Courier, monospace;
      font-weight: bold;
    }
  }
}

    .panel-left {
      position: absolute;
      top: 100px;
      left: 20px;
      width: 350px;
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 20px;

      .panel-box {
        background: rgba(10, 25, 51, 0.7);
        border: 1px solid rgba(0, 229, 255, 0.3);
        border-radius: 8px;
        padding: 20px;
        backdrop-filter: blur(10px);
        box-shadow: inset 0 0 20px rgba(0, 229, 255, 0.1);

        .panel-title {
          color: #fff;
          font-size: 18px;
          margin: 0 0 20px 0;
          padding-left: 15px;
          position: relative;
          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 16px;
            background: #00e5ff;
            border-radius: 2px;
          }
        }

        .stat-items {
          display: flex;
          justify-content: space-between;
          
          .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;

            .stat-label {
              color: #8bb0d3;
              font-size: 14px;
              margin-bottom: 10px;
            }

            .stat-value {
              font-size: 32px;
              font-weight: bold;
              font-family: 'Courier New', Courier, monospace;

              &.text-blue { color: #00e5ff; text-shadow: 0 0 10px rgba(0, 229, 255, 0.5); }
              &.text-green { color: #00ffaa; text-shadow: 0 0 10px rgba(0, 255, 170, 0.5); }
            }
          }
        }
      }
    }

  .error-alert {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
  border: 1px solid rgba(245, 108, 108, 0.3);
  padding: 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
  :deep(.map-label) {
    background: rgba(10, 25, 51, 0.8);
    border: 1px solid rgba(0, 229, 255, 0.5);
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;

    &.station { border-color: #00e5ff; color: #00e5ff; }
    &.device { border-color: #00ffaa; color: #00ffaa; }
  }
}

</style>
<style>
body, html {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100%;
}
/* 隐藏百度地图等logo */
.BMap_cpyCtrl, .anchorBL, .amap-logo, .amap-copyright {
  display: none !important;
}
</style>
