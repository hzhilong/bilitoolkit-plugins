import { type OpusDetail } from '@ybgnb/bili-api'
import { type FileNamingFieldDefinition, baseFileNamingFieldMap } from '@ybgnb/file-naming'
import dayjs from 'dayjs'
import { parseOpusAuthor, parseOpusTitle, parseOpusCollection } from '@/utils/parse'

export const fileNamerFields = {
  opusId: {
    label: '专栏id',
    resolve: ({
      data: {
        item: { id_str },
      },
    }) => id_str,
  },
  title: {
    label: '专栏标题',
    resolve: ({ data }) => parseOpusTitle(data),
  },
  upperUid: {
    label: 'UP主UID',
    resolve: ({ data }) => {
      return String(parseOpusAuthor(data)?.mid ?? '')
    },
  },
  upperName: {
    label: 'UP主昵称',
    resolve: ({ data }) => {
      return String(parseOpusAuthor(data)?.name ?? '')
    },
  },
  publishDate: {
    label: '发布日期',
    resolve: ({ data, extendedFormats: { dateFormat } }) => {
      const author = parseOpusAuthor(data)
      return !author ? '' : dayjs.unix(Number(author.pub_ts)).format(dateFormat)
    },
  },
  publishTime: {
    label: '发布时间',
    resolve: ({ data, extendedFormats: { timeFormat } }) => {
      const author = parseOpusAuthor(data)
      return !author ? '' : dayjs.unix(Number(author.pub_ts)).format(timeFormat)
    },
  },
  downloadDateTime: {
    label: '下载时间',
    resolve: ({ resolveDate, extendedFormats: { timeFormat, dateFormat } }) => {
      return dayjs(resolveDate).format(dateFormat + '_' + timeFormat)
    },
  },
  collectionName: {
    label: '文集名称',
    resolve: ({ data }) => {
      return parseOpusCollection(data)?.name ?? ''
    },
  },
} as const satisfies Record<string, FileNamingFieldDefinition<OpusDetail>>

export const allFileNamerFields = {
  ...fileNamerFields,
  ...baseFileNamingFieldMap,
} as const satisfies Record<string, FileNamingFieldDefinition<OpusDetail>>
