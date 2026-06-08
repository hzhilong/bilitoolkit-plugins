<script setup lang="ts">
import { LogPrint, toolkitApi, PluginPageContent, useLoadingData } from 'bilitoolkit-ui'
import { useTemplateRef, ref, onUnmounted } from 'vue'
import type { FileHandle } from 'bilitoolkit-types'
const logRef = useTemplateRef<typeof LogPrint>('logRef')
const appendLog = (msg: string) => logRef.value?.addLog(msg)
let fileHandle: FileHandle | null = null
const filePath = 'test/test.data'
const isOpened = ref(false)
const { loading, loadingData } = useLoadingData()
const handleOpen = loadingData(async () => {
  fileHandle = await toolkitApi.file.open(filePath)
  isOpened.value = true
  appendLog(`已打开文件 ${filePath}`)
  updateFileStat()
})
const fileStat = ref<string>()
let statTimer: ReturnType<typeof setInterval> | null = null
const updateFileStat = () => {
  statTimer = setInterval(async () => {
    if (fileHandle) {
      fileStat.value = '文件信息：' + JSON.stringify(await fileHandle.stat())
    }
  }, 1000)
}
const clearStatTimer = () => {
  if (statTimer) clearTimeout(statTimer)
  statTimer = null
}
onUnmounted(() => {
  clearStatTimer()
})
let writeCount = 0
const handleWrite = loadingData(async () => {
  const content = `hello ${writeCount}`
  fileHandle?.write(new TextEncoder().encode(content))
  writeCount++
  appendLog(`已写入内容：[${content}]`)
})

const handleFlush = loadingData(async () => {
  await fileHandle?.flush()
  appendLog(`flush 成功`)
})
const handleSeek = loadingData(async () => {
  await fileHandle?.seek(0)
  appendLog(`seek 成功`)
})
const handleRead = loadingData(async () => {
  if (!fileHandle) return
  let readCount = 0
  const chunks: Uint8Array[] = []

  while (true) {
    readCount++
    const result = await fileHandle.read()
    if (result.data && result.data.length) {
      chunks.push(result.data)
    }
    if (result.eof) {
      break
    }
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const data = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    data.set(chunk, offset)
    offset += chunk.length
  }
  const text = new TextDecoder('utf-8').decode(data)
  appendLog(`已读取${readCount}次，完整内容：${text}`)
})
</script>

<template>
  <plugin-page-content>
    <div class="actions" v-loading="loading">
      <el-button v-if="!fileHandle" @click="handleOpen">open</el-button>
      <template v-else>
        <el-button @click="handleWrite">write</el-button>
        <el-button @click="handleFlush">flush</el-button>
        <el-button @click="handleSeek">seek 0</el-button>
        <el-button @click="handleRead">read</el-button>
      </template>
    </div>
    <div>{{ fileStat }}</div>
    <log-print ref="logRef" class="log-print-box"></log-print>
  </plugin-page-content>
</template>

<style scoped lang="scss">
.log-print-box {
  flex: 1;
}
</style>
