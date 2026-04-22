<template>
  <div class="app-container">
    <el-card shadow="never">
      <template #header>
        <div class="clearfix">
          <span>模拟产生设备数据</span>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="12" :xs="24">
          <el-form ref="mockRef" :model="form" :rules="rules" label-width="120px">
            <el-form-item label="设备编码" prop="deviceCode">
              <el-input v-model="form.deviceCode" placeholder="请输入要模拟的设备编码" />
            </el-form-item>
            <el-form-item label="指标(测点)编码" prop="pointCode">
              <el-input v-model="form.pointCode" placeholder="请输入要模拟的指标编码" />
            </el-form-item>
            <el-form-item label="数据类型" prop="mockType">
              <el-radio-group v-model="form.mockType">
                <el-radio label="random">瞬时随机 (波动数据)</el-radio>
                <el-radio label="cumulative">累计递增 (表盘码值)</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item :label="form.mockType === 'random' ? '数值范围 (Min)' : '递增步长 (Min)'" prop="min">
              <el-input-number v-model="form.min" :min="0" :max="10000" style="width: 100%" />
            </el-form-item>
            <el-form-item :label="form.mockType === 'random' ? '数值范围 (Max)' : '递增步长 (Max)'" prop="max">
              <el-input-number v-model="form.max" :min="0" :max="10000" style="width: 100%" />
            </el-form-item>
            <el-form-item label="初始基数" prop="baseValue" v-if="form.mockType === 'cumulative'">
              <el-input-number v-model="form.baseValue" :min="0" style="width: 100%" />
              <div class="el-upload__tip">若TDengine中已有该测点数据，将自动从最新值开始累加，此基数仅作为首次生成的起点。</div>
            </el-form-item>
            <el-form-item label="单次生成条数" prop="count">
              <el-input-number v-model="form.count" :min="1" :max="10000" style="width: 100%" :disabled="isAuto" />
              <div class="el-upload__tip">生成数据会直接写入TDengine时序数据库的超级表中。</div>
            </el-form-item>
            <el-form-item label="历史时间跨度" prop="timeRange">
              <el-select v-model="form.timeRange" style="width: 100%" :disabled="isAuto">
                <el-option label="实时生成 (仅当前时间)" value="realtime" />
                <el-option label="过去 1 小时内分布" value="1h" />
                <el-option label="过去 1 天内分布" value="1d" />
                <el-option label="过去 7 天内分布" value="7d" />
                <el-option label="过去 30 天内分布" value="30d" />
              </el-select>
              <div class="el-upload__tip">将生成的条数均匀/随机分布在选定的历史时间跨度内（从当前时间往前推）。开启自动定时生成时无效。</div>
            </el-form-item>
            <el-form-item label="自动定时生成">
              <el-switch v-model="isAuto" active-text="开启" inactive-text="关闭" />
              <span v-if="isAuto" style="margin-left: 15px;">
                频率(秒): <el-input-number v-model="autoInterval" :min="1" :max="60" style="width: 100px" />
              </span>
            </el-form-item>
            <el-form-item>
              <el-button v-if="!isAuto" type="primary" :loading="loading" @click="submitMockData">开始生成</el-button>
              <el-button v-else type="success" :loading="loading" @click="toggleAutoMock">
                {{ autoTimer ? '停止定时生成' : '启动定时生成' }}
              </el-button>
              <el-button @click="resetForm" :disabled="autoTimer !== null">重置表单</el-button>
            </el-form-item>
          </el-form>
        </el-col>
        
        <el-col :span="12" :xs="24">
          <el-card shadow="hover" header="生成结果控制台" class="console-card">
            <el-scrollbar height="600px">
              <div v-if="results.length > 0">
                <div v-for="(item, index) in results" :key="index" class="mock-result-item">
                  [ {{ item.timestamp }} ] Device: <strong>{{ item.deviceCode }}</strong>, Point: <strong>{{ item.pointCode }}</strong>, Value: <span style="color: #409EFF">{{ item.value.toFixed(2) }}</span>
                </div>
              </div>
              <el-empty v-else description="暂无生成记录" />
            </el-scrollbar>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup name="DataMock">
import { ref, reactive } from 'vue';
import { generateMockData } from '@/api/data-integration/receiver';
import { ElMessage } from 'element-plus';

const mockRef = ref(null);
const loading = ref(false);
const results = ref([]);

const isAuto = ref(false);
const autoInterval = ref(5);
const autoTimer = ref(null);

const data = reactive({
  form: {
    deviceCode: '',
    pointCode: '',
    mockType: 'random',
    baseValue: 0,
    min: 0,
    max: 100,
    count: 10,
    timeRange: 'realtime'
  },
  rules: {
    deviceCode: [{ required: true, message: '设备编码不能为空', trigger: 'blur' }],
    pointCode: [{ required: true, message: '指标编码不能为空', trigger: 'blur' }],
    min: [{ required: true, message: '最小值/步长不能为空', trigger: 'blur' }],
    max: [{ required: true, message: '最大值/步长不能为空', trigger: 'blur' }],
    count: [{ required: true, message: '生成条数不能为空', trigger: 'blur' }]
  }
});

const { form, rules } = data;

function submitMockData() {
  mockRef.value.validate(valid => {
    if (valid) {
      if (form.min > form.max) {
        ElMessage.error('最小值不能大于最大值');
        return;
      }
      loading.value = true;
      generateMockData(form).then(response => {
        loading.value = false;
        if (!isAuto.value) {
          ElMessage.success('生成成功');
        }
        // 将新数据追加到列表顶部，最多保留 100 条显示
        results.value = [...(response.data || []), ...results.value].slice(0, 100);
      }).catch(() => {
        loading.value = false;
        if (isAuto.value) {
          stopAutoMock(); // 发生错误自动停止
        }
      });
    }
  });
}

function toggleAutoMock() {
  if (autoTimer.value) {
    stopAutoMock();
  } else {
    mockRef.value.validate(valid => {
      if (valid) {
        if (form.min > form.max) {
          ElMessage.error('最小值不能大于最大值');
          return;
        }
        form.count = 1; // 自动模式下每次只生成 1 条
        ElMessage.success(`已启动定时生成，每 ${autoInterval.value} 秒生成一次`);
        submitMockData(); // 先执行一次
        autoTimer.value = setInterval(() => {
          submitMockData();
        }, autoInterval.value * 1000);
      }
    });
  }
}

function stopAutoMock() {
  if (autoTimer.value) {
    clearInterval(autoTimer.value);
    autoTimer.value = null;
    ElMessage.info('已停止定时生成');
  }
}

import { onBeforeUnmount } from 'vue';
onBeforeUnmount(() => {
  stopAutoMock();
});

function resetForm() {
  if (mockRef.value) {
    mockRef.value.resetFields();
  }
  results.value = [];
}
</script>

<style scoped>
.mock-result-item {
  padding: 8px 10px;
  border-bottom: 1px solid #ebeef5;
  font-family: monospace;
  font-size: 13px;
  color: #606266;
}
.mock-result-item:last-child {
  border-bottom: none;
}
.console-card :deep(.el-card__body) {
  padding: 0;
}
</style>
