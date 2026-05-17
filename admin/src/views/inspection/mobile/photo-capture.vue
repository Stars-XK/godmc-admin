<template>
  <div class="mobile-camera">
    <!-- 相机区域 -->
    <div class="camera-view">
      <video ref="videoRef" autoplay playsinline class="camera-video"></video>
      <div v-if="!stream" class="camera-placeholder">
        <el-icon :size="48" color="#9ca3af"><Camera /></el-icon>
        <p>正在启动相机...</p>
      </div>
      <div v-if="cameraError" class="camera-error">
        <p>{{ cameraError }}</p>
        <el-button size="small" @click="initCamera">重试</el-button>
      </div>
    </div>

    <!-- 已拍照片预览 -->
    <div class="captured-preview" v-if="capturedPhoto">
      <img :src="capturedPhoto" />
    </div>

    <!-- 拍照按钮 -->
    <div class="camera-controls">
      <el-button size="large" circle class="capture-btn" @click="takePhoto" :disabled="!stream">
        <span class="btn-inner"></span>
      </el-button>
    </div>

    <!-- 操作 -->
    <div class="camera-actions" v-if="capturedPhoto">
      <el-button size="large" @click="retake">重拍</el-button>
      <el-button size="large" type="primary" @click="confirmPhoto">确认使用</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Camera } from '@element-plus/icons-vue'
import { useCamera } from '@/hooks/useCamera'

const route = useRoute()
const router = useRouter()
const { stream, error: cameraError, init, capture, stop } = useCamera({ maxWidth: 800, quality: 0.75 })

const videoRef = ref(null)
const capturedPhoto = ref(null)

async function initCamera() {
  if (videoRef.value) {
    await init(videoRef.value)
  }
}

function takePhoto() {
  const dataUrl = capture()
  if (dataUrl) {
    capturedPhoto.value = dataUrl
  }
}

function retake() {
  capturedPhoto.value = null
}

function confirmPhoto() {
  // 将照片 dataURL 传回上一页，存入 sessionStorage
  const taskId = route.query.taskId
  const itemId = route.query.itemId
  const cpId = route.query.cpId
  const key = `photo_${taskId}_${cpId}_${itemId}`
  const photos = JSON.parse(sessionStorage.getItem(key) || '[]')
  photos.push(capturedPhoto.value)
  sessionStorage.setItem(key, JSON.stringify(photos))
  router.back()
}

onMounted(initCamera)
onBeforeUnmount(stop)
</script>

<style scoped>
.mobile-camera {
  display: flex;
  flex-direction: column;
  height: 100vh; height: 100dvh;
  background: #000;
}

.camera-view {
  flex: 1;
  position: relative;
  overflow: hidden;
}
.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.camera-placeholder, .camera-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  background: #111;
}

.captured-preview {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  border: 2px solid #fff;
  overflow: hidden;
  z-index: 10;
}
.captured-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-controls {
  display: flex;
  justify-content: center;
  padding: 20px 0 30px;
  background: rgba(0,0,0,.8);
}
.capture-btn {
  width: 72px !important;
  height: 72px !important;
  border: 3px solid #fff !important;
  background: transparent !important;
}
.btn-inner {
  display: block;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fff;
}

.camera-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 12px 20px 30px;
  background: rgba(0,0,0,.8);
}
</style>
