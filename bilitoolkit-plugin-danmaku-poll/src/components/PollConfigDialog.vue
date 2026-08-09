<template>
  <div class="poll-config-dialog">
    <el-dialog
      v-model="visible"
      :title="isEditMode ? '编辑投票配置' : '创建投票配置'"
      align-center
      :close-on-click-modal="false"
      destroy-on-close
      @closed="handleClosed"
    >
      <div class="dialog-content">
        <el-form
          class="config-form"
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="100px"
          label-position="right"
          hide-required-asterisk
        >
          <el-form-item label="投票标题" prop="title" style="width: 100%">
            <el-input v-model="formData.title" placeholder="请输入投票标题" maxlength="20" clearable />
          </el-form-item>

          <el-form-item label="投票选项" prop="options" required>
            <div class="options-container">
              <div v-for="(item, index) in formData.options" :key="index" class="option-item">
                <span class="option-index">{{ index + 1 }}</span>
                <el-input class="option-label" v-model="item.label" placeholder="选项名称" maxlength="16" clearable />
                <el-color-picker
                  v-model="item.color"
                  :predefine="presetColors"
                  show-alpha
                  size="default"
                  class="option-color-picker"
                />
                <el-button
                  type="danger"
                  :icon="Delete"
                  circle
                  size="small"
                  :disabled="formData.options.length <= 1"
                  @click="removeOption(index)"
                />
              </div>

              <div class="options-footer">
                <el-button
                  link
                  type="primary"
                  size="small"
                  :icon="Plus"
                  :disabled="formData.options.length >= 9"
                  @click="addOption"
                >
                  添加选项
                </el-button>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="持续时间" prop="durationSeconds" style="padding-top: 6px">
            <el-select v-model="formData.durationSeconds" style="width: 80px">
              <el-option label="30 秒" :value="30"></el-option>
              <el-option label="40 秒" :value="40"></el-option>
              <el-option label="50 秒" :value="50"></el-option>
              <el-option v-for="n in 10" :key="n" :label="`${n} 分`" :value="60 * n" />
              <el-option label="20 分" :value="60 * 20"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
        <div class="preview" v-if="previewPollResult">
          <span>预览：</span><PollResultViewer :result="previewPollResult"></PollResultViewer>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEditMode ? '确认修改' : '确认创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
import type { PollConfig, PollOption, PollResult } from '@/types'
import { showWarning, showToast, showError } from 'bilitoolkit-ui'

const props = defineProps<{
  initialData?: PollConfig | null
}>()

const emit = defineEmits<{
  submit: [data: PollConfig]
}>()

const presetColors = [
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#9B59B6',
  '#1ABC9C',
  '#E74C3C',
  '#ff3fa1',
  '#2ECC71',
  '#b72323',
  '#8E44AD',
  '#909399',
]

const formRef = ref<FormInstance>()
const submitting = ref(false)

const getDefaultFormData = (): PollConfig => ({
  title: '',
  options: [{ label: '', color: presetColors[0] }],
  durationSeconds: 60,
})

const cloneInitialData = (data?: PollConfig | null): PollConfig | null => {
  if (!data) return null
  return {
    title: data.title,
    options: data.options.map((opt) => ({
      label: opt.label,
      color: opt.color,
    })),
    durationSeconds: data.durationSeconds,
  }
}

// 表单数据
const formData = ref<PollConfig>(getDefaultFormData())

// 是否为编辑模式
const isEditMode = computed(() => !!props.initialData)

const visible = defineModel<boolean>({ required: true })

// ==================== 表单验证规则 ====================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validateOptions = (_rule: any, value: PollOption[], callback: (error?: Error) => void) => {
  if (!value || value.length < 1) {
    callback(new Error('至少需要 1 个投票选项'))
    return
  }

  // 检查是否有空标签
  const emptyIndex = value.findIndex((item) => item.label.trim() === '')
  if (emptyIndex !== -1) {
    callback(new Error(`选项 ${emptyIndex + 1} 名称不能为空`))
    return
  }

  // 检查是否有重复标签
  const labels = value.map((item) => item.label.trim().toLowerCase())
  const duplicateIndex = labels.findIndex((label, idx) => labels.indexOf(label) !== idx)
  if (duplicateIndex !== -1) {
    callback(new Error(`选项 "${value[duplicateIndex].label}" 已存在，请勿重复`))
    return
  }

  callback()
}

const formRules: FormRules = {
  title: [
    { required: true, message: '请输入投票标题', trigger: 'change' },
    { min: 2, max: 20, message: '标题长度应在 2 到 20 个字符之间', trigger: 'change' },
  ],
  options: [{ validator: validateOptions, trigger: 'change' }],
  durationSeconds: [
    { required: true, message: '请设置持续时间', trigger: 'change' },
    { type: 'number', min: 30, max: 1200, message: '持续时间应在 30 到 1200 秒之间', trigger: 'change' },
  ],
}

const previewPollResult = ref<PollResult>()

const initFormData = () => {
  previewPollResult.value = undefined
  const initial = cloneInitialData(props.initialData)
  if (initial) {
    Object.assign(formData.value, initial)
  } else {
    const defaultData = getDefaultFormData()
    Object.assign(formData.value, defaultData)
  }
}

const addOption = () => {
  if (formData.value.options.length >= 9) {
    showWarning('最多只能添加 9 个选项')
    return
  }
  const nextColor = presetColors[formData.value.options.length % presetColors.length]
  formData.value.options.push({
    label: '',
    color: nextColor,
  })
}

const removeOption = (index: number) => {
  if (formData.value.options.length <= 1) {
    showError('至少需要 1 个选项')
    return
  }
  formData.value.options.splice(index, 1)
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    const submitData: PollConfig = {
      title: formData.value.title.trim(),
      options: formData.value.options.map((opt) => ({
        label: opt.label.trim(),
        color: opt.color,
      })),
      durationSeconds: formData.value.durationSeconds,
    }

    emit('submit', submitData)

    visible.value = false
    showToast(isEditMode.value ? '投票配置已更新' : '投票配置已创建')
  } catch {
    const firstError = document.querySelector('.el-form-item.is-error')
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  } finally {
    submitting.value = false
  }
}

const handleClosed = () => {
  initFormData()
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

watch(
  () => visible.value,
  () => {
    if (visible.value) {
      initFormData()
      nextTick(() => {
        formRef.value?.clearValidate()
      })
    }
  },
  { immediate: true },
)

watch(
  formData.value,
  (newVal) => {
    if (newVal.title && newVal.options.length > 0) {
      const { options, durationSeconds } = newVal
      const now = Math.floor(Date.now() / 1000)
      previewPollResult.value = {
        status: 'active',
        startTime: now,
        endTime: now + durationSeconds,
        config: newVal,
        totalVotes: options.reduce(
          (previousValue, currentValue, currentIndex) => previousValue + (currentIndex + 1) * 10,
          0,
        ),
        optionResults: options.map((value, index) => {
          return {
            option: value,
            count: (index + 1) * 10,
          }
        }),
      }
    } else {
      previewPollResult.value = undefined
    }
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.poll-config-dialog {
  display: contents;

  ::v-deep(> .el-modal-dialog > .el-overlay-dialog > .el-dialog) {
    max-width: 96vw;
    width: fit-content;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    .el-dialog__body {
      flex: 1;
      overflow-y: auto;
    }
  }
}
.dialog-content {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-left: 1px solid var(--el-border-color-lighter);
  padding-left: 10px;
}

.config-form {
  width: 480px;
}

.options-container {
  width: 100%;
  margin-bottom: 4px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  background-color: var(--el-fill-color-light);
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--el-fill-color);
  }

  .option-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    background-color: var(--el-bg-color);
    border-radius: 50%;
    border: 1px solid var(--el-border-color-light);
    user-select: none;
  }

  .option-label {
    flex: 3;
    min-width: 0;
  }

  .option-color-picker {
    flex-shrink: 0;
  }

  :deep(.el-button) {
    flex-shrink: 0;
  }
}

.options-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  padding: 0 4px;
}

.options-tip {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.options-tip .el-tag {
  margin-left: 6px;
}

.duration-unit {
  margin-left: 8px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.duration-hint {
  margin-left: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
