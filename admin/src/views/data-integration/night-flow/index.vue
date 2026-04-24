<template>
  <div class="app-container night-flow-container">
    <div class="left-panel">
      <div class="panel-header">
        <span class="title">分区夜间最小流量</span>
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="请输入分区名称搜索"
            size="small"
            clearable
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #append>
              <el-button icon="Search" @click="handleSearch"></el-button>
            </template>
          </el-input>
        </div>
      </div>
      
      <div class="table-container">
        <el-table
          ref="zoneTable"
          v-loading="tableLoading"
          :data="zoneList"
          row-key="code"
          :default-expand-all="false"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          height="100%"
          size="small"
          @row-click="handleRowClick"
          highlight-current-row
          border
        >
          <el-table-column prop="name" label="分区名称" show-overflow-tooltip min-width="220">
            <template #default="scope">
              <div class="zone-name-cell">
                <span class="level-badge" :class="'level-' + scope.row.level">L{{ scope.row.level }}</span>
                <span class="zone-name">{{ scope.row.name }}</span>
                <el-tag v-if="scope.row.isAlarm" type="danger" size="small" effect="dark" style="margin-left: 8px;">报警</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="今日夜小" align="center" width="80">
            <template #default="scope">
              <span class="val-text">{{ formatVal(getFlowData(scope.row.code, 'todayVal')) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="昨日夜小" align="center" width="80">
            <template #default="scope">
              <span class="val-text">{{ formatVal(getFlowData(scope.row.code, 'yesterdayVal')) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="插值" align="center" width="80">
            <template #default="scope">
              <span class="val-text" :class="getTrendClass(getFlowData(scope.row.code, 'diffVal'))">
                {{ getFlowData(scope.row.code, 'diffVal') > 0 ? '+' : '' }}{{ formatVal(getFlowData(scope.row.code, 'diffVal')) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="比率" align="center" width="80">
            <template #default="scope">
              <span class="val-text" :class="getTrendClass(getFlowData(scope.row.code, 'ratio'))">
                <i :class="getTrendIcon(getFlowData(scope.row.code, 'ratio'))"></i>
                {{ getFlowData(scope.row.code, 'ratio') > 0 ? '+' : '' }}{{ getFlowData(scope.row.code, 'ratio') !== null ? getFlowData(scope.row.code, 'ratio') + '%' : '--' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="60" fixed="right">
            <template #default="scope">
              <el-button link type="primary" icon="DataLine" @click.stop="openDrawer(scope.row)" title="详情"></el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    
    <div class="right-panel">
      <!-- 暂时用作地图占位 -->
      <div class="map-placeholder">
        <div class="map-content">
          <i class="el-icon-location-information" style="font-size: 48px; color: #909399; margin-bottom: 16px;"></i>
          <h2>GIS 地图区域</h2>
          <p v-if="activeZone">当前定位分区: <strong>{{ activeZone.zoneName }}</strong></p>
          <p v-else>请点击左侧分区列表定位</p>
        </div>
      </div>
    </div>

    <el-drawer
      :title="drawerTitle"
      v-model="drawerVisible"
      direction="ltr"
      size="60%"
      destroy-on-close
      class="night-flow-drawer"
      @open="handleDrawerOpen"
      @opened="handleDrawerOpened"
      @close="handleDrawerClose"
    >
      <div class="drawer-content" v-loading="drawerLoading">
        <div class="drawer-row full-width">
          <el-card class="box-card" shadow="never">
            <div slot="header" class="clearfix">
              <span>分区 30 天夜间最小流量趋势</span>
            </div>
            <div class="chart-container">
              <div id="chart-30day" style="width: 100%; height: 100%;"></div>
            </div>
          </el-card>
        </div>
        
        <div class="drawer-row full-width">
          <el-card class="box-card" shadow="never">
            <div slot="header" class="clearfix">
              <span>分区 10 天小时表数据</span>
            </div>
            <div class="chart-container">
              <div id="chart-10day" style="width: 100%; height: 100%;"></div>
            </div>
          </el-card>
        </div>
        
        <div class="drawer-row half-width-container">
          <div class="drawer-col half-width">
            <el-card class="box-card" shadow="never">
              <div slot="header" class="clearfix">
                <span>测点最新数据</span>
                <el-button style="float: right; padding: 3px 0" link type="primary" icon="Refresh" @click="refreshLatestData"></el-button>
              </div>
              <div class="list-content">
                <el-table :data="latestDataList" size="small" height="250">
                  <el-table-column prop="pointName" label="测点名称" show-overflow-tooltip></el-table-column>
                  <el-table-column prop="val" label="最新值" width="100">
                    <template #default="scope">
                      <span class="value-highlight">{{ scope.row.val }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="ts" label="更新时间" width="140"></el-table-column>
                </el-table>
              </div>
            </el-card>
          </div>
          
          <div class="drawer-col half-width">
            <el-card class="box-card" shadow="never">
              <div slot="header" class="clearfix">
                <span>实时报警数据</span>
              </div>
              <div class="list-content">
                <el-table :data="alarmList" size="small" height="250">
                  <el-table-column prop="time" label="报警时间" width="140"></el-table-column>
                  <el-table-column prop="content" label="报警内容" show-overflow-tooltip></el-table-column>
                  <el-table-column prop="level" label="等级" width="80">
                    <template #default="scope">
                      <el-tag size="small" :type="scope.row.level === '严重' ? 'danger' : 'warning'">{{ scope.row.level }}</el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import request from '@/utils/request'
import { listZoneTree } from '@/api/water-basic/zone'
import * as echarts from 'echarts'

export default {
  name: 'ZoneNightFlow',
  data() {
    return {
      tableLoading: false,
      zoneList: [],
      flowDataMap: {},
      
      searchQuery: '',
      
      // 定时器
      mainTimer: null,
      drawerLatestTimer: null,
      drawerAlarmTimer: null,
      
      // 交互状态
      activeZone: null,
      drawerVisible: false,
      drawerLoading: false,
      
      // 抽屉图表实例
      chart30Day: null,
      chart10Day: null,
      
      // 抽屉数据
      latestDataList: [],
      alarmList: []
    }
  },
  computed: {
    drawerTitle() {
      return this.activeZone ? `分区详情 - ${this.activeZone.name}` : '分区详情';
    }
  },
  created() {
    this.initData();
  },
  beforeDestroy() {
    this.clearAllTimers();
    if (this.chart30Day) this.chart30Day.dispose();
    if (this.chart10Day) this.chart10Day.dispose();
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    async initData() {
      this.tableLoading = true;
      try {
        const res = await listZoneTree({ name: this.searchQuery || undefined });
        if (res.code === 200 && res.data) {
          this.zoneList = this.addLevelToTree(res.data, 1);
          this.fetchFlowDataForTree(this.zoneList);
          
          // 开启主列表的 5 分钟定时刷新
          clearInterval(this.mainTimer);
          this.mainTimer = setInterval(() => {
            this.fetchFlowDataForTree(this.zoneList);
          }, 5 * 60 * 1000);
        }
      } catch (error) {
        console.error('获取分区树失败', error);
      } finally {
        this.tableLoading = false;
      }
    },
    
    addLevelToTree(tree, level) {
      return tree.map(node => {
        return {
          ...node,
          level,
          children: node.children && node.children.length > 0 ? this.addLevelToTree(node.children, level + 1) : []
        };
      });
    },
    
    // 搜索处理
    handleSearch() {
      this.initData();
    },
    
    // 批量获取流量数据
    async fetchFlowDataForTree(tree) {
      if (!tree || tree.length === 0) return;
      
      const allCodes = [];
      const traverse = (nodes) => {
        nodes.forEach(node => {
          allCodes.push(node.code);
          if (node.children && node.children.length > 0) {
            traverse(node.children);
          }
        });
      };
      traverse(tree);
      
      if (allCodes.length === 0) return;

      // 分批查询，防止 URL 过长
      const chunks = [];
      for (let i = 0; i < allCodes.length; i += 150) {
        chunks.push(allCodes.slice(i, i + 150));
      }

      for (const chunk of chunks) {
        try {
          const res = await request({
            url: '/data-integration/query/zone-night-flow/batch',
            method: 'get',
            params: { zoneCodes: chunk.join(',') }
          });
          if (res.code === 200 && res.data) {
            res.data.forEach(item => {
              this.flowDataMap[item.zoneCode] = item;
            });
            this.flowDataMap = { ...this.flowDataMap };
          }
        } catch(e) {
          console.error('批量获取流量失败', e);
        }
      }
    },
    
    getFlowData(code, field) {
      if (this.flowDataMap[code]) {
        return this.flowDataMap[code][field];
      }
      return null;
    },
    
    // 行点击展开/折叠
    handleRowClick(row, column) {
      if (column && column.label === '操作') return;
      if (this.$refs.zoneTable) {
        this.$refs.zoneTable.toggleRowExpansion(row);
      }
    },
    
    // 抽屉打开
    openDrawer(item) {
      this.activeZone = item;
      this.drawerVisible = true;
    },
    
    // 抽屉打开
    handleDrawerOpen() {
      this.drawerLoading = true;
    },
    
    // 抽屉动画结束，此时 DOM 完全可见且宽度正确
    handleDrawerOpened() {
      this.initCharts();
      
      this.drawerLoading = false;
      
      // 渲染空图表或实际数据
      this.render30DayChart([]);
      this.render10DayChart([]);
      
      this.refreshLatestData();
      this.refreshAlarmData();
      
      // 开启抽屉内的定时刷新
      this.drawerLatestTimer = setInterval(this.refreshLatestData, 30 * 1000); // 30秒
      this.drawerAlarmTimer = setInterval(this.refreshAlarmData, 15 * 1000); // 15秒
    },
    
    // 抽屉关闭
    handleDrawerClose() {
      clearInterval(this.drawerLatestTimer);
      clearInterval(this.drawerAlarmTimer);
      if (this.chart30Day) {
        this.chart30Day.dispose();
        this.chart30Day = null;
      }
      if (this.chart10Day) {
        this.chart10Day.dispose();
        this.chart10Day = null;
      }
      window.removeEventListener('resize', this.handleResize);
    },
    
    // 初始化图表实例
    initCharts() {
      const dom30 = document.getElementById('chart-30day');
      const dom10 = document.getElementById('chart-10day');
      if (dom30) this.chart30Day = echarts.init(dom30);
      if (dom10) this.chart10Day = echarts.init(dom10);
      
      window.addEventListener('resize', this.handleResize);
    },
    
    handleResize() {
      if (this.chart30Day) this.chart30Day.resize();
      if (this.chart10Day) this.chart10Day.resize();
    },
    
    // 渲染 30 天图表
    render30DayChart(dataList) {
      if (!this.chart30Day) return;
      
      const option = {
        title: {
          show: dataList.length === 0,
          text: '暂无数据',
          left: 'center',
          top: 'center',
          textStyle: { color: '#909399', fontSize: 14, fontWeight: 'normal' }
        },
        tooltip: { trigger: 'axis' },
        grid: { top: 30, right: 20, bottom: 30, left: 50 },
        xAxis: {
          type: 'category',
          data: dataList.map(item => item.date || ''),
          axisLine: { lineStyle: { color: '#DCDFE6' } },
          axisLabel: { color: '#606266' }
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { type: 'dashed', color: '#E4E7ED' } }
        },
        series: [
          {
            data: dataList.map(item => item.value || null),
            type: 'line',
            smooth: true,
            itemStyle: { color: '#409EFF' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(64,158,255,0.3)' },
                { offset: 1, color: 'rgba(64,158,255,0.05)' }
              ])
            }
          }
        ]
      };
      this.chart30Day.setOption(option, true);
    },
    
    // 渲染 10 天图表
    render10DayChart(dataList) {
      if (!this.chart10Day) return;
      
      const option = {
        title: {
          show: dataList.length === 0,
          text: '暂无数据',
          left: 'center',
          top: 'center',
          textStyle: { color: '#909399', fontSize: 14, fontWeight: 'normal' }
        },
        tooltip: { trigger: 'axis' },
        grid: { top: 30, right: 20, bottom: 30, left: 50 },
        xAxis: {
          type: 'category',
          data: dataList.map(item => item.time || ''),
          axisLine: { lineStyle: { color: '#DCDFE6' } },
          axisLabel: { color: '#606266' }
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { type: 'dashed', color: '#E4E7ED' } }
        },
        series: [
          {
            data: dataList.map(item => item.value || null),
            type: 'bar',
            itemStyle: { color: '#67C23A', borderRadius: [4, 4, 0, 0] },
            barMaxWidth: 30
          }
        ]
      };
      this.chart10Day.setOption(option, true);
    },
    
    // 刷新最新数据
    async refreshLatestData() {
      if (!this.activeZone || !this.activeZone.zoneCode) return;
      try {
        const res = await request({
          url: '/data-integration/query/zone-points/latest',
          method: 'get',
          params: { zoneCode: this.activeZone.zoneCode }
        });
        if (res.code === 200 && res.data) {
          this.latestDataList = res.data;
        } else {
          this.latestDataList = [];
        }
      } catch (error) {
        console.error('获取测点最新数据失败', error);
        this.latestDataList = [];
      }
    },
    
    // 刷新报警数据
    async refreshAlarmData() {
      if (!this.activeZone || !this.activeZone.zoneCode) return;
      try {
        const res = await request({
          url: '/data-integration/query/zone-alarms',
          method: 'get',
          params: { zoneCode: this.activeZone.zoneCode }
        });
        if (res.code === 200 && res.data) {
          this.alarmList = res.data;
        } else {
          this.alarmList = [];
        }
      } catch (error) {
        console.error('获取报警数据失败', error);
        this.alarmList = [];
      }
    },
    
    // 清除所有定时器
    clearAllTimers() {
      clearInterval(this.mainTimer);
      clearInterval(this.drawerLatestTimer);
      clearInterval(this.drawerAlarmTimer);
      clearTimeout(this.scrollTimeout);
    },
    
    // 格式化展示
    formatVal(val) {
      return val !== null && val !== undefined ? val : '--';
    },
    
    // 趋势颜色
    getTrendClass(val) {
      if (val === null || val === undefined || val === 0) return '';
      return val > 0 ? 'trend-up' : 'trend-down';
    },
    
    // 趋势图标
    getTrendIcon(val) {
      if (val === null || val === undefined || val === 0) return '';
      return val > 0 ? 'el-icon-top' : 'el-icon-bottom';
    }
  }
}
</script>

<style lang="scss" scoped>
.night-flow-container {
  display: flex;
  height: calc(100vh - 84px);
  padding: 0;
  margin: 0;
  overflow: hidden;
  background-color: #f0f2f5;

  .left-panel {
    width: 50%;
    min-width: 500px;
    height: 100%;
    background: #fff;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #ebeef5;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
    z-index: 10;
    
    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid #ebeef5;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      .title {
        font-size: 16px;
        font-weight: bold;
        color: #303133;
      }
      .search-bar {
        width: 250px;
      }
    }
    
    .table-container {
      flex: 1;
      overflow: hidden;
      padding: 10px;
      
      .zone-name-cell {
        display: flex;
        align-items: center;
      }
      
      .level-badge {
        display: inline-block;
        padding: 0 6px;
        height: 20px;
        line-height: 20px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        margin-right: 8px;
        color: #fff;
        &.level-1 { background-color: #409EFF; }
        &.level-2 { background-color: #67C23A; }
        &.level-3 { background-color: #E6A23C; }
        &.level-4 { background-color: #F56C6C; }
        &.level-5 { background-color: #909399; }
      }
      
      .zone-name {
        font-size: 14px;
        color: #303133;
        font-weight: 500;
      }
      
      .val-text {
        font-weight: bold;
        font-size: 14px;
        &.trend-up { color: #F56C6C; }
        &.trend-down { color: #67C23A; }
      }
    }
  }
  
  .right-panel {
    flex: 1;
    position: relative;
    background: #e4e7ed;
    
    .map-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at center, #f5f7fa 0%, #e4e7ed 100%);
      
      .map-content {
        text-align: center;
        color: #606266;
        padding: 40px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 8px;
        box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
      }
    }
  }
}

// 抽屉内部样式
.night-flow-drawer {
  ::v-deep .el-drawer__body {
    padding: 0;
    overflow: hidden;
  }
  
  .drawer-content {
    height: 100%;
    padding: 20px;
    overflow-y: auto;
    background-color: #f5f7fa;
    
    .drawer-row {
      margin-bottom: 20px;
      
      &.half-width-container {
        display: flex;
        justify-content: space-between;
        
        .drawer-col {
          width: calc(50% - 10px);
        }
      }
    }
    
    .box-card {
      ::v-deep .el-card__header {
        padding: 12px 20px;
        font-weight: bold;
        background-color: #fafafa;
      }
      
      ::v-deep .el-card__body {
        padding: 16px;
      }
    }
    
    .chart-container {
      height: 250px;
    }
    
    .value-highlight {
      font-weight: bold;
      color: #409EFF;
    }
  }
}
</style>
