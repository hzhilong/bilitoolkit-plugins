<script setup lang="ts">
import { ref, useTemplateRef, onUnmounted } from 'vue'
import {
  PluginPageContent,
  useSelectedUserStore,
  LogPrint,
  QueryFormItem,
  useSelectData,
  showError,
} from 'bilitoolkit-ui'
import { storeToRefs } from 'pinia'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import type { DynamicType } from '@ybgnb/bili-api'
import { DynamicTypeMap } from '@ybgnb/bili-api'
import { inArray, getErrorMessage } from '@ybgnb/utils'
import { deleteFilterDynamics } from '@/utils/dynamic'

const userStore = useSelectedUserStore()
const { assertLoggedIn } = userStore
const { user } = storeToRefs(userStore)
const loggerRef = useTemplateRef<InstanceType<typeof LogPrint>>('loggerRef')

const dynamicTypeOptions: DynamicType[] = [DynamicTypeMap.DYNAMIC_TYPE_WORD.type, DynamicTypeMap.DYNAMIC_TYPE_DRAW.type]
const { selectedIds: selectedTypes } = useSelectData(dynamicTypeOptions, (type: DynamicType) => type, [
  DynamicTypeMap.DYNAMIC_TYPE_WORD.type,
  DynamicTypeMap.DYNAMIC_TYPE_DRAW.type,
])

const keyword = ref<string>()
const isDeleting = ref(false)
let abortController: AbortController | null = null

const addLog = (msg: string) => {
  loggerRef.value?.addLog(msg)
}

const handleDelete = async () => {
  if (isDeleting.value) {
    abortController?.abort()
    isDeleting.value = false
    return
  }
  try {
    assertLoggedIn()

    if (selectedTypes.value.length == 0) {
      showError('请选择要查询的动态类型')
      return
    }
    isDeleting.value = true
    abortController = new AbortController()

    await deleteFilterDynamics(
      {
        client: publicClient,
        addLog: addLog,
        signal: abortController.signal,
        currUid: user.value!.mid!,
      },
      (dynamic) => {
        if (!inArray(dynamic.type, selectedTypes.value)) return false

        const opus = dynamic.modules.module_dynamic.major?.opus
        if (!opus) return false

        const {
          title,
          summary: { text },
        } = opus
        const keywordText = keyword.value?.trim() ?? ''

        return keywordText.length === 0 || text.includes(keywordText) || (!!title && title.includes(keywordText))
      },
      (dynamic) => {
        const {
          title,
          summary: { text },
        } = dynamic.modules.module_dynamic.major!.opus!
        if (title) {
          return `[${title}] ${text}`
        }
        return text
      },
      500,
    )
  } catch (e) {
    addLog(getErrorMessage(e))
  } finally {
    abortController?.abort()
    isDeleting.value = false
  }
}
onUnmounted(() => abortController?.abort())
</script>

<template>
  <PluginPageContent>
    <div class="page-content">
      <div class="actions">
        <QueryFormItem prefix="动态类型" style="width: fit-content">
          <el-checkbox-group v-model="selectedTypes" style="width: 242px; padding-left: 14px">
            <el-checkbox
              v-for="type in dynamicTypeOptions"
              :key="type"
              :label="DynamicTypeMap[type as DynamicType].description"
              :value="type"
            />
          </el-checkbox-group>
        </QueryFormItem>
        <QueryFormItem prefix="动态关键词">
          <el-input v-model.trim="keyword" placeholder="可为空" clearable style="width: 120px"> </el-input>
        </QueryFormItem>
        <el-button type="primary" @click="handleDelete">{{ isDeleting ? '停止操作' : '查询所有动态' }}</el-button>
      </div>
      <el-alert description="请注意，发布的部分纯文字动态也会被B站认定为图文动态"></el-alert>
      <LogPrint ref="loggerRef" class="log-print-box"></LogPrint>
    </div>
  </PluginPageContent>
</template>

<style scoped lang="scss">
.page-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 10px;

  .actions {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .log-print-box {
    width: 100%;
    flex: 1;
    min-height: 0;
  }
}
</style>
