<template>
  <el-dialog v-model="visible" title="新增分组（小节）" width="400px">
    <el-form :model="formData" label-width="120px">
      <el-form-item label="标题" required>
        <el-input v-model="formData.title" placeholder="请输入标题" maxlength="8" show-word-limit />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { showError } from 'bilitoolkit-ui'

const visible = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  (e: 'add', title: string): void
}>()

const formData = reactive<{ title: string }>({
  title: '',
})

watch(
  visible,
  async (newVal) => {
    if (newVal) {
      formData.title = ''
    }
  },
  { immediate: true },
)

const handleSubmit = () => {
  if (formData.title.trim().length === 0) {
    return showError('请输入标题')
  }
  emit('add', formData.title)
  visible.value = false
}
</script>
