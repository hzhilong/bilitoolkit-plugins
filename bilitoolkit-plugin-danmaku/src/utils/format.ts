import type { DMItem } from '@/types'

export const modeMap: Record<number, string> = {
  1: '普通弹幕',
  2: '普通弹幕',
  3: '普通弹幕',
  4: '底部弹幕',
  5: '顶部弹幕',
  6: '逆向弹幕',
  7: '高级弹幕',
  8: '代码弹幕',
  9: 'BAS弹幕',
}

export function formatMode(mode: DMItem['mode']) {
  return modeMap[mode] ?? `未知类型(${mode})`
}

export function formatColor(color: number): string {
  return '#' + color.toString(16).padStart(6, '0').toUpperCase()
}

export const poolMap: Record<number, string> = {
  0: '普通池',
  1: '字幕池',
  2: '特殊池',
}

export function formatPool(pool: DMItem['pool']) {
  return poolMap[pool] ?? `未知弹幕池(${pool})`
}
