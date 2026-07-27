import type { TaskSchedule, TaskConfigField } from 'bilitoolkit-types'
import { audioQualityEntries, videoQualityEntries, videoCodecEntries } from '@ybgnb/bili-api'

// 每隔 10 分钟
export const taskScheduleCron = '*/10 * * * *'

export const taskSchedule: TaskSchedule = {
  type: 'cron',
  value: taskScheduleCron,
}

export const taskConfigSchemaMap = {
  uid: {
    name: 'uid',
    label: '用户 UID',
    description: '请输入需要监控的用户 UID',
    type: 'input',
    required: true,
  },
  preferredAudioQuality: {
    name: 'preferredAudioQuality',
    label: '优先下载的音频音质',
    type: 'select',
    options: audioQualityEntries.map(([id, name]) => ({
      label: String(name),
      value: String(id),
    })),
    default: '30232',
    required: true,
  },
  preferredVideoQuality: {
    name: 'preferredVideoQuality',
    label: '优先下载的视频画质',
    type: 'select',
    options: videoQualityEntries.map(([id, name]) => ({
      label: String(name),
      value: String(id),
    })),
    default: '80',
    required: true,
  },
  preferredVideoCodec: {
    name: 'preferredVideoCodec',
    label: '优先下载的视频编码',
    type: 'select',
    options: videoCodecEntries.map(([id, name]) => ({
      label: String(name),
      value: String(id),
    })),
    default: '7',
    required: true,
  },
} as const

export const taskConfigSchema = {
  fields: [
    {
      name: 'user',
      label: '用于下载视频的用户',
      type: 'user',
      required: true,
    } as const satisfies TaskConfigField,
    ...Object.values(taskConfigSchemaMap),
  ],
} as const

export type MyTaskConfigFields = typeof taskConfigSchema.fields
