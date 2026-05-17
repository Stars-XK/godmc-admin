import { ref } from 'vue'

/**
 * 相机拍照 + Canvas 压缩 composable
 *
 * @param {Object} options
 * @param {number} options.maxWidth - 最大宽度(px)，默认800
 * @param {number} options.quality - JPEG 质量(0-1)，默认0.75
 * @param {string} options.facing - 摄像头方向 'environment'(后置) / 'user'(前置)
 * @returns {{ stream, capture, compress, stop }}
 */
export function useCamera(options = {}) {
  const { maxWidth = 800, quality = 0.75, facing = 'environment' } = options

  const stream = ref(null)
  const error = ref(null)

  let mediaStream = null
  let videoEl = null

  async function init(videoElement) {
    videoEl = videoElement
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      stream.value = mediaStream
      videoEl.srcObject = mediaStream
      await videoEl.play()
      error.value = null
    } catch (e) {
      error.value = `相机启动失败: ${e.message}`
      // 回退：尝试任意摄像头
      if (facing === 'environment') {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          stream.value = mediaStream
          videoEl.srcObject = mediaStream
          await videoEl.play()
          error.value = null
        } catch (e2) {
          error.value = '无法访问摄像头'
        }
      }
    }
  }

  /** 拍照并返回压缩后的 dataURL */
  function capture() {
    if (!videoEl) return null
    const canvas = document.createElement('canvas')
    const vw = videoEl.videoWidth || 640
    const vh = videoEl.videoHeight || 480
    const scale = Math.min(1, maxWidth / vw)
    canvas.width = Math.round(vw * scale)
    canvas.height = Math.round(vh * scale)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', quality)
  }

  /** 压缩已有的图片 File/Blob，返回 Promise<Blob> */
  function compress(file, opts = {}) {
    const { maxW = maxWidth, q = quality } = opts
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, maxW / img.width)
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', q)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  function stop() {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop())
      mediaStream = null
    }
    stream.value = null
  }

  return { stream, error, init, capture, compress, stop }
}
