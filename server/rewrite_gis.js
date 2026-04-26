const fs = require('fs');

const oldContent = fs.readFileSync('/workspace/admin/src/views/gis/screen/index.vue', 'utf8');

let newContent = oldContent;

// 1. replace template right panel
const templateRightPanelOld = `
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
`;

const templateRightPanelNew = `
        <div class="layer-controls">
          <div class="layer-group">
            <label class="layer-switch">
              <div class="switch-info"><span class="color-dot zone-dot"></span><span class="layer-name">供水管网分区 (Polygons)</span></div>
              <el-switch v-model="layerVisible.zones" @change="toggleLayer('zones')" active-color="#00e5ff" />
            </label>
            <label class="layer-switch">
              <div class="switch-info"><span class="color-dot alarm-dot-legend"></span><span class="layer-name">实时告警事件 (Alarms)</span></div>
              <el-switch v-model="layerVisible.alarms" @change="toggleLayer('alarms')" active-color="#ff003c" />
            </label>
          </div>

          <div class="layer-group-title">监测站点</div>
          <div class="layer-group">
            <label class="layer-switch mini" v-for="cat in stationCategories" :key="cat.value">
              <div class="switch-info"><span class="color-dot" :style="{background: cat.color}"></span><span class="layer-name">{{ cat.label }}</span></div>
              <el-switch v-model="layerVisible['station_' + cat.value]" @change="toggleLayer('station_' + cat.value)" :active-color="cat.color" size="small" />
            </label>
          </div>

          <div class="layer-group-title">物联设备</div>
          <div class="layer-group">
            <label class="layer-switch mini" v-for="cat in deviceCategories" :key="cat.value">
              <div class="switch-info"><span class="color-dot" :style="{background: cat.color}"></span><span class="layer-name">{{ cat.label }}</span></div>
              <el-switch v-model="layerVisible['device_' + cat.value]" @change="toggleLayer('device_' + cat.value)" :active-color="cat.color" size="small" />
            </label>
          </div>
        </div>
`;
newContent = newContent.replace(templateRightPanelOld.trim(), templateRightPanelNew.trim());

fs.writeFileSync('/workspace/admin/src/views/gis/screen/index.vue', newContent);
