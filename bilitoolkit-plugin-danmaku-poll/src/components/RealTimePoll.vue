<script setup lang="ts">
import type { PollConfig, PollResult, PollStatusType } from '@/types'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { BiliLiveMessageClient, UniversalCompression } from 'bili-live-message-core'
import type { DanmakuMessage, MessageType, MessageMap } from 'bili-live-message-core/src'
import { createLogger, getErrorMessage } from '@ybgnb/utils'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import type { UserInfoWithCookie } from '@ybgnb/bili-api'
import { AppError } from 'bilitoolkit-types'

const props = defineProps<{
  config: PollConfig
  roomId: number
  user: UserInfoWithCookie
  logger?: (msg: string) => void
}>()
const emits = defineEmits<{
  finished: [result: PollResult]
  reconnectFailed: []
}>()

const options = computed(() => props.config.options)
const status = ref<PollStatusType>('active')
const startTime = ref<number>()
const countMap = ref<Record<number, number>>({})
const userCountMap = new Set<number>()
const totalVotes = ref<number>(0)
const pollResult = computed<PollResult | undefined>(() => {
  if (!startTime.value) return undefined
  return {
    status: status.value,
    startTime: startTime.value,
    endTime: startTime.value + props.config.durationSeconds,
    config: props.config,
    totalVotes: totalVotes.value,
    optionResults: props.config.options.map((value, index) => {
      return {
        option: value,
        count: countMap.value?.[index] ?? 0,
      }
    }),
  }
})
const countdownText = ref<string>()
const updateCountdownText = () => {
  if (status.value !== 'active' || !pollResult.value) {
    countdownText.value = undefined
    return
  }

  const now = Math.floor(Date.now() / 1000)
  const remaining = Math.max(0, pollResult.value.endTime - now)
  const minutes = Math.floor((remaining % 3600) / 60)
  const seconds = Math.floor(remaining % 60)
  if (minutes > 0) {
    countdownText.value = `${minutes}分 ${seconds}秒`
  }
  if (seconds > 0) {
    countdownText.value = `${seconds}秒`
  } else {
    countdownText.value = undefined
  }
}

let liveMessageClient: BiliLiveMessageClient | null = null

let finishTimer: ReturnType<typeof setTimeout> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null

const handleDanmakuMessage = (danmu: DanmakuMessage) => {
  try {
    const content = danmu.info[1].trim()
    const [mid, uname] = danmu.info[2]
    props.logger?.(`[${uname}](${mid}): ${content}`)

    if (/^[1-9]\d*$/.test(content)) {
      const index = Number(content)
      if (index <= options.value.length) {
        const optionName = options.value[index - 1].label
        if (userCountMap.has(mid)) {
          props.logger?.(`[${uname}](${mid}) 无效投票: ${optionName}`)
        } else {
          userCountMap.add(mid)
          countMap.value[index - 1] = (countMap.value[index - 1] ?? 0) + 1
          totalVotes.value++
          props.logger?.(`[${uname}](${mid}) 投票: ${optionName}`)
        }
      }
    }
  } catch (e) {
    props.logger?.(`解析弹幕数据出错：${getErrorMessage(e)}`)
  }
}

const startStatPoll = async () => {
  if (status.value !== 'active' || !pollResult.value) {
    return
  }
  if (liveMessageClient) {
    closeClient()
  }
  if (!props.roomId) {
    throw new AppError('直播间 id 不能为空')
  }

  const serverConfig = await publicClient.live.getLiveMsgServerConfig(props.roomId)
  liveMessageClient = new BiliLiveMessageClient(
    {
      uid: props.user.mid,
      roomId: props.roomId,
      compression: new UniversalCompression(),
    },
    serverConfig,
    {
      onReconnectFailed: () => {
        emits('reconnectFailed')
        closeClient()
      },
      onMessage: <Type extends MessageType = MessageType>(type: MessageType, message: MessageMap<Type>) => {
        if (type === 'DANMU_MSG') {
          handleDanmakuMessage(message)
        }
      },
      logger: createLogger<'debug' | 'info' | 'warn' | 'error'>(
        () => 'info',
        (logLevel, ...args) => {
          props.logger?.(String(...args))
        },
      ),
    },
  )
  liveMessageClient.connect()

  finishTimer = setTimeout(() => {
    stop()
    finishTimer = null
  }, props.config.durationSeconds * 1000)
  countdownTimer = setInterval(() => {
    updateCountdownText()
  }, 250)
}
const closeClient = () => {
  if (liveMessageClient) {
    liveMessageClient.disconnect()
    liveMessageClient.destroy()
    liveMessageClient = null
  }
}
const stop = () => {
  if (finishTimer) {
    clearTimeout(finishTimer)
    finishTimer = null
  }
  closeClient()
  if (status.value !== 'active') return
  status.value = 'ended'
  props.logger?.('投票已结束')
  emits('finished', pollResult.value!)
}

onMounted(() => {
  startTime.value = Math.floor(Date.now() / 1000)
  startStatPoll()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (finishTimer) {
    clearTimeout(finishTimer)
    finishTimer = null
  }
  closeClient()
})

defineExpose({
  stop,
})
</script>

<template>
  <PollResultViewer v-if="pollResult" :result="pollResult" :countdownText="countdownText"></PollResultViewer>
</template>

<style scoped lang="scss"></style>
