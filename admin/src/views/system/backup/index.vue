<template>
  <div class="app-container">
    <el-card shadow="never" class="mb-4">
      <div class="header-container">
        <div class="header-title">
          <el-icon class="header-icon"><Coin /></el-icon>
          <span>数据库备份与恢复</span>
        </div>
        <div class="header-actions">
          <el-button
            type="primary"
            icon="Download"
            @click="handleBackup"
            v-hasPermi="['system:backup:create']"
            :loading="isBackingUp"
          >立即备份</el-button>
          <el-button icon="Refresh" @click="getList">刷新列表</el-button>
        </div>
      </div>
      
      <div class="tip-box">
        <el-icon><InfoFilled /></el-icon>
        <span>系统默认每天凌晨 02:00 自动进行数据库备份，最多保留最近的 7 份备份记录。您也可以在此处手动创建备份或将数据回滚至历史版本。</span>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="backupList" border style="width: 100%" class="custom-table">
        <el-table-column label="序号" type="index" width="80" align="center" />
        <el-table-column label="备份文件名称" align="center" prop="filename" show-overflow-tooltip>
          <template #default="scope">
            <span style="font-weight: 500; color: #303133;">{{ scope.row.filename }}</span>
          </template>
        </el-table-column>
        <el-table-column label="文件大小" align="center" prop="size" width="150">
          <template #default="scope">
            <el-tag type="info" effect="plain">{{ scope.row.size }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备份时间" align="center" prop="createTime" width="200" />
        <el-table-column label="操作" align="center" width="250" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button
              link
              type="warning"
              icon="RefreshLeft"
              @click="handleRestore(scope.row)"
              v-hasPermi="['system:backup:restore']"
            >数据恢复</el-button>
            <el-button
              link
              type="danger"
              icon="Delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['system:backup:remove']"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { listBackups, createBackup, restoreBackup, delBackup } from '@/api/system/backup';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import { Coin, InfoFilled, Download, Refresh, RefreshLeft, Delete } from '@element-plus/icons-vue';

const loading = ref(true);
const isBackingUp = ref(false);
const backupList = ref([]);

/** 查询备份列表 */
function getList() {
  loading.value = true;
  listBackups().then(response => {
    backupList.value = response.data || [];
    loading.value = false;
  }).catch(() => {
    loading.value = false;
  });
}

/** 立即备份操作 */
function handleBackup() {
  ElMessageBox.confirm('是否确认立即执行数据库备份操作？这可能需要几十秒的时间。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    isBackingUp.value = true;
    return createBackup();
  }).then(() => {
    ElMessage.success('备份成功');
    getList();
  }).finally(() => {
    isBackingUp.value = false;
  });
}

/** 恢复操作 */
function handleRestore(row) {
  ElMessageBox.confirm(
    `警告：此操作将使用备份文件 "${row.filename}" 覆盖当前数据库中的所有数据，覆盖后无法撤销！建议您在恢复前先进行一次手动备份。是否确认继续？`,
    '危险操作',
    {
      confirmButtonText: '我已了解风险，确认恢复',
      cancelButtonText: '取消',
      type: 'error',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(() => {
    const loadingInstance = ElLoading.service({
      lock: true,
      text: '数据库恢复中，请勿刷新页面...',
      background: 'rgba(0, 0, 0, 0.7)'
    });
    restoreBackup(row.filename).then(() => {
      loadingInstance.close();
      ElMessage.success('数据库恢复成功！请重新登录系统。');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }).catch(() => {
      loadingInstance.close();
    });
  }).catch(() => {});
}

/** 删除操作 */
function handleDelete(row) {
  ElMessageBox.confirm('是否确认删除该备份文件？删除后无法找回。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    return delBackup(row.filename);
  }).then(() => {
    ElMessage.success('删除成功');
    getList();
  }).catch(() => {});
}

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.mb-4 {
  margin-bottom: 20px;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;

  .header-title {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: #1f2f3d;

    .header-icon {
      margin-right: 8px;
      font-size: 20px;
      color: #409eff;
    }
  }
}

.tip-box {
  display: flex;
  align-items: center;
  background-color: #fdf6ec;
  padding: 10px 15px;
  border-radius: 4px;
  color: #e6a23c;
  font-size: 13px;

  .el-icon {
    margin-right: 8px;
    font-size: 16px;
  }
}

.custom-table {
  :deep(th.el-table__cell) {
    background-color: #f5f7fa !important;
    color: #606266;
    font-weight: 600;
  }
}
</style>