<template>
  <!-- 添加或修改数据字典项配置 -->
  <el-dialog :title="form.title" v-model="dialogTableVisible" width="650px" top="5vh" append-to-body class="sys-dialog" destroy-on-close>
    <div class="dialog-scroll">
    <el-form ref="formRef" :model="form.model" :rules="form.rules" label-width="100px">
      <div class="form-card">
        <div class="card-header">
          <span class="card-dot"></span>
          <el-icon class="card-icon"><Document /></el-icon>
          <span class="card-title">基本信息</span>
        </div>
        <div class="card-body">
          <el-form-item label="字典名称" prop="dictName">
            <el-input v-model="form.model.dictName" placeholder="请输入字典名称" />
          </el-form-item>
          <el-form-item label="字典类型" prop="dictType">
            <el-input v-model="form.model.dictType" placeholder="请输入字典类型" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="form.model.status">
              <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.value">{{ dict.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.model.remark" type="textarea" placeholder="请输入内容"></el-input>
          </el-form-item>
        </div>
      </div>
    </el-form>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="form.cancel">取 消</el-button>
        <el-button type="warning" @click="form.reset">重置</el-button>
        <el-button :loading="form.loading" type="primary" @click="form.submit">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { addType, updateType } from '@/api/system/dict/type'
import { Document } from '@element-plus/icons-vue'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const dialogTableVisible = ref(false)
const formRef = ref()
const emit = defineEmits(['refresh'])

const form = reactive({
  loading: false,
  title: '',
  model: {
    dictName: '',
    dictType: null,
    status: '0',
    remark: ''
  },
  rules: {
    dictName: [{ required: true, message: '字典名称不能为空', trigger: 'blur' }],
    dictType: [{ required: true, message: '字典类型不能为空', trigger: 'blur' }]
  },
  reset: () => {
    form.loading = false
    nextTick(() => {
      proxy.resetForm('formRef')
    })
  },
  submit: () => {
    formRef.value.validate((valid) => {
      if (valid) {
        form.loading = true
        if (form.model.dictId != undefined) {
          updateType(form.model).then(() => {
            proxy.$modal.msgSuccess('修改成功')
            form.reset()
            dialogTableVisible.value = false
            emit('refresh')
          })
        } else {
          addType(form.model).then(() => {
            proxy.$modal.msgSuccess('新增成功')
            form.reset()
            dialogTableVisible.value = false
            emit('refresh')
          })
        }
      }
    })
  },
  cancel: () => {
    form.reset()
    dialogTableVisible.value = false
  }
})

const handleDialogOpen = (type, row) => {
  form.title = type === 'add' ? '新增字典类型' : '修改字典类型'
  dialogTableVisible.value = true
  if (type === 'edit') {
    form.model = { ...row }
  } else {
    nextTick(() => {
      form.reset()
    })
  }
}

defineExpose({
  handleDialogOpen
})
</script>

<style scoped>
:deep(.sys-dialog .el-dialog__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #ecf5ff 100%);
  border-bottom: 1px solid #e4e7ed;
  padding: 16px 24px;
  margin: 0;
}
:deep(.sys-dialog .el-dialog__title) {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.3px;
}
:deep(.sys-dialog .el-dialog__body) {
  padding: 0;
  background: #f8fafc;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(90vh - 110px);
}
:deep(.sys-dialog .el-dialog__footer) {
  padding: 12px 24px;
  border-top: 1px solid #f0f2f5;
  background: #fff;
}

.dialog-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 24px;
}
.dialog-scroll::-webkit-scrollbar { width: 5px; }
.dialog-scroll::-webkit-scrollbar-thumb { background: #c0c4cc; border-radius: 3px; }
.dialog-scroll::-webkit-scrollbar-track { background: transparent; }

.form-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
  transition: box-shadow 0.2s;
}
.form-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,.06); }

.card-header {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #f0f2f5;
  gap: 10px;
}
.card-dot { width: 8px; height: 8px; border-radius: 50%; background: #409eff; flex-shrink: 0; }
.card-dot.dot-purple { background: #8b5cf6; }

.card-icon { font-size: 16px; color: #64748b; }
.card-title { font-size: 14px; font-weight: 600; color: #334155; }
.card-body { padding: 18px 20px; }
</style>
