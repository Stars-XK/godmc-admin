<template>
  <div class="mobile-checkpoint-form">
    <div class="m-header">
      <span class="back-btn" @click="$router.back()"><el-icon><ArrowLeft /></el-icon></span>
      <span class="m-title">{{ checkpoint.checkpointName || '检查点' }}</span>
      <el-tag size="small" :type="allFilled ? 'success' : 'info'">{{ allFilled ? '已完成' : '进行中' }}</el-tag>
    </div>

    <div class="form-scroll">
      <div class="cp-header" v-if="checkpoint.address">
        <el-icon><Location /></el-icon>
        <span>{{ checkpoint.address || `${checkpoint.lng}, ${checkpoint.lat}` }}</span>
      </div>

      <!-- 检查项表单 -->
      <div v-for="(item, i) in items" :key="item.id" class="item-card">
        <div class="item-header">
          <span class="item-name">{{ item.itemName }}</span>
          <el-tag v-if="item.isRequired === '1'" size="small" type="danger">必填</el-tag>
          <el-tag v-if="item.requirePhoto === '1'" size="small" type="warning">需拍照</el-tag>
        </div>

        <!-- normal: 正常/异常/跳过 -->
        <div v-if="item.itemType === 'normal'" class="item-input">
          <el-radio-group v-model="formData[item.id].result" size="large">
            <el-radio-button value="normal">正常</el-radio-button>
            <el-radio-button value="abnormal">异常</el-radio-button>
            <el-radio-button value="skipped">跳过</el-radio-button>
          </el-radio-group>
        </div>

        <!-- threshold: 数值输入 -->
        <div v-else-if="item.itemType === 'threshold'" class="item-input">
          <el-input-number
            v-model="formData[item.id].value"
            :min="item.thresholdMin || 0"
            :max="item.thresholdMax || 9999"
            :step="0.1"
            controls-position="right"
            size="large"
            class="num-input"
          />
          <span class="unit-hint" v-if="item.unit">{{ item.unit }}</span>
          <el-radio-group v-model="formData[item.id].result" size="large" class="result-group">
            <el-radio-button value="normal">正常</el-radio-button>
            <el-radio-button value="abnormal">异常</el-radio-button>
          </el-radio-group>
        </div>

        <!-- select: 选项 -->
        <div v-else-if="item.itemType === 'select'" class="item-input">
          <el-select v-model="formData[item.id].value" placeholder="请选择" size="large" style="width:100%">
            <el-option
              v-for="opt in (item.selectOptions || [])"
              :key="opt"
              :label="opt"
              :value="opt"
            />
          </el-select>
        </div>

        <!-- photo: 拍照 -->
        <div v-else-if="item.itemType === 'photo'" class="item-input">
          <div v-if="formData[item.id].photos?.length" class="photo-preview-list">
            <div v-for="(photo, pi) in formData[item.id].photos" :key="pi" class="photo-preview">
              <img :src="photo" />
              <span class="photo-del" @click="formData[item.id].photos.splice(pi, 1)">×</span>
            </div>
          </div>
          <el-button size="large" @click="takePhoto(item)" class="camera-btn">
            <el-icon><Camera /></el-icon> {{ formData[item.id].photos?.length ? '重拍' : '拍照' }}
          </el-button>
        </div>

        <!-- measurement / signature: 文本 -->
        <div v-else class="item-input">
          <el-input
            v-model="formData[item.id].value"
            :type="item.itemType === 'signature' ? 'textarea' : 'text'"
            :placeholder="item.itemType === 'signature' ? '请签名' : '请输入测量值'"
            :rows="2"
            size="large"
          />
        </div>

        <!-- 异常描述 -->
        <div v-if="formData[item.id].result === 'abnormal'" class="abnormal-desc">
          <el-input
            v-model="formData[item.id].abnormalDesc"
            type="textarea"
            placeholder="请描述异常情况"
            :rows="2"
            size="large"
          />
        </div>

        <!-- 需要拍照的检查项 -->
        <div v-if="item.requirePhoto === '1' && item.itemType !== 'photo'" class="photo-extra">
          <div v-if="formData[item.id].photos?.length" class="photo-preview-list">
            <div v-for="(photo, pi) in formData[item.id].photos" :key="pi" class="photo-preview">
              <img :src="photo" />
              <span class="photo-del" @click="formData[item.id].photos.splice(pi, 1)">×</span>
            </div>
          </div>
          <el-button size="small" @click="takePhoto(item)">
            <el-icon><Camera /></el-icon> 拍照
          </el-button>
        </div>
      </div>

      <!-- 保存 -->
      <div class="save-bar">
        <el-button type="primary" size="large" round class="save-btn" @click="saveForm">
          保存（{{ filledCount }}/{{ items.length }}）
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Camera, Location } from '@element-plus/icons-vue'
import { getCheckpoint, listCheckItem } from '@/api/inspection/checkpoint'
import { submitRecord } from '@/api/inspection/record'
import { saveRecordToQueue } from '@/hooks/useOfflineSync'

const route = useRoute()
const router = useRouter()
const checkpoint = ref({})
const items = ref([])
const formData = reactive({})

const filledCount = computed(() => items.value.filter(i => formData[i.id]?.result).length)
const allFilled = computed(() => items.value.every(i => {
  if (i.isRequired !== '1') return true
  return !!formData[i.id]?.result
}))

function initFormData() {
  items.value.forEach(item => {
    formData[item.id] = {
      result: null,
      value: null,
      abnormalDesc: '',
      photos: [],
    }
  })
}

async function loadCheckpoint() {
  const cpId = route.params.checkpointId
  try {
    const res = await getCheckpoint(cpId)
    checkpoint.value = res.data || {}
    const itemsRes = await listCheckItem(cpId)
    items.value = itemsRes.data || []
    initFormData()
  } catch (e) {
    console.error('加载检查点失败', e)
  }
}

function takePhoto(item) {
  const taskId = route.query.taskId
  router.push(`/inspection/mobile/camera?taskId=${taskId}&itemId=${item.id}&cpId=${checkpoint.value.id}`)
  // 照片通过 camera 页面捕获后返回，或直接从 camera 页面保存到 formData
  // 简化流程: 直接在 camera 页面完成后回到此页面
}

async function saveForm() {
  const taskId = route.query.taskId
  const records = items.value
    .filter(i => formData[i.id]?.result)
    .map(i => ({
      taskId: Number(taskId),
      checkpointId: checkpoint.value.id,
      checkItemId: i.id,
      checkResult: formData[i.id].result,
      itemValue: String(formData[i.id].value || ''),
      abnormalDesc: formData[i.id].abnormalDesc || '',
      photoUrls: formData[i.id].photos || [],
      lng: '',
      lat: '',
    }))

  if (!records.length) {
    return
  }

  try {
    for (const record of records) {
      await submitRecord(record)
    }
    router.back()
  } catch (e) {
    // 离线：保存到队列
    for (const record of records) {
      await saveRecordToQueue(record)
    }
    router.back()
  }
}

onMounted(loadCheckpoint)
</script>

<style scoped>
.mobile-checkpoint-form {
  display: flex;
  flex-direction: column;
  height: 100vh; height: 100dvh;
  background: #f5f5f5;
}
.m-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #0D9488, #0F766E);
  color: #fff;
  flex-shrink: 0;
}
.back-btn { cursor: pointer; display: flex; }
.m-title { flex: 1; font-size: 17px; font-weight: 600; }

.form-scroll { flex: 1; overflow-y: auto; padding: 12px; }
.cp-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 10px;
  font-size: 13px;
  color: #6b7280;
}

.item-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}
.item-name { font-size: 14px; font-weight: 600; color: #1f2937; flex: 1; }
.item-input { margin-top: 4px; }
.num-input { width: 100%; }
.unit-hint { display: inline-block; margin: 6px 0; font-size: 12px; color: #9ca3af; }
.result-group { display: flex; margin-top: 8px; }

.camera-btn { width: 100%; }
.photo-preview-list { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.photo-preview {
  position: relative;
  width: 80px; height: 80px;
  border-radius: 8px;
  overflow: hidden;
}
.photo-preview img { width: 100%; height: 100%; object-fit: cover; }
.photo-del {
  position: absolute; top: 2px; right: 2px;
  width: 20px; height: 20px;
  background: rgba(0,0,0,.6);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
}
.photo-extra { margin-top: 10px; }

.abnormal-desc { margin-top: 8px; }

.save-bar {
  padding: 16px;
  display: flex;
  justify-content: center;
}
.save-btn { width: 100%; max-width: 320px; }
</style>

<style>
html.dark-mode .mobile-checkpoint-form { background: #0F172A !important; }
html.dark-mode .cp-header { background: #1E293B !important; color: #94A3B8 !important; }
html.dark-mode .item-card { background: #1E293B !important; }
html.dark-mode .item-name { color: #E2E8F0 !important; }
</style>
