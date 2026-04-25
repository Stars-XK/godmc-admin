<template>
  <el-dialog :title="title" v-model="visible" width="550px" class="premium-dialog" append-to-body destroy-on-close>
    <el-form ref="configRef" :model="form" :rules="rules" label-width="90px" class="premium-form" label-position="top">
      <el-row :gutter="24">
        <el-col :span="24">
          <el-form-item label="参数名称" prop="configName">
            <el-input v-model="form.configName" placeholder="例如：用户默认密码" size="large" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="参数键名" prop="configKey">
            <el-input v-model="form.configKey" placeholder="例如：sys.user.initPassword" size="large" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="参数键值" prop="configValue">
            <el-input v-model="form.configValue" placeholder="请输入实际的配置数值" size="large" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item prop="configType">
            <template #label>
              <span class="label-with-tip">
                系统内置属性
                <el-tooltip effect="light" content="设置为'是'时，该配置项将被锁定，禁止被业务人员删除" placement="top">
                  <el-icon class="ml-1"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
            </template>
            <el-radio-group v-model="form.configType" class="custom-radio-group">
              <el-radio-button v-for="dict in sys_yes_no" :key="dict.value" :label="dict.value">
                {{ dict.label }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注说明" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="提供该参数的用途说明..." resize="none" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false" size="large">取 消</el-button>
        <el-button type="primary" @click="submitForm">保存配置</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  form: {
    type: Object,
    required: true
  },
  rules: {
    type: Object,
    required: true
  },
  sys_yes_no: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const configRef = ref(null)

const visible = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
  }
})

function submitForm() {
  if (!configRef.value) return
  configRef.value.validate((valid) => {
    if (valid) {
      emit('submit', props.form)
    }
  })
}
</script>

<style lang="scss" scoped>


.premium-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  
  :deep(.el-dialog__header) {
    padding: 24px 32px;
    border-bottom: 1px solid #e5e7eb;
    margin-right: 0;
    
    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }
  }
  
  :deep(.el-dialog__body) {
    padding: 32px;
  }
  
  :deep(.el-dialog__footer) {
    padding: 24px 32px;
    border-top: 1px solid #e5e7eb;
    background-color: #f9fafb;
  }
}

.premium-form {
  .el-form-item__label {
    font-weight: 500;
    color: #374151;
    padding-bottom: 8px;
    font-size: 14px;
  }
  
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 8px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px #d1d5db inset !important;
    transition: all 0.2s;
    
    &:hover {
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px #9ca3af inset !important;
    }
    
    &.is-focus, &:focus {
      box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
    }
  }
  
  .label-with-tip {
    display: flex;
    align-items: center;
  }
  
  .custom-radio-group {
    width: 100%;
    display: flex;
    gap: 12px;
    
    :deep(.el-radio-button) {
      flex: 1;
      .el-radio-button__inner {
        width: 100%;
        border-radius: 8px !important;
        border: 1px solid #d1d5db !important;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
        font-weight: 500;
        color: #374151;
        transition: all 0.2s;
      }
      
      &.is-active .el-radio-button__inner {
        background-color: #111827;
        border-color: #111827 !important;
        color: #ffffff;
      }
      
      &:not(.is-active):hover .el-radio-button__inner {
        background-color: #f9fafb;
      }
    }
  }
}

.dialog-footer {
  padding-top: 10px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  .el-button {
    border-radius: 8px;
    padding: 12px 24px;
    font-weight: 500;
    height: 40px;
  }
}
</style>
