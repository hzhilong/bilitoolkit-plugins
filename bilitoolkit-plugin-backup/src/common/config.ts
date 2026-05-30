import type { DataType } from '@/core/types/data-type'
import type { AppSettings } from '@/types/settings'

export const DATA_TYPE_COLORS: Record<DataType, string> = {
  bangumi_anime: '#a569bd',
  bangumi_tv: '#c07ab8',
  black: '#a0522d',
  fav_collected: '#3498db',
  fav_opuses: '#f39c12',
  favorites: '#2ecc71',
  follower: '#e84393',
  following: '#1abc9c',
  history: '#7f8c8d',
  to_view: '#e67e22',
}

export const DB_NAMES = {
  APP_SETTINGS: 'app_settings',
}

export const defaultAppSettings: AppSettings = {
  restoreMaxFailures: 0,
  clearMaxFailures: 0,
  avoidRiskControl: true,
}

// 备选
const _1 = {
  2: '#ff7f50',
  3: '#98fb98',
  4: '#ffb347',
  5: '#5d6d7e',
  6: '#fc6c85',
  7: '#40e0d0',
  8: '#ffb78c',
  9: '#c3b1e1',
  10: '#c85a17',
}
const _2 = {
  1: '#e06c6c', // 柔和红褐
  2: '#5f9e8e', // 深海绿
  3: '#ce6f8c', // 玫瑰紫
  4: '#70a5c0', // 灰湖蓝
  5: '#d99b5c', // 柿子橙
  6: '#a88b6f', // 卡其棕
  7: '#69b3a2', // 薄荷绿
  8: '#c07ab8', // 淡紫罗兰
  9: '#e2a26a', // 杏黄色
  10: '#6f9e9e', // 灰蓝绿
}
