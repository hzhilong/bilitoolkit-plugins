<script setup lang="ts">
import { PluginPageContent, useSelectedUserStore, showToast } from 'bilitoolkit-ui'
import { ref, useTemplateRef } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'
import { storeToRefs } from 'pinia'
import { publicClient } from 'bilitoolkit-runtime/biliapi'

const selectedUserStore = useSelectedUserStore()
const { assertLoggedIn } = selectedUserStore
const { user } = storeToRefs(selectedUserStore)
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cropperRef = useTemplateRef<any>('cropperRef')

const imageUrl = ref<string | null>(null)
const previews = ref<{
  url: string
  container: Record<string, string>
  div: Record<string, string>
  img: Record<string, string>
}>({
  url: '',
  container: {},
  div: {},
  img: {},
})

const triggerUpload = () => fileInputRef.value?.click()

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    imageUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
  input.value = ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const realTime = (data: any) => {
  previews.value = {
    ...data,
    container: {
      width: `${data.w}px`,
      height: `${data.h}px`,
      transform: `scale(${200 / data.w})`,
      transformOrigin: 'left top',
    },
  }
}

const handleConfirm = async () => {
  if (!cropperRef.value) return
  assertLoggedIn()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cropperRef.value.getCropBlob(async (data: any) => {
    const client = publicClient
    const formData = new FormData()

    formData.append('dopost', 'save')
    formData.append('DisplayRank', '10000')
    formData.append('face', data)

    const newFace = await client.api.post<string>('http://api.bilibili.com/x/member/web/face/update', {
      query: { csrf: user.value!.userCookie.bili_jct },
      data: formData,
    })
    user.value!.face = newFace
    console.log('rep', newFace)
    showToast('更新成功（网页端可看到效果）')
  })
}
</script>

<template>
  <plugin-page-content class="page-content">
    <div class="image-cropper">
      <div v-if="!imageUrl" class="upload-area" @click="triggerUpload">
        <el-icon :size="40"><Plus /></el-icon>
        <span>点击上传图片</span>
        <input ref="fileInputRef" type="file" accept="image/*" style="display: none" @change="handleFileChange" />
      </div>

      <div v-else class="cropper-wrapper">
        <div class="cropper-container">
          <VueCropper
            ref="cropperRef"
            :img="imageUrl"
            :outputSize="1"
            :outputType="'png'"
            :fixed="true"
            :fixedNumber="[1, 1]"
            :autoCrop="true"
            :autoCropWidth="200"
            :autoCropHeight="200"
            :centerBox="true"
            :canMove="true"
            :canMoveBox="true"
            :original="false"
            @realTime="realTime"
            style="width: 100%; height: 100%"
          />
        </div>

        <div v-if="previews.url" class="preview-wrapper">
          <div :style="previews.container">
            <div :style="previews.div">
              <img :src="previews.url" :style="previews.img" />
            </div>
          </div>
        </div>
      </div>

      <div v-if="imageUrl" class="actions">
        <el-button @click="imageUrl = null">重新上传</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </div>
  </plugin-page-content>
</template>

<style scoped lang="scss">
.page-content {
  display: flex;
  align-items: center;
  justify-content: center;

  .image-cropper {
    .upload-area {
      width: 200px;
      height: 200px;
      border: 2px dashed var(--el-border-color);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      color: var(--el-text-color-secondary);
      transition: border-color 0.2s;

      &:hover {
        border-color: var(--el-color-primary);
      }

      .el-icon {
        margin-bottom: 8px;
      }

      span {
        font-size: 14px;
      }
    }

    .cropper-wrapper {
      display: flex;
      gap: 40px;

      .cropper-container {
        width: 200px;
        height: 200px;
        overflow: hidden;
      }

      .preview-wrapper {
        width: 200px;
        height: 200px;
        overflow: hidden;
        border-radius: 50%;
        padding: 2px;
        border: 1px solid var(--el-border-color);
        background-color: #ffffff;
        background-image:
          linear-gradient(45deg, #cccccc 25%, transparent 25%), linear-gradient(-45deg, #cccccc 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #cccccc 75%), linear-gradient(-45deg, transparent 75%, #cccccc 75%);
        background-size: 20px 20px;
        background-position:
          0 0,
          0 10px,
          10px -10px,
          -10px 0px;
      }
    }

    .actions {
      margin-top: 16px;
      text-align: center;
    }
  }
}
</style>
