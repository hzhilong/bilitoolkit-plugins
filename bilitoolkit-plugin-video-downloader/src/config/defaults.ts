import type { AppSettings } from '@/types/settings'
import type { OptionalFileNamerFields, FileNamerSettings } from '@/types/file-namer'

export const defaultAppSettings: () => AppSettings = () => ({
  preferredAudioQuality: 30251,
  preferredVideoQuality: 120,
  preferredVideoCodec: 7,
  autoMerge: true,
  autoRenameOnConflict: true,
  autoReparseOnUrlExpired: true,
  defaultResourceTypes: ['audio', 'video'],
})

export const defaultFileNamerFields: () => OptionalFileNamerFields[] = () => [
  'bvid',
  '_',
  'title',
  'fileSeparator',
  'partTitle',
  '.',
  'videoQuality',
  '.',
  'videoCodec',
  '.',
  'audioQuality',
  '-',
  'partSeq',
]

export const defaultFileNamerSettings: () => FileNamerSettings = () => ({
  fields: defaultFileNamerFields(),
  extendedFormats: {
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH-mm-ss',
    serialNumberFormat: 'natural',
  },
})
