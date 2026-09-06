import type { OpusDetail } from '@ybgnb/bili-api'

export const testOpusDetail = {
  item: {
    id_str: '1234567890',
    type: 1,
    basic: {
      title: '测试专栏 - 哔哩哔哩',
      uid: '5282882',
    },
    modules: [
      {
        module_type: 'MODULE_TYPE_AUTHOR',
        module_top: null,
        module_title: null,
        module_author: {
          type: 'AUTHOR_TYPE_NORMAL',
          name: '哔哩工具姬',
          mid: 5282882,
          pub_ts: '1638789889',
        },
      },
    ],
  },
  fallback: null,
} as unknown as OpusDetail
