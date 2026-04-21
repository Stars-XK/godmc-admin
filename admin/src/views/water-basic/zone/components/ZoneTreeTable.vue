<template>
  <el-table
    v-loading="loading"
    :data="data"
    row-key="id"
    :default-expand-all="isExpandAll"
    :expand-row-keys="expandRowKeys"
    :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
  >
    <el-table-column prop="name" label="分区名称" min-width="260" show-overflow-tooltip></el-table-column>
    <el-table-column prop="code" label="分区编码" width="150"></el-table-column>
    <el-table-column prop="area" label="面积(k㎡)" width="120"></el-table-column>
    <el-table-column prop="population" label="服务人口" width="120"></el-table-column>
    <el-table-column prop="managerName" label="负责人" width="120"></el-table-column>
    <el-table-column prop="status" label="状态" width="100">
      <template #default="scope">
        <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
      </template>
    </el-table-column>
    <el-table-column prop="createTime" label="创建时间" align="center" width="180">
      <template #default="scope">
        <span>{{ parseTime(scope.row.createTime) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width">
      <template #default="scope">
        <el-button link type="primary" icon="Edit" @click="$emit('edit', scope.row)" v-hasPermi="['water-basic:zone:edit']">修改</el-button>
        <el-button link type="primary" icon="Plus" @click="$emit('add', scope.row)" v-hasPermi="['water-basic:zone:add']">新增</el-button>
        <el-button link type="danger" icon="Delete" @click="$emit('delete', scope.row)" v-hasPermi="['water-basic:zone:remove']">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  isExpandAll: {
    type: Boolean,
    default: true
  },
  expandRowKeys: {
    type: Array,
    default: () => []
  }
});

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict("sys_normal_disable");

defineEmits(['add', 'edit', 'delete']);
</script>
