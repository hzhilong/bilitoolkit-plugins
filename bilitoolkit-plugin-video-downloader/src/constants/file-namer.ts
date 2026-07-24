import {
  type VideoZoneV1Id,
  parseVideoZoneV1,
  parseVideoZoneV2,
  type VideoZoneV2Id,
  audioQualityMap,
  videoQualityMap,
  videoCodecIdMap,
} from '@ybgnb/bili-api'
import { type FileNamingFieldDefinition, baseFileNamingFieldMap } from '@ybgnb/file-naming'
import type { FileNamingData } from '@/types/file-namer'
import dayjs from 'dayjs'

export const fileNamerFields = {
  avid: {
    label: 'avid',
    resolve: ({ data: { video } }) => `${video.aid}`,
  },
  bvid: {
    label: 'bvid',
    resolve: ({ data: { video } }) => `${video.bvid}`,
  },
  title: {
    label: '视频标题',
    resolve: ({ data: { video } }) => `${video.title}`,
  },
  mainZone: {
    label: '视频主分区',
    resolve: ({ data: { video } }) => {
      const zoneV1 = parseVideoZoneV1(video.tid as VideoZoneV1Id)
      const zoneV2 = parseVideoZoneV2(video.tid_v2 as VideoZoneV2Id)
      return zoneV2?.mainZoneName ?? zoneV1?.mainZoneName ?? ''
    },
  },
  subZone: {
    label: '视频子分区',
    resolve: ({ data: { video } }) => {
      const zoneV1 = parseVideoZoneV1(video.tid as VideoZoneV1Id)
      const zoneV2 = parseVideoZoneV2(video.tid_v2 as VideoZoneV2Id)
      return zoneV2?.subZoneName ?? zoneV1?.subZoneName ?? ''
    },
  },
  upperUid: {
    label: 'UP主UID',
    resolve: ({ data: { video } }) => {
      return String(video.owner.mid)
    },
  },
  upperName: {
    label: 'UP主昵称',
    resolve: ({ data: { video } }) => {
      return String(video.owner.name)
    },
  },
  publishDate: {
    label: '发布日期',
    resolve: ({ data: { video }, extendedFormats: { dateFormat } }) => {
      return dayjs.unix(video.pubdate).format(dateFormat)
    },
  },
  publishTime: {
    label: '发布时间',
    resolve: ({ data: { video }, extendedFormats: { timeFormat } }) => {
      return dayjs.unix(video.pubdate).format(timeFormat)
    },
  },
  partCount: {
    label: '分P 总数',
    resolve: ({ data: { video } }) => String(video.videos),
  },
  partSeq: {
    label: '分P 序号',
    resolve: ({ data: { part } }) => String(part.page),
  },
  partSeqIgnoreSingle: {
    label: '分P - (忽略单P)',
    resolve: ({ data: { video, part } }) => (video.videos > 0 ? `${part.page} - ` : ''),
  },
  cid: {
    label: '分P cid',
    resolve: ({ data: { part } }) => `${part.cid}`,
  },
  partTitle: {
    label: '分P 标题',
    resolve: ({ data: { part } }) => `${part.part}`,
  },
  audioQuality: {
    label: '视频音质',
    resolve: ({ data: { audioQuality } }) => audioQualityMap[audioQuality],
  },
  videoQuality: {
    label: '视频画质',
    resolve: ({ data: { videoQuality } }) => videoQualityMap[videoQuality],
  },
  videoCodec: {
    label: '视频编码',
    resolve: ({ data: { videoCodec } }) => videoCodecIdMap[videoCodec],
  },
  downloadDateTime: {
    label: '发布时间',
    resolve: ({ resolveDate, extendedFormats: { timeFormat, dateFormat } }) => {
      return dayjs(resolveDate).format(dateFormat + '_' + timeFormat)
    },
  },
} as const satisfies Record<string, FileNamingFieldDefinition<FileNamingData>>

export const allFileNamerFields = {
  ...fileNamerFields,
  ...baseFileNamingFieldMap,
} as const satisfies Record<string, FileNamingFieldDefinition<FileNamingData>>
