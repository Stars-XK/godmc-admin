<template>
  <div class="rule-builder">
    <el-card shadow="never" class="condition-group">
      <div class="group-header">
        <el-radio-group v-model="localOperator" size="small" @change="emitChange">
          <el-radio-button label="all">且 (AND)</el-radio-button>
          <el-radio-button label="any">或 (OR)</el-radio-button>
        </el-radio-group>
        <div class="actions">
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
              <el-input v-model="item.fact" placeholder="事实(fact)" size="small" @change="emitChange"></el-input>
              <el-select v-model="item.operator" placeholder="操作符" size="small" @change="emitChange">
                <el-option label="等于(equal)" value="equal"></el-option>
                <el-option label="不等于(notEqual)" value="notEqual"></el-option>
                <el-option label="大于(greaterThan)" value="greaterThan"></el-option>
                <el-option label="大于等于(greaterThanInclusive)" value="greaterThanInclusive"></el-option>
                <el-option label="小于(lessThan)" value="lessThan"></el-option>
                <el-option label="小于等于(lessThanInclusive)" value="lessThanInclusive"></el-option>
                <el-option label="包含(in)" value="in"></el-option>
                <el-option label="不包含(notIn)" value="notIn"></el-option>
              </el-select>
              <el-input v-model="item.value" placeholder="比较值(value)" size="small" @change="emitChange"></el-input>
              <el-button type="danger" link icon="Delete" @click="removeCondition(index)"></el-button>
            </div>
          </template>
        </div>
      </div>
    </el-card>
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
.basic-condition .el-select {
  flex: 1;
}
</style>
