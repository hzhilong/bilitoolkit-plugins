<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { toolkitApi, showError, showToast } from 'bilitoolkit-ui'
import { getErrorMessage } from '@ybgnb/utils'
import type { WatermarkPreset } from '@/types/media.js'
import type {
  ToolkitMediaApi,
  VideoMediaFile,
  VideoPreview,
  VideoWatermarkMaskMode,
  WatermarkRegion,
  VideoWatermarkJob,
} from 'bilitoolkit-types'

const mediaApi = (toolkitApi as unknown as { media?: ToolkitMediaApi }).media
const requireMediaApi = () => {
  if (!mediaApi) throw new Error('当前哔哩工具姬版本不支持视频处理，请先更新主程序')
  return mediaApi
}
const PRESET_STORAGE_KEY = 'bilitoolkit-video-watermark-presets-v1'
const selectedFiles = ref<VideoMediaFile[]>([])
const activeFilePath = ref('')
const preview = ref<VideoPreview>()
const previewLoading = ref(false)
const selectLoading = ref(false)
const submitLoading = ref(false)
const previewSecond = ref(1)
const keepOriginal = ref(true)
const crf = ref(18)
const encodePreset = ref<'ultrafast' | 'fast' | 'medium' | 'slow'>('medium')
const maskMode = ref<VideoWatermarkMaskMode>('light-text')
const textThreshold = ref(185)
const maskExpansion = ref(2)
const region = ref<WatermarkRegion>({ x: 0.75, y: 0.04, width: 0.2, height: 0.1 })
const presetName = ref('')
const jobs = ref<VideoWatermarkJob[]>([])
const imageRef = ref<HTMLImageElement>()
const drawing = ref(false)
const drawStart = ref({ x: 0, y: 0 })
let pollTimer: ReturnType<typeof setInterval> | undefined

const loadPresets = (): WatermarkPreset[] => {
  try {
    return JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY) || '[]') as WatermarkPreset[]
  } catch {
    return []
  }
}
const presets = ref(loadPresets())
const savePresets = () => localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets.value))
const activeFile = computed(() => selectedFiles.value.find((file) => file.path === activeFilePath.value))
const overlayStyle = computed(() => ({
  left: `${region.value.x * 100}%`,
  top: `${region.value.y * 100}%`,
  width: `${region.value.width * 100}%`,
  height: `${region.value.height * 100}%`,
}))
const regionDescription = computed(() => {
  if (!preview.value) return '尚未生成预览'
  const x = Math.round(region.value.x * preview.value.width)
  const y = Math.round(region.value.y * preview.value.height)
  const width = Math.round(region.value.width * preview.value.width)
  const height = Math.round(region.value.height * preview.value.height)
  return `原视频区域：X ${x}，Y ${y}，宽 ${width}，高 ${height}`
})
const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`

const selectFiles = async () => {
  selectLoading.value = true
  try {
    const files = await requireMediaApi().selectVideoFiles()
    const existing = new Set(selectedFiles.value.map((file) => file.path))
    selectedFiles.value.push(...files.filter((file) => !existing.has(file.path)))
    if (!activeFilePath.value && selectedFiles.value[0]) {
      activeFilePath.value = selectedFiles.value[0].path
      await loadPreview()
    }
  } catch (error) {
    showError(getErrorMessage(error))
  } finally {
    selectLoading.value = false
  }
}
const loadPreview = async () => {
  if (!activeFilePath.value) return
  previewLoading.value = true
  try {
    preview.value = await requireMediaApi().getVideoPreview(activeFilePath.value, previewSecond.value)
  } catch (error) {
    showError(getErrorMessage(error))
  } finally {
    previewLoading.value = false
  }
}
const setActiveFile = async (file: VideoMediaFile) => {
  activeFilePath.value = file.path
  await loadPreview()
}
const removeFile = (file: VideoMediaFile) => {
  selectedFiles.value = selectedFiles.value.filter((item) => item.path !== file.path)
  if (activeFilePath.value === file.path) {
    activeFilePath.value = selectedFiles.value[0]?.path ?? ''
    preview.value = undefined
    if (activeFilePath.value) void loadPreview()
  }
}
const pointerRatio = (event: PointerEvent) => {
  const rect = imageRef.value!.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
  }
}
const startDrawing = (event: PointerEvent) => {
  if (!imageRef.value) return
  drawing.value = true
  drawStart.value = pointerRatio(event)
  region.value = { ...drawStart.value, width: 0, height: 0 }
  imageRef.value.setPointerCapture(event.pointerId)
}
const updateDrawing = (event: PointerEvent) => {
  if (!drawing.value || !imageRef.value) return
  const current = pointerRatio(event)
  region.value = {
    x: Math.min(drawStart.value.x, current.x),
    y: Math.min(drawStart.value.y, current.y),
    width: Math.abs(current.x - drawStart.value.x),
    height: Math.abs(current.y - drawStart.value.y),
  }
}
const stopDrawing = (event: PointerEvent) => {
  if (!drawing.value) return
  updateDrawing(event)
  drawing.value = false
  imageRef.value?.releasePointerCapture(event.pointerId)
}
const addPreset = () => {
  const name = presetName.value.trim()
  if (!name) return showError('请输入预设名称')
  if (region.value.width < 0.001 || region.value.height < 0.001) return showError('请先框选水印区域')
  presets.value.push({ id: crypto.randomUUID(), name, region: { ...region.value } })
  presetName.value = ''
  savePresets()
  showToast('预设已保存')
}
const applyPreset = (preset: WatermarkPreset) => {
  region.value = { ...preset.region }
}
const removePreset = (id: string) => {
  presets.value = presets.value.filter((preset) => preset.id !== id)
  savePresets()
}
const refreshJobs = async () => {
  if (!jobs.value.length) return
  try {
    jobs.value = await requireMediaApi().getVideoWatermarkJobs(jobs.value.map((job) => job.id))
    if (jobs.value.every((job) => ['completed', 'failed', 'canceled'].includes(job.status))) {
      if (pollTimer) clearInterval(pollTimer)
      pollTimer = undefined
    }
  } catch (error) {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = undefined
    showError(getErrorMessage(error))
  }
}
const submitJobs = async () => {
  if (!selectedFiles.value.length) return showError('请先选择视频')
  if (region.value.width < 0.001 || region.value.height < 0.001) return showError('请先框选水印区域')
  submitLoading.value = true
  try {
    jobs.value = await requireMediaApi().createVideoWatermarkJobs({
      inputPaths: selectedFiles.value.map((file) => file.path),
      region: { ...region.value },
      maskMode: maskMode.value,
      textThreshold: textThreshold.value,
      maskExpansion: maskExpansion.value,
      keepOriginal: keepOriginal.value,
      crf: crf.value,
      preset: encodePreset.value,
    })
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = setInterval(() => void refreshJobs(), 800)
    showToast(`已创建 ${jobs.value.length} 个处理任务`)
  } catch (error) {
    showError(getErrorMessage(error))
  } finally {
    submitLoading.value = false
  }
}
const cancelJob = async (job: VideoWatermarkJob) => {
  try {
    await requireMediaApi().cancelVideoWatermarkJob(job.id)
    await refreshJobs()
  } catch (error) {
    showError(getErrorMessage(error))
  }
}
const openOutput = async (job: VideoWatermarkJob) => {
  if (job.outputPath) await toolkitApi.system.showItemInFolder(job.outputPath)
}
const statusText: Record<VideoWatermarkJob['status'], string> = {
  queued: '排队中',
  running: '处理中',
  completed: '已完成',
  failed: '失败',
  canceled: '已取消',
}
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="watermark-page">
    <el-alert
      title="该功能会重新编码视频。它会用周围像素填充框选区域，不能恢复被水印遮挡的原始画面。"
      type="info"
      :closable="false"
      show-icon
    />
    <section class="panel file-panel">
      <div class="panel-title">
        <span>1. 选择本地视频</span
        ><el-button type="primary" :loading="selectLoading" @click="selectFiles">批量选择视频</el-button>
      </div>
      <el-empty v-if="!selectedFiles.length" description="尚未选择视频" :image-size="70" />
      <div v-else class="file-list">
        <button
          v-for="file in selectedFiles"
          :key="file.path"
          class="file-item"
          :class="{ active: file.path === activeFilePath }"
          @click="setActiveFile(file)"
        >
          <span class="file-name">{{ file.name }}</span
          ><span class="file-size">{{ formatBytes(file.size) }}</span>
          <span class="remove" title="移除" @click.stop="removeFile(file)">×</span>
        </button>
      </div>
    </section>
    <section class="panel editor-panel">
      <div class="panel-title">
        <span>2. 框选水印区域</span>
        <div class="preview-time">
          <span>预览时间</span
          ><el-input-number v-model="previewSecond" :min="0" :step="1" controls-position="right" /><span>秒</span
          ><el-button :disabled="!activeFile" :loading="previewLoading" @click="loadPreview">刷新画面</el-button>
        </div>
      </div>
      <div v-loading="previewLoading" class="preview-stage">
        <div v-if="preview" class="image-wrapper">
          <img
            ref="imageRef"
            :src="preview.dataUrl"
            draggable="false"
            alt="视频预览"
            @pointerdown.prevent="startDrawing"
            @pointermove.prevent="updateDrawing"
            @pointerup.prevent="stopDrawing"
          />
          <div class="watermark-region" :style="overlayStyle" />
        </div>
        <el-empty v-else description="选择视频后生成预览" />
      </div>
      <div class="region-info">{{ regionDescription }}</div>
      <div class="preset-row">
        <el-input v-model="presetName" placeholder="预设名称，例如：右上角水印" clearable /><el-button
          @click="addPreset"
          >保存当前区域</el-button
        ><el-tag
          v-for="preset in presets"
          :key="preset.id"
          closable
          class="preset-tag"
          @click="applyPreset(preset)"
          @close="removePreset(preset.id)"
          >{{ preset.name }}</el-tag
        >
      </div>
    </section>
    <section class="panel settings-panel">
      <div class="panel-title"><span>3. 输出设置</span></div>
      <el-alert
        title="使用 FFmpeg 处理：浅色文字模式只处理识别出的笔画；彩色或实心水印模式处理整个红框。"
        type="info"
        :closable="false"
        show-icon
      />
      <div class="mask-settings">
        <label>
          <span class="setting-name">
            水印类型
            <el-tooltip
              content="浅色文字模式把红框作为检测范围，只处理持续出现的白色或浅色笔画；彩色或实心水印模式会处理整个红框。"
              placement="top"
            >
              <span class="help-icon" tabindex="0">?</span>
            </el-tooltip>
          </span>
          <el-select v-model="maskMode">
            <el-option label="浅色文字或图标（推荐）" value="light-text" />
            <el-option label="彩色或实心水印（处理整个框）" value="rectangle" />
          </el-select>
        </label>
        <label v-if="maskMode === 'light-text'">
          <span class="setting-name">
            浅色检测阈值
            <el-tooltip
              content="范围 120–245，数值越低会识别更多偏灰像素。水印笔画漏检时调低；背景亮部被误识别时调高。建议从 185 开始，每次调整 10–15。"
              placement="top"
            >
              <span class="help-icon" tabindex="0">?</span>
            </el-tooltip>
          </span>
          <el-input-number v-model="textThreshold" :min="120" :max="245" controls-position="right" />
        </label>
        <label v-if="maskMode === 'light-text'">
          <span class="setting-name">
            去除强度
            <el-tooltip
              content="将识别出的笔画向外扩展指定像素。0 最保守，2 推荐；仍有白边时可调到 3–4，数值过大会损伤更多背景。"
              placement="top"
            >
              <span class="help-icon" tabindex="0">?</span>
            </el-tooltip>
          </span>
          <el-input-number v-model="maskExpansion" :min="0" :max="6" controls-position="right" />
        </label>
        <span class="mask-tip">
          {{
            maskMode === 'light-text'
              ? '红框仅限定检测范围，程序只修复持续出现的浅色文字笔画。漏检时可适当调低阈值。'
              : '框内所有像素都会由 FFmpeg 邻域插值，复杂背景可能出现较大模糊区域。'
          }}
        </span>
      </div>
      <div class="settings-grid">
        <label
          ><span class="setting-name"
            >保留原视频
            <el-tooltip content="开启后输出为新的 _delogo 文件，原视频不会被覆盖或删除。建议保持开启。" placement="top"
              ><span class="help-icon" tabindex="0">?</span></el-tooltip
            ></span
          ><el-switch v-model="keepOriginal"
        /></label>
        <label
          ><span class="setting-name"
            >画质 CRF
            <el-tooltip
              content="控制重新编码画质：数值越低画质越高、文件越大；数值越高文件越小。推荐 18，通常可在 16–23 之间调整。"
              placement="top"
              ><span class="help-icon" tabindex="0">?</span></el-tooltip
            ></span
          ><el-input-number v-model="crf" :min="0" :max="35" controls-position="right"
        /></label>
        <label
          ><span class="setting-name"
            >编码速度
            <el-tooltip
              content="控制视频压缩速度，不改变去水印算法。较慢通常文件更小但耗时更长；“平衡”适合大多数情况。"
              placement="top"
              ><span class="help-icon" tabindex="0">?</span></el-tooltip
            ></span
          ><el-select v-model="encodePreset"
            ><el-option label="最快（文件较大）" value="ultrafast" /><el-option label="较快" value="fast" /><el-option
              label="平衡"
              value="medium" /><el-option label="较慢（压缩更好）" value="slow" /></el-select
        ></label>
      </div>
      <div class="submit-row">
        <span>输出文件默认保存在原视频目录，文件名增加 _delogo。</span
        ><el-button type="primary" size="large" :loading="submitLoading" @click="submitJobs">开始批量去水印</el-button>
      </div>
    </section>
    <section v-if="jobs.length" class="panel job-panel">
      <div class="panel-title"><span>处理队列</span></div>
      <div v-for="job in jobs" :key="job.id" class="job-item">
        <div class="job-main">
          <div class="job-name">
            {{ job.inputPath.split(/[\\/]/).at(-1) }}
            <el-tag size="small" effect="plain">FFmpeg</el-tag>
          </div>
          <el-progress :percentage="job.progress" :status="job.status === 'failed' ? 'exception' : undefined" />
          <div v-if="job.error" class="job-error">{{ job.error }}</div>
        </div>
        <el-tag>{{ statusText[job.status] }}</el-tag
        ><el-button v-if="job.status === 'queued' || job.status === 'running'" link @click="cancelJob(job)"
          >取消</el-button
        ><el-button v-if="job.status === 'completed'" link type="primary" @click="openOutput(job)">打开文件</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.watermark-page {
  overflow: auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.panel {
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  background: var(--el-bg-color);
}
.panel-title {
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
}
.file-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
}
.file-item {
  min-width: 0;
  padding: 9px 10px;
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 7px;
  color: var(--el-text-color-primary);
  background: transparent;
  cursor: pointer;
  text-align: left;
}
.file-item.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-size,
.region-info,
.submit-row > span {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.remove {
  padding: 0 4px;
  color: var(--el-color-danger);
  font-size: 18px;
}
.preview-time,
.preset-row,
.submit-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.preview-time .el-input-number {
  width: 110px;
}
.preview-stage {
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background: #050505;
}
.image-wrapper {
  position: relative;
  display: inline-block;
  max-width: 100%;
  line-height: 0;
  user-select: none;
}
.image-wrapper img {
  display: block;
  max-width: 100%;
  max-height: 58vh;
  cursor: crosshair;
}
.watermark-region {
  position: absolute;
  box-sizing: border-box;
  border: 2px solid #ff4d4f;
  background: rgb(255 77 79 / 22%);
  pointer-events: none;
}
.region-info {
  margin-top: 10px;
}
.preset-row {
  margin-top: 10px;
  flex-wrap: wrap;
}
.preset-row .el-input {
  width: 250px;
}
.preset-tag {
  cursor: pointer;
}
.settings-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 14px;
}
.mask-settings {
  margin-top: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 18px;
}
.mask-settings label {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mask-settings .el-select {
  width: 245px;
}
.mask-tip {
  flex-basis: 100%;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.setting-name {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.help-icon {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-text-color-secondary);
  border-radius: 50%;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1;
  cursor: help;
}
.settings-grid label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.submit-row {
  margin-top: 16px;
  justify-content: space-between;
}
.job-item {
  padding: 10px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.job-main {
  flex: 1;
  min-width: 0;
}
.job-name {
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.job-error {
  margin-top: 4px;
  color: var(--el-color-danger);
  font-size: 12px;
  white-space: pre-wrap;
}
@media (max-width: 900px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
  .panel-title,
  .submit-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
