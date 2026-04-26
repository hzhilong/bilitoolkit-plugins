import type { TaskSchedule, TaskConfigField } from 'bilitoolkit-types'

// 每天凌晨 0:05 执行一次
export const taskScheduleCron = '5 0 * * *'

export const taskSchedule: TaskSchedule = {
  type: 'cron',
  value: taskScheduleCron,
}

export const taskConfigSchemaMap = {
  login: {
    name: 'dailyLogin',
    label: '每日登录',
    type: 'switch',
    default: true,
    description: '主站[每日登录]任务，经验 +5',
  },
  watch: {
    name: 'dailyWatch',
    label: '每日观看',
    type: 'switch',
    default: true,
    description: '主站[每日观看视频]任务，经验 +5',
  },
  coin: {
    name: 'dailyCoin',
    label: '每日投币',
    type: 'select',
    options: Array.from({ length: 6 }, (_, i) => i).map((i) => ({
      label: `${i}个`,
      value: `${i}`,
    })),
    default: '0',
    description: '主站[每日投币]任务。从动态中选取视频投币，每次投币经验 +10',
  },
  share: {
    name: 'dailyShare',
    label: '每日分享',
    type: 'switch',
    default: true,
    description: '主站[每日分享]任务，经验 +5',
  },
} as const

export const taskConfigSchema = {
  fields: [
    {
      name: 'users',
      label: '需要升级的用户',
      type: 'users',
      description: '请选择需要快速升级的用户',
      required: true,
    } satisfies TaskConfigField,
    ...Object.values(taskConfigSchemaMap),
  ],
} as const

export type MyTaskConfigFields = typeof taskConfigSchema.fields
