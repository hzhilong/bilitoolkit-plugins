<template>
  <div class="edit-season-modal">
    <el-dialog
      v-model="visible"
      :title="mode === 'edit' ? '编辑合集' : '新增合集'"
      width="600px"
      style="max-height: 90vh"
      @close="handleClose"
      align-center
    >
      <el-form :model="formData" label-width="120px">
        <el-form-item label="合集标题" required>
          <el-input v-model="formData.title" placeholder="请输入标题" :maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item label="合集描述">
          <el-input
            v-model="formData.desc"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
            :maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="合集封面" required>
          <div class="cover-uploader" @click="triggerFileInput">
            <img v-if="formData.cover" :src="formData.cover" class="cover-preview" />
            <div v-else class="cover-placeholder">点击上传封面</div>
            <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleFileChange" />
          </div>
        </el-form-item>

        <template v-if="mode === 'edit'">
          <el-form-item label="空间防刷屏" style="margin-bottom: 4px">
            <el-radio-group v-model="formData.forbid">
              <el-radio :value="1">使用</el-radio>
              <el-radio :value="0">不使用</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="使用分组（小节）" style="margin-bottom: 4px">
            <el-radio-group v-model="formData.no_section">
              <el-radio :value="0">开启</el-radio>
              <el-radio :value="1">关闭</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>
      </el-form>
      <VueDraggable
        v-if="mode === 'edit'"
        v-model="newSections"
        :animation="200"
        target=".sort-target"
        class="section-list"
      >
        <table>
          <thead>
            <tr>
              <th>分组（小节）标题</th>
              <th>创建时间</th>
              <th>单集数量</th>
              <th>状态</th>
              <th>排序</th>
            </tr>
          </thead>
          <tbody class="sort-target">
            <tr v-for="item in newSections" :key="item.id" class="section-item">
              <td>{{ item.title }}</td>
              <td>{{ formatTime(item.ctime) }}</td>
              <td>{{ item.epCount }}</td>
              <td>{{ item.state === 0 ? '正常显示' : `审核未通过:${item.rejectReason}` }}</td>
              <td>
                <el-icon><Operation /></el-icon>
              </td>
            </tr>
          </tbody>
        </table>
      </VueDraggable>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { BiliClient } from '@ybgnb/bili-api'
import { showError } from 'bilitoolkit-ui'
import type { UpdateSeason, AddSeason, MySeasonItem, MySeasonSection } from '@/types'
import { getErrorMessage, formatTime } from '@ybgnb/utils'
import { omit, cloneDeep } from 'lodash-es'
import { Operation } from '@element-plus/icons-vue'
import { VueDraggable } from 'vue-draggable-plus'

const props = defineProps<{
  mode: 'edit' | 'add'
  season?: MySeasonItem
  client?: BiliClient
}>()
const visible = defineModel<boolean>({ required: true })
const newSections = ref<MySeasonSection[]>([])

const emit = defineEmits<{
  (e: 'update', data: UpdateSeason, sections: MySeasonSection[]): void
  (e: 'add', data: AddSeason): void
}>()

const formData = reactive<UpdateSeason>({
  title: '',
  desc: '',
  cover: '',
  no_section: 1,
  forbid: 0,
})

watch(
  visible,
  async (newVal) => {
    if (newVal && props.season) {
      if (props.client == null) {
        visible.value = false
        showError('内部错误，请重新获取数据')
      } else {
        if (props.mode === 'edit') {
          Object.assign(formData, props.season.season, newVal)
          newSections.value = cloneDeep(props.season.sections.sections)
        } else {
          Object.assign(formData, {
            title: '',
            desc: '',
            cover: '',
            no_section: 1,
            forbid: 0,
          })
        }
      }
    } else if (!newVal) {
      newSections.value = []
    }
  },
  { immediate: true },
)

const fileInput = ref<HTMLInputElement>()

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (ev) => {
    const base64 = ev.target?.result as string
    try {
      const { url } = await props.client!.upload.uploadCover(base64)
      formData.cover = url
    } catch (e) {
      showError(`上传封面失败：${getErrorMessage(e)}`)
    }
  }
  reader.readAsDataURL(file)

  target.value = ''
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleSubmit = async () => {
  if (formData.title.trim().length === 0) {
    return showError('请输入标题')
  }
  if (formData.cover.trim().length === 0) {
    return showError('请上传封面')
  }
  await props.client!.myArchive.filterTitle(formData.title)
  if (props.mode === 'edit') {
    emit('update', formData, newSections.value ?? [])
  } else {
    emit('add', omit(formData, 'no_section', 'forbid'))
  }
  visible.value = false
}

const handleClose = () => {}
</script>

<style scoped lang="scss">
.edit-season-modal {
  display: contents;

  ::v-deep(> .el-modal-dialog > .el-overlay-dialog > .el-dialog) {
    overflow: hidden;
    display: flex;

    flex-direction: column;
    .el-dialog__body {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  }

  .section-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-right: 8px;
    display: flex;
    flex-direction: column;

    .section-item {
      user-select: none;
      cursor: move;
    }
  }
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  text-align: left;
  th,
  td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  th {
    background-color: var(--el-fill-color-light);
    font-weight: 600;
  }

  tr:hover {
    background-color: var(--el-fill-color-light);
  }

  tr:nth-child(even) {
    background-color: var(--el-fill-color-lighter);
  }
}

.cover-uploader {
  width: 160px;
  height: 90px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fafafa;
}
.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-placeholder {
  color: #999;
  font-size: 14px;
}
</style>
