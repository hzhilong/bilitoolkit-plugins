<script setup lang="ts">
import { pushConfigTypeMap, type MonitorConfig, type PushConfig } from '@/types'
import { showError } from 'bilitoolkit-ui'
import { computed, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { fetchCommentSectionMeta } from '@/utils/comment'

const props = defineProps<{
  config?: MonitorConfig | null
}>()

const dialogVisible = defineModel<boolean>()
const editingConfig = computed(() => !!props.config)

// 表单引用
const formRef = ref<FormInstance>()

// 基础表单数据
const baseForm = ref<Pick<MonitorConfig, 'name' | 'url' | 'interval'> & { targetUidStr: string }>({
  name: '',
  url: '',
  interval: 60,
  targetUidStr: '',
})

const pushConfigs = ref<PushConfig[]>([])

// 表单验证规则
const formRules = computed<FormRules>(() => ({
  name: [
    { required: true, message: '请输入配置名称', trigger: 'blur' },
    { min: 1, max: 20, message: '配置名称长度在 1 到 20 个字符', trigger: 'blur' },
  ],
  url: [
    { required: true, message: '请输入动态/视频 URL', trigger: 'blur' },
    {
      pattern: /^https?:\/\/.+/,
      message: '请输入正确的 URL 格式',
      trigger: 'blur',
    },
  ],
  targetUidStr: [
    { required: true, message: '请输入需要监听的用户 UID', trigger: 'blur' },
    {
      pattern: /^(0|[1-9]\d*)(,(0|[1-9]\d*))*$/,
      message: '请输入需要监听的用户 UID，多个 UID 请用英文逗号 , 分隔',
      trigger: 'blur',
    },
  ],
  interval: [
    { required: true, message: '请输入查询间隔', trigger: 'blur' },
    {
      type: 'number',
      min: 60,
      message: '查询间隔不能小于 60 秒',
      trigger: 'blur',
    },
  ],
}))

// 监听弹窗打开/关闭，初始化或重置表单数据
watch(dialogVisible, (newVal) => {
  if (newVal && props.config) {
    baseForm.value = {
      name: props.config.name,
      url: props.config.url,
      interval: props.config.interval,
      targetUidStr: props.config.targetUids?.join(',') ?? '',
    }
    pushConfigs.value = props.config.pushConfigs ?? []
  } else if (newVal) {
    // 新建时重置表单
    baseForm.value = {
      name: '',
      url: '',
      interval: 60,
      targetUidStr: '',
    }
    pushConfigs.value = []
    formRef.value?.clearValidate()
  }
})

const emit = defineEmits<{
  save: [config: MonitorConfig]
}>()

/**
 * 解析并验证 targetUids 字符串，转换为 number 数组
 * 规则：
 *   - 字符串为空时返回空数组
 *   - 按英文逗号分隔，去除空字符串
 *   - 每个 UID 必须是纯数字
 *   - 过滤掉重复的 UID
 */
const parseTargetUids = (uidStr: string): number[] | null => {
  // 去除首尾空格，如果为空则返回空数组
  const trimmed = uidStr.trim()
  if (!trimmed) {
    return []
  }

  // 按英文逗号分隔
  const uidParts = trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (uidParts.length === 0) {
    return []
  }

  const uids: number[] = []
  for (const part of uidParts) {
    // 验证是否为纯数字
    if (!/^\d+$/.test(part)) {
      showError(`UID "${part}" 格式不正确，请输入纯数字 UID`)
      return null
    }
    uids.push(Number(part))
  }

  // 去重并返回
  return [...new Set(uids)]
}

/**
 * 添加飞书机器人推送配置
 */
const addPushConfig = () => {
  pushConfigs.value.push({
    type: 'FeiShuBot',
    webhookUrl: '',
    secret: '',
  })
}

/**
 * 删除推送配置
 */
const removePushConfig = (index: number) => {
  pushConfigs.value.splice(index, 1)
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
  // 1. 验证基础表单
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  // 2. 解析并验证 targetUids
  const targetUids = parseTargetUids(baseForm.value.targetUidStr ?? '')
  if (targetUids === null) {
    return
  }

  // 3. 验证推送配置（如果有推送配置）
  if (pushConfigs.value.length > 0) {
    for (let i = 0; i < pushConfigs.value.length; i++) {
      const config = pushConfigs.value[i]
      if (!config.webhookUrl || config.webhookUrl.trim() === '') {
        showError(`第 ${i + 1} 个推送配置的 Webhook 地址不能为空`)
        return
      }
      if (!/^https?:\/\/.+/i.test(config.webhookUrl)) {
        showError(`第 ${i + 1} 个推送配置的 Webhook 地址格式不正确`)
        return
      }
    }
  }

  // 4. 获取评论区元数据（预留函数，后续补充）
  const commentMeta = await fetchCommentSectionMeta(baseForm.value.url)

  if (!commentMeta) {
    showError('未找到关联的评论区')
    return
  }

  // 5. 组装完整的 MonitorConfig 对象
  const finalConfig: Omit<MonitorConfig, 'id'> = {
    uuid: props.config?.uuid ?? crypto.randomUUID(),
    name: baseForm.value.name,
    url: baseForm.value.url,
    interval: baseForm.value.interval,
    commentSectionMeta: commentMeta,
    targetUids: targetUids.length > 0 ? targetUids : [],
    pushConfigs: pushConfigs.value,
    createTime: props.config?.createTime ?? Math.floor(Date.now() / 1000),
    updateTime: props.config?.updateTime ?? undefined,
    result: props.config?.result ?? [],
  }

  // 6. 触发保存事件
  emit('save', finalConfig)
  dialogVisible.value = false
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="editingConfig ? '编辑配置' : '创建配置'"
    width="680px"
    destroy-on-close
    :close-on-click-modal="false"
    center
  >
    <el-form ref="formRef" :model="baseForm" :rules="formRules" label-width="140px">
      <!-- 配置名称 -->
      <el-form-item label="配置名称" prop="name">
        <el-input v-model="baseForm.name" placeholder="请输入配置名称" maxlength="20" show-word-limit />
      </el-form-item>

      <!-- 动态/视频 URL -->
      <el-form-item label="动态/视频 URL" prop="url">
        <el-input v-model="baseForm.url" placeholder="请输入 B站动态或视频链接" :disabled="config?.uuid != null" />
      </el-form-item>

      <!-- 查询间隔 -->
      <el-form-item label="查询间隔" prop="interval">
        <el-input-number
          v-model="baseForm.interval"
          :min="60"
          :precision="0"
          controls-position="right"
          style="width: 180px"
        />
        <span class="form-suffix">秒</span>
      </el-form-item>

      <!-- 监听 UID -->
      <el-form-item label="监听 UID" prop="targetUidStr" required>
        <el-input
          v-model="baseForm.targetUidStr"
          placeholder="需要监听的用户 UID，多个 UID 请用英文逗号 , 分隔"
          style="width: 100%"
          :disabled="config?.uuid != null"
        />
      </el-form-item>

      <!-- 推送方式 -->
      <el-divider content-position="left">推送方式（可选）</el-divider>

      <div class="push-config-section">
        <div class="push-config-actions">
          <el-button type="primary" size="small" @click="addPushConfig"> + 添加飞书机器人 </el-button>
        </div>

        <div v-if="pushConfigs.length > 0" class="push-configs">
          <div class="push-config" v-for="(config, index) in pushConfigs" :key="index">
            <div class="push-config-header">
              <el-tag>{{ pushConfigTypeMap[config.type] }}</el-tag>
              <el-tooltip content="删除此推送配置">
                <el-button type="danger" size="small" link @click="removePushConfig(index)"> 删除 </el-button>
              </el-tooltip>
            </div>

            <div class="push-config-body">
              <el-input v-model="config.webhookUrl" placeholder="请输入 Webhook 地址" style="margin-bottom: 8px" />

              <el-input v-model="config.secret" placeholder="请输入签名密钥（可选）" show-password />
            </div>
          </div>
        </div>

        <div v-else class="push-config-empty">暂未添加推送方式</div>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="false" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.form-suffix {
  margin-left: 8px;
  color: #909399;
  font-size: 14px;
}

.push-config-section {
  width: 100%;
}

.push-config-actions {
  margin-bottom: 12px;
}

.push-configs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.push-config {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  background-color: #fafafa;
}

.push-config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.push-config-body {
  display: flex;
  flex-direction: column;
}

.push-config-empty {
  padding: 16px;
  text-align: center;
  color: #909399;
  font-size: 13px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border: 1px dashed #dcdfe6;
}
</style>
