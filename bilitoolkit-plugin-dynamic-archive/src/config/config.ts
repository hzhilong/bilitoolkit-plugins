import type { TaskSchedule, TaskConfigField } from 'bilitoolkit-types'

// 每隔 10 分钟
export const taskScheduleCron = '*/10 * * * *'

export const taskSchedule: TaskSchedule = {
  type: 'cron',
  value: taskScheduleCron,
}

export const taskConfigSchemaMap = {
  uids: {
    name: 'uid',
    label: '需要监控的用户 UID',
    type: 'input',
    required: true,
  },
} as const

export const taskConfigSchema = {
  fields: [
    {
      name: 'user',
      label: '用于查询动态的用户',
      type: 'user',
      required: true,
    } as const satisfies TaskConfigField,
    ...Object.values(taskConfigSchemaMap),
  ],
} as const

export type MyTaskConfigFields = typeof taskConfigSchema.fields
