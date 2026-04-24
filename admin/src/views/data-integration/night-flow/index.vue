<template>
  <div class="app-container night-flow-container">
    <div class="left-panel">
      <div class="panel-header">
        <span class="title">分区夜间最小流量</span>
      </div>
      <div class="list-container" ref="listContainer" @scroll="handleScroll">
        <div class="list-inner" :style="{ height: totalHeight + 'px', paddingTop: offsetTop + 'px' }">
          <div 
            v-for="item in visibleData" 
            :key="item.zoneCode" 
            class="zone-card"
            :class="{ 'is-alarm': item.isAlarm, 'is-focus': item.isFocus }"
            @click="handleCardClick(item)"
          >
            <div class="card-header">
              <div class="zone-info">
                <i 
                  v-if="item.hasChildren"
                  class="el-icon-arrow-right expand-icon" 
                  :class="{ 'is-expanded': item.expanded }"
                  @click.stop="toggleExpand(item)"
                ></i>
                <i v-else class="el-icon-caret-right expand-icon invisible"></i>
                
                <span class="level-badge" :class="'level-' + item.level">L{{ item.level }}</span>
                <span class="zone-name">{{ item.zoneName }}</span>
              </div>
              <div class="zone-actions">
                <el-tag v-if="item.isAlarm" type="danger" size="mini" effect="dark">报警</el-tag>
              </div>
            </div>
            
            <div class="card-body">
              <div class="data-row">
                <div class="data-item">
                  <span class="label">今日夜小</span>
                  <span class="value">{{ formatVal(item.todayVal) }}</span>
                </div>
                <div class="data-item">
                  <span class="label">昨日夜小</span>
                  <span class="value">{{ formatVal(item.yesterdayVal) }}</span>
                </div>
                <div class="data-item">
                  <span class="label">插值</span>
                  <span class="value" :class="getTrendClass(item.diffVal)">
                    {{ item.diffVal > 0 ? '+' : '' }}{{ formatVal(item.diffVal) }}
                  </span>
                </div>
                <div class="data-item">
                  <span class="label">比率</span>
                  <span class="value" :class="getTrendClass(item.ratio)">
                    <i :class="getTrendIcon(item.ratio)"></i>
                    {{ item.ratio > 0 ? '+' : '' }}{{ item.ratio !== null ? item.ratio + '%' : '--' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
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

    <!-- 详情抽屉 -->
    <el-drawer
      :title="drawerTitle"
      :visible.sync="drawerVisible"
      direction="ltr"
      size="60%"
      :modal="false"
      class="night-flow-drawer"
      @open="handleDrawerOpen"
      @close="handleDrawerClose"
    >
      <div class="drawer-content" v-loading="drawerLoading">
        <div class="drawer-row full-width">
          <el-card class="box-card" shadow="never">
            <div slot="header" class="clearfix">
              <span>分区 30 天夜间最小流量趋势</span>
            </div>
            <div class="chart-container">
              <div class="placeholder-chart">30天趋势图表区域</div>
            </div>
          </el-card>
        </div>
        
        <div class="drawer-row full-width">
          <el-card class="box-card" shadow="never">
            <div slot="header" class="clearfix">
              <span>分区 10 天小时表数据</span>
            </div>
            <div class="chart-container">
              <div class="placeholder-chart">10天小时趋势图表区域</div>
            </div>
          </el-card>
        </div>
        
        <div class="drawer-row half-width-container">
          <div class="drawer-col half-width">
            <el-card class="box-card" shadow="never">
              <div slot="header" class="clearfix">
                <span>测点最新数据</span>
                <el-button style="float: right; padding: 3px 0" type="text" icon="el-icon-refresh" @click="refreshLatestData"></el-button>
              </div>
              <div class="list-content">
                <el-table :data="latestDataList" size="small" height="250">
                  <el-table-column prop="pointName" label="测点名称" show-overflow-tooltip></el-table-column>
                  <el-table-column prop="val" label="最新值" width="100">
                    <template slot-scope="scope">
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
                    <template slot-scope="scope">
                      <el-tag size="mini" :type="scope.row.level === '严重' ? 'danger' : 'warning'">{{ scope.row.level }}</el-tag>
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

export default {
  name: 'ZoneNightFlow',
  data() {
    return {
      // 树形列表展平后的全部数据
      flatData: [],
      // 实际渲染的数据列表（虚拟滚动控制）
      renderData: [],
      
      // 虚拟滚动相关
      itemHeight: 88, // 卡片高度
      visibleCount: 15, // 可见数量
      startIndex: 0,
      
      // 定时器
      mainTimer: null,
      drawerLatestTimer: null,
      drawerAlarmTimer: null,
      
      // 交互状态
      activeZone: null,
      drawerVisible: false,
      drawerLoading: false,
      
      // 抽屉数据
      latestDataList: [],
      alarmList: []
    }
  },
  computed: {
    totalHeight() {
      return this.renderData.length * this.itemHeight;
    },
    offsetTop() {
      return this.startIndex * this.itemHeight;
    },
    visibleData() {
      return this.renderData.slice(this.startIndex, this.startIndex + this.visibleCount);
    },
    drawerTitle() {
      return this.activeZone ? `分区详情 - ${this.activeZone.zoneName}` : '分区详情';
    }
  },
  created() {
    this.initData();
  },
  beforeDestroy() {
    this.clearAllTimers();
  },
  methods: {
    async initData() {
      // 1. 先获取分区的树形结构（假设已有接口）
      // 这里用 mock 数据代替真实的树形结构获取
      const mockTree = this.generateMockTree();
      
      // 2. 将树形结构拍平，添加层级和折叠状态
      this.flatData = this.flattenTree(mockTree, 1);
      this.updateRenderData();
      
      // 3. 初始加载视口内的数据
      this.fetchVisibleData();
      
      // 4. 开启主列表的 5 分钟定时刷新
      this.mainTimer = setInterval(() => {
        this.fetchVisibleData();
      }, 5 * 60 * 1000);
    },
    
    // 拍平树形结构
    flattenTree(tree, level) {
      let result = [];
      tree.forEach(node => {
        const item = {
          ...node,
          level,
          expanded: true, // 默认展开
          hasChildren: node.children && node.children.length > 0,
          // 初始指标数据为空
          todayVal: null,
          yesterdayVal: null,
          diffVal: null,
          ratio: null
        };
        result.push(item);
        if (item.hasChildren) {
          result = result.concat(this.flattenTree(node.children, level + 1));
        }
      });
      return result;
    },
    
    // 根据折叠状态更新需要渲染的列表
    updateRenderData() {
      const renderList = [];
      let skipLevel = -1; // 标记需要跳过的层级深度
      
      for (const item of this.flatData) {
        // 如果当前节点的层级大于被折叠节点的层级，则跳过（不显示）
        if (skipLevel !== -1 && item.level > skipLevel) {
          continue;
        } else {
          skipLevel = -1; // 恢复正常
        }
        
        renderList.push(item);
        
        // 如果当前节点被折叠，标记它的下一级及更深层级都需要被跳过
        if (item.hasChildren && !item.expanded) {
          skipLevel = item.level;
        }
      }
      
      this.renderData = renderList;
    },
    
    // 虚拟滚动处理
    handleScroll() {
      const scrollTop = this.$refs.listContainer.scrollTop;
      this.startIndex = Math.floor(scrollTop / this.itemHeight);
      
      // 滚动停止后（简单防抖），触发视口数据获取
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.fetchVisibleData();
      }, 200);
    },
    
    // 获取当前视口内分区的夜间最小流量数据
    async fetchVisibleData() {
      const currentVisible = this.visibleData;
      if (currentVisible.length === 0) return;
      
      const zoneCodes = currentVisible.map(item => item.zoneCode).join(',');
      
      try {
        const res = await request({
          url: '/data-integration/query/zone-night-flow/batch',
          method: 'get',
          params: { zoneCodes }
        });
        
        if (res.code === 200 && res.data) {
          // 将结果合并回 flatData
          res.data.forEach(flowData => {
            const target = this.flatData.find(item => item.zoneCode === flowData.zoneCode);
            if (target) {
              target.todayVal = flowData.todayVal;
              target.yesterdayVal = flowData.yesterdayVal;
              target.diffVal = flowData.diffVal;
              target.ratio = flowData.ratio;
            }
          });
        }
      } catch (error) {
        console.error('获取分区流量数据失败', error);
      }
    },
    
    // 展开/折叠节点
    toggleExpand(item) {
      item.expanded = !item.expanded;
      this.updateRenderData();
    },
    
    // 点击卡片
    handleCardClick(item) {
      this.activeZone = item;
      this.drawerVisible = true;
    },
    
    // 抽屉打开
    handleDrawerOpen() {
      this.drawerLoading = true;
      // 模拟加载图表数据
      setTimeout(() => {
        this.drawerLoading = false;
        this.refreshLatestData();
        this.refreshAlarmData();
        
        // 开启抽屉内的定时刷新
        this.drawerLatestTimer = setInterval(this.refreshLatestData, 30 * 1000); // 30秒
        this.drawerAlarmTimer = setInterval(this.refreshAlarmData, 15 * 1000); // 15秒
      }, 500);
    },
    
    // 抽屉关闭
    handleDrawerClose() {
      clearInterval(this.drawerLatestTimer);
      clearInterval(this.drawerAlarmTimer);
    },
    
    // 刷新最新数据 (Mock)
    refreshLatestData() {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      this.latestDataList = [
        { pointName: '进口瞬时流量', val: (Math.random() * 50 + 50).toFixed(2), ts: timeStr },
        { pointName: '出口瞬时流量', val: (Math.random() * 40 + 40).toFixed(2), ts: timeStr },
        { pointName: '夜间最小流量', val: (Math.random() * 5 + 5).toFixed(2), ts: timeStr },
        { pointName: '管网压力', val: (Math.random() * 0.2 + 0.3).toFixed(3), ts: timeStr }
      ];
    },
    
    // 刷新报警数据 (Mock)
    refreshAlarmData() {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      // 随机生成 0-2 条报警
      const newAlarms = [];
      const count = Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        newAlarms.push({
          time: timeStr,
          content: Math.random() > 0.5 ? '管网压力异常波动' : '夜间最小流量超标',
          level: Math.random() > 0.3 ? '警告' : '严重'
        });
      }
      
      this.alarmList = [...newAlarms, ...this.alarmList].slice(0, 20); // 保留最新20条
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
    },
    
    // 生成测试用的 Mock 树
    generateMockTree() {
      return [
        {
          zoneCode: '10001',
          zoneName: '华东大区',
          isFocus: true,
          children: [
            {
              zoneCode: '20001',
              zoneName: '上海市辖区',
              children: [
                { zoneCode: '30001', zoneName: '浦东新区片区' },
                { zoneCode: '30002', zoneName: '黄浦区片区', isAlarm: true }
              ]
            },
            {
              zoneCode: '20002',
              zoneName: '江苏省辖区',
              children: [
                { zoneCode: '30003', zoneName: '南京市片区' },
                { zoneCode: '30004', zoneName: '苏州市片区' }
              ]
            }
          ]
        },
        {
          zoneCode: '10002',
          zoneName: '华北大区',
          children: [
            {
              zoneCode: '20003',
              zoneName: '北京市辖区',
              children: [
                { zoneCode: '30005', zoneName: '朝阳区片区' },
                { zoneCode: '30006', zoneName: '海淀区片区' }
              ]
            }
          ]
        },
        {
          zoneCode: '10003',
          zoneName: '华南大区',
          children: []
        }
      ];
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
    background: #fff;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #ebeef5;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
    z-index: 10;
    
    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid #ebeef5;
      .title {
        font-size: 16px;
        font-weight: bold;
        color: #303133;
      }
    }
    
    .list-container {
      flex: 1;
      overflow-y: auto;
      position: relative;
      
      .list-inner {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
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

// 卡片样式
.zone-card {
  height: 76px;
  margin: 6px 12px;
  padding: 10px 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
    border-color: #c0c4cc;
  }
  
  &.is-focus {
    border-left: 4px solid #409EFF;
  }
  
  &.is-alarm {
    border-color: #f56c6c;
    background-color: #fef0f0;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
    .zone-info {
      display: flex;
      align-items: center;
      
      .expand-icon {
        font-size: 14px;
        color: #909399;
        margin-right: 8px;
        padding: 2px;
        transition: transform 0.3s;
        
        &.is-expanded {
          transform: rotate(90deg);
        }
        
        &.invisible {
          visibility: hidden;
        }
        
        &:hover {
          color: #409EFF;
        }
      }
      
      .level-badge {
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 4px;
        margin-right: 8px;
        font-weight: bold;
        
        &.level-1 { background: #ecf5ff; color: #409EFF; }
        &.level-2 { background: #f0f9eb; color: #67C23A; }
        &.level-3 { background: #fdf6ec; color: #E6A23C; }
        &.level-4 { background: #f4f4f5; color: #909399; }
      }
      
      .zone-name {
        font-size: 14px;
        font-weight: bold;
        color: #303133;
      }
    }
  }
  
  .card-body {
    .data-row {
      display: flex;
      justify-content: space-between;
      
      .data-item {
        display: flex;
        flex-direction: column;
        
        .label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }
        
        .value {
          font-size: 13px;
          font-weight: bold;
          color: #303133;
          
          &.trend-up {
            color: #f56c6c;
          }
          
          &.trend-down {
            color: #67c23a;
          }
        }
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
      
      .placeholder-chart {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f0f2f5;
        color: #909399;
        border: 1px dashed #dcdfe6;
        border-radius: 4px;
      }
    }
    
    .value-highlight {
      font-weight: bold;
      color: #409EFF;
    }
  }
}
</style>
