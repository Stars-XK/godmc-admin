<template>
  <el-dialog :title="title" v-model="open" width="600px" append-to-body>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-row>
        <el-col :span="24" v-if="form.parentId !== 0">
          <el-form-item label="上级分区" prop="parentId">
            <el-tree-select
              v-model="form.parentId"
              :data="treeData"
              :props="{ value: 'code', label: 'name', children: 'children' }"
              value-key="code"
              placeholder="选择上级分区"
              check-strictly
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分区名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入分区名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分区编码" prop="code">
            <el-input v-model="form.code" placeholder="请输入分区编码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="覆盖面积" prop="area">
            <el-input-number v-model="form.area" :min="0" :precision="2" controls-position="right" placeholder="面积(平方公里)" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="服务人口" prop="population">
            <el-input-number v-model="form.population" :min="0" controls-position="right" placeholder="服务人口数" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="负责人" prop="managerName">
            <el-input v-model="form.managerName" placeholder="请输入负责人姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系电话" prop="managerPhone">
            <el-input v-model="form.managerPhone" placeholder="请输入联系电话" maxlength="11" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="位置描述" prop="address">
            <el-input v-model="form.address" placeholder="请输入位置描述" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="显示排序" prop="sort">
            <el-input-number v-model="form.sort" controls-position="right" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分区状态" prop="status">
            <el-radio-group v-model="form.status">
              <el-radio
                v-for="dict in sys_normal_disable"
                :key="dict.value"
                :label="dict.value"
              >{{ dict.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { addZone, updateZone, getZone } from '@/api/water-basic/zone'

const props = defineProps({
  treeData: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['success']);

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict("sys_normal_disable");

const open = ref(false);
const title = ref("");
const formRef = ref(null);

const data = reactive({
  form: {},
  rules: {
    name: [{ required: true, message: "分区名称不能为空", trigger: "blur" }],
    sort: [{ required: true, message: "显示排序不能为空", trigger: "blur" }]
  }
});

const { form, rules } = toRefs(data);

function reset() {
  form.value = {
    id: undefined,
    parentId: 0,
    name: undefined,
    code: undefined,
    area: 0,
    population: 0,
    managerName: undefined,
    managerPhone: undefined,
    address: undefined,
    sort: 0,
    status: "0"
  };
  proxy.resetForm("formRef");
}

function cancel() {
  open.value = false;
  reset();
}

function openDialog(parentId, id) {
  reset();
  if (id != null) {
    title.value = "修改分区";
    getZone(id).then(response => {
      form.value = response.data;
      open.value = true;
    });
  } else {
    title.value = "添加分区";
    form.value.parentId = parentId || 0;
    open.value = true;
  }
}

function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateZone(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          emit('success');
        });
      } else {
        addZone(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          emit('success');
        });
      }
    }
  });
}

defineExpose({
  open: openDialog
});
</script>
