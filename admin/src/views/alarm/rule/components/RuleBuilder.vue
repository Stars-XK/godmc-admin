<template>
  <div class="rule-builder">
    <el-card shadow="never" class="condition-group">
      <div class="group-header">
        <el-radio-group v-model="localOperator" size="small" @change="emitChange">
          <el-radio-button label="all">且 (AND)</el-radio-button>
          <el-radio-button label="any">或 (OR)</el-radio-button>
        </el-radio-group>
        <div class="actions">
          <el-button type="info" link icon="Document" @click="showDictionary = true">变量字典</el-button>
          <el-button type="primary" link icon="Plus" @click="addCondition">添加条件</el-button>
          <el-button type="success" link icon="Plus" @click="addGroup">添加条件组</el-button>
          <el-button v-if="isSubGroup" type="danger" link icon="Delete" @click="$emit('remove')">删除此组</el-button>
        </div>
      </div>
      
      <div class="condition-list">
        <div v-for="(item, index) in localConditions" :key="index" class="condition-item">
          <!-- 递归渲染子条件组 -->
          <template v-if="item.all || item.any">
            <RuleBuilder 
              :modelValue="item" 
              :isSubGroup="true"
              @update:modelValue="val => updateChildGroup(index, val)"
              @remove="removeCondition(index)"
            />
          </template>
          
          <!-- 渲染基础条件 -->
          <template v-else>
            <div class="basic-condition">
              <el-autocomplete
                v-model="item.fact"
                :fetch-suggestions="querySearch"
                placeholder="请选择或输入变量"
                size="small"
                @select="emitChange"
                @change="emitChange"
                clearable
              >
                <template #default="{ item }">
                  <div class="fact-option">
                    <span>{{ item.value }}</span>
                    <span class="fact-desc">{{ item.desc }}</span>
                  </div>
                </template>
              </el-autocomplete>

              <el-select v-model="item.operator" placeholder="操作符" size="small" @change="emitChange">
                <el-option label="等于" value="equal"></el-option>
                <el-option label="不等于" value="notEqual"></el-option>
                <el-option label="大于" value="greaterThan"></el-option>
                <el-option label="大于等于" value="greaterThanInclusive"></el-option>
                <el-option label="小于" value="lessThan"></el-option>
                <el-option label="小于等于" value="lessThanInclusive"></el-option>
                <el-option label="包含" value="in"></el-option>
                <el-option label="不包含" value="notIn"></el-option>
              </el-select>
              
              <el-input v-model="item.value" placeholder="请输入比较值" size="small" @change="emitChange" clearable></el-input>
              <el-button type="danger" link icon="Delete" @click="removeCondition(index)"></el-button>
            </div>
          </template>
        </div>
      </div>
    </el-card>

    <!-- 变量字典抽屉 (组件每次被实例化都会包含，但用 append-to-body 可以避免样式问题) -->
    <el-drawer v-model="showDictionary" title="变量字典" size="400px" append-to-body>
      <el-table :data="factOptions" style="width: 100%" border size="small">
        <el-table-column prop="value" label="变量名" width="120" />
        <el-table-column prop="desc" label="说明" />
      </el-table>
      <div class="dictionary-tips">
        <el-alert title="提示" type="info" :closable="false" description="您可以在条件配置中直接输入这些变量名，或者通过下拉提示选择。" show-icon />
      </div>
    </el-drawer>
  </div>
</template>

<script>
export default {
  name: 'RuleBuilder'
}
</script>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ all: [] })
  },
  isSubGroup: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'remove']);

const localOperator = ref('all');
const localConditions = ref([]);
const showDictionary = ref(false);

const factOptions = [
  { value: 'device', desc: '设备 (Device)' },
  { value: 'dma', desc: '分区 (DMA)' },
  { value: 'sys', desc: '系统 (System)' }
];

const querySearch = (queryString, cb) => {
  const results = queryString
    ? factOptions.filter(item => item.value.toLowerCase().includes(queryString.toLowerCase()))
    : factOptions;
  cb(results);
};

// 初始化解析
const initFromProps = () => {
  if (props.modelValue && props.modelValue.any) {
    localOperator.value = 'any';
    localConditions.value = JSON.parse(JSON.stringify(props.modelValue.any));
  } else if (props.modelValue && props.modelValue.all) {
    localOperator.value = 'all';
    localConditions.value = JSON.parse(JSON.stringify(props.modelValue.all));
  } else {
    localOperator.value = 'all';
    localConditions.value = [];
  }
};

watch(() => props.modelValue, initFromProps, { deep: true, immediate: true });

const emitChange = () => {
  const result = {
    [localOperator.value]: localConditions.value
  };
  emit('update:modelValue', result);
};

const addCondition = () => {
  localConditions.value.push({ fact: '', operator: 'equal', value: '' });
  emitChange();
};

const addGroup = () => {
  localConditions.value.push({ all: [] });
  emitChange();
};

const removeCondition = (index) => {
  localConditions.value.splice(index, 1);
  emitChange();
};

const updateChildGroup = (index, val) => {
  localConditions.value[index] = val;
  emitChange();
};
</script>

<style scoped>
.rule-builder {
  width: 100%;
}
.condition-group {
  margin-bottom: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #ebeef5;
}
.actions {
  display: flex;
  gap: 8px;
}
.condition-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.condition-item {
  position: relative;
}
.basic-condition {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #fff;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
.basic-condition .el-input,
.basic-condition .el-select,
.basic-condition .el-autocomplete {
  flex: 1;
}
.fact-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.fact-desc {
  color: #909399;
  font-size: 12px;
}
.dictionary-tips {
  margin-top: 20px;
}
</style>
