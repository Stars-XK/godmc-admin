<template>
  <el-dialog :title="title" v-model="open" width="500px" append-to-body>
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item label="上级分区" prop="parentId">
        <el-tree-select
          v-model="form.parentId"
          :data="treeData"
          :props="{ value: 'code', label: 'name', children: 'children' }"
          value-key="code"
          placeholder="选择导入到哪个上级分区下(不选则作为顶级)"
          check-strictly
          clearable
          style="width: 100%"
        />
      </el-form-item>
      
      <el-form-item label="数据文件" prop="file">
        <el-upload
          ref="uploadRef"
          :limit="1"
          accept=".xlsx, .xls"
          :headers="upload.headers"
          :action="upload.url"
          :data="{ parentId: form.parentId }"
          :disabled="upload.isUploading"
          :on-progress="handleFileUploadProgress"
          :on-success="handleFileSuccess"
          :on-error="handleFileError"
          :auto-upload="false"
          drag
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip text-center">
              <span>仅允许导入xls、xlsx格式文件。</span>
              <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importTemplate">下载模板</el-link>
            </div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitFileForm">确 定</el-button>
        <el-button @click="open = false">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { getToken } from "@/utils/auth"

const props = defineProps({
  treeData: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['success']);
const { proxy } = getCurrentInstance();

const open = ref(false);
const title = ref("分区数据导入");
const uploadRef = ref(null);

const form = reactive({
  parentId: undefined
});

const upload = reactive({
  isUploading: false,
  headers: { Authorization: "Bearer " + getToken() },
  url: import.meta.env.VITE_APP_BASE_API + "/water-basic/zone/importData"
});

function openDialog() {
  open.value = true;
  form.parentId = undefined;
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
}

/** 下载模板操作 */
function importTemplate() {
  proxy.download("/water-basic/zone/importTemplate", {}, `zone_template_${new Date().getTime()}.xlsx`);
}

/** 文件上传中处理 */
const handleFileUploadProgress = (event, file, fileList) => {
  upload.isUploading = true;
};

/** 文件上传成功处理 */
const handleFileSuccess = (response, file, fileList) => {
  upload.isUploading = false;
  uploadRef.value.clearFiles();
  open.value = false;
  if (response.code === 200) {
    proxy.$modal.msgSuccess("导入成功");
    emit('success');
  } else {
    proxy.$modal.msgError(response.msg || "导入失败");
  }
};

/** 文件上传失败处理 */
const handleFileError = () => {
  upload.isUploading = false;
  proxy.$modal.msgError("导入失败，请检查网络或服务是否正常");
};

/** 提交上传文件 */
function submitFileForm() {
  uploadRef.value.submit();
}

defineExpose({
  open: openDialog
});
</script>
