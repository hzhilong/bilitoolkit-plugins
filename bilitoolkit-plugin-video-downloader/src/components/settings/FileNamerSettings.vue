<script setup lang="ts">
import { allFileNamerFields } from '@/constants/file-namer'
import type { OptionalFileNamerFields } from '@/types/file-namer'
import { storeToRefs } from 'pinia'
import { watch, reactive, computed, ref, onBeforeUpdate, onActivated } from 'vue'
import { debounce } from 'lodash-es'
import { useFileNamerSettingsStore } from '@/stores/file-namer-settings'
import dayjs from 'dayjs'
import { dateFormatMap, timeFormatMap, serialNumberFormatMap } from '@ybgnb/file-naming'
import type { DownloadResourceType } from 'bilitoolkit-types'
import { parseFullFileName } from '@/utils/file-namer'
import { fileNamingDataExample } from '@/constants/video-example'
import { VueDraggable } from 'vue-draggable-plus'

const fileNamerSettingsStore = useFileNamerSettingsStore()
const { reset } = fileNamerSettingsStore
const { settings } = storeToRefs(fileNamerSettingsStore)
const exampleDir = ref<string | null>(null)
const exampleList: {
  type: string
  fileName: string
}[] = reactive([])

const currFields = ref<
  Array<{
    id: string
    field: OptionalFileNamerFields
  }>
>([])

const initCurrFields = () => {
  currFields.value = settings.value.fields.map((field) => ({
    id: crypto.randomUUID(),
    field,
  }))
}

const resetDefault = () => {
  reset()
  initCurrFields()
}

onActivated(initCurrFields)

watch(
  () => currFields.value,
  (newValue) => {
    settings.value.fields = newValue.map((f) => f.field)
  },
  { deep: true },
)

const handleAddField = debounce((key: OptionalFileNamerFields) => {
  currFields.value.push({
    id: crypto.randomUUID(),
    field: key,
  })
}, 100)

const handleRemoveField = (index: number) => {
  currFields.value.splice(index, 1)
}

const updateExampleList = () => {
  const types: [DownloadResourceType, string][] = [
    ['audio', '音频'],
    ['video', '视频'],
    ['dm', '弹幕'],
    ['subtitle', '字幕'],
    ['cover', '封面'],
  ]
  const list = types.map(([type, name]) => ({
    type: name,
    fileName: parseFullFileName(fileNamingDataExample, type, settings.value),
  }))
  if (list[0].fileName.segments.length > 0) {
    exampleDir.value = list[0].fileName.segments.slice(0, -1).join('/')
  } else {
    exampleDir.value = null
  }
  exampleList.splice(
    0,
    exampleList.length,
    ...list.map(({ type, fileName }) => ({
      type: type,
      fileName: fileName.segments.at(-1) ?? '',
    })),
  )
}

watch(
  () => settings.value,
  () => {
    updateExampleList()
  },
  { immediate: true, deep: true },
)
const now = new Date()
const dateFormatExample = computed(() => dayjs(now).format(settings.value.extendedFormats.dateFormat))
const timeFormatExample = computed(() => dayjs(now).format(settings.value.extendedFormats.timeFormat))
const seqFormatExample = computed(() => {
  if (settings.value.extendedFormats.serialNumberFormat === 'natural') {
    return String(1)
  }
  return String(1).padStart(String(10).length, '0')
})
</script>

<template>
  <div class="file-namer-settings">
    <div class="form-item">
      <div class="label">
        <span>所有可选字段：</span>
        <span class="hint">(点击可追加)</span>
      </div>
      <div class="value-section fields">
        <div class="field" v-for="(item, key) in allFileNamerFields" :key="item.label" @click="handleAddField(key)">
          {{ item.label }}
        </div>
      </div>
    </div>
    <div class="form-item">
      <div class="label">
        <span>文件命名模板：</span>
        <span class="hint">(右键可移除)</span>
      </div>
      <div class="value-section fields">
        <VueDraggable v-model="currFields" :animation="200" class="field-list">
          <el-dropdown v-for="({ field, id }, index) in currFields" :key="id" trigger="contextmenu">
            <div class="field">{{ allFileNamerFields[field as OptionalFileNamerFields].label }}</div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click.stop="handleRemoveField(index)">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </VueDraggable>
      </div>
    </div>
    <div class="form-item example-list">
      <div class="label">文件命名示例：</div>
      <div class="value-section">
        <div class="item" v-if="exampleDir">
          <div class="type">文件夹</div>
          <div class="file-name">{{ exampleDir }}</div>
        </div>
        <div class="item" v-for="item in exampleList" :key="item.type">
          <div class="type">{{ item.type }}</div>
          <div class="file-name">{{ item.fileName }}</div>
        </div>
      </div>
    </div>
    <div class="form-item extended-formats">
      <div class="label">特殊字段格式：</div>
      <div class="value-section list">
        <div class="item">
          <div class="label">日期格式：</div>
          <ElSelect class="option" v-model="settings.extendedFormats.dateFormat">
            <ElOption v-for="(value, key) in dateFormatMap" :label="key" :value="key" :key="key"></ElOption>
          </ElSelect>
          <span class="example">示例：{{ dateFormatExample }}</span>
        </div>
        <div class="item">
          <div class="label">时间格式：</div>
          <ElSelect class="option" v-model="settings.extendedFormats.timeFormat">
            <ElOption v-for="(value, key) in timeFormatMap" :label="key" :value="key" :key="key"></ElOption>
          </ElSelect>
          <span class="example">示例：{{ timeFormatExample }}</span>
        </div>
        <div class="item">
          <div class="label">序号格式：</div>
          <ElSelect class="option" v-model="settings.extendedFormats.serialNumberFormat">
            <ElOption v-for="(value, key) in serialNumberFormatMap" :label="value" :value="key" :key="key"></ElOption>
          </ElSelect>
          <span class="example">示例：{{ seqFormatExample }}</span>
        </div>
      </div>
    </div>
    <ElButton @click="resetDefault">恢复默认</ElButton>
  </div>
</template>

<style scoped lang="scss">
@use 'bilitoolkit-ui/mixins.scss' as mixins;
.file-namer-settings {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  border: 1px solid var(--app-color-primary-transparent-20);
  border-radius: 10px;

  .form-item {
    display: flex;
    align-items: flex-start;
    gap: 20px;

    > .label {
      text-wrap: nowrap;
      display: flex;
      flex-direction: column;

      .hint {
        color: var(--el-text-color-secondary);
      }
    }

    > .value-section {
      flex: 1;
      min-width: 0;
      padding: 10px;
      border: 1px solid var(--app-color-primary-transparent-40);
      border-radius: 10px;

      &.fields {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;

        .field-list {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          user-select: none;
        }

        .field {
          font-size: 14px;
          line-height: 22px;
          padding: 0px 10px;
          text-wrap: nowrap;
          color: var(--el-color-primary);
          border: 1px solid var(--el-border-color-light);
          border-radius: 16px;
          cursor: move;

          &:hover {
            background-color: var(--app-color-primary-transparent-10);
          }
        }
      }
    }
  }

  .example-list {
    .value-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .item {
      display: flex;
      align-items: flex-end;
      border-bottom: 1px dashed var(--app-color-primary-transparent-20);

      .type {
        min-width: 60px;
      }
      .file-name {
        flex: 1;
        min-width: 0;
        padding: 1px 8px;
        background-color: var(--el-fill-color);
        word-break: break-all;
      }
    }
  }

  .extended-formats {
    .list {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;

      .item {
        display: flex;
        align-items: center;
        gap: 20px;
        text-wrap: nowrap;

        .label {
        }

        .option {
          width: 160px;
        }
      }
    }
  }
}
</style>
