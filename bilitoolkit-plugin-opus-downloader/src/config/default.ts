import type { AppSettings } from '@/types/settings'
import type { OptionalFileNamerFields, FileNamerSettings } from '@/types/file-namer'

export const defaultAppSettings = () => {
  return {
    downloadResourceTypes: ['md'],
    mdLocalImages: true,
    mdPrependAttribution: true,
    turndownOptions: {
      headingStyle: 'atx',
      hr: '---',
      br: '  \n',
      bulletListMarker: '*',
      codeBlockStyle: 'fenced',
      fence: '```',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full',
      preformattedCode: false,
    },
  } as AppSettings
}

export const defaultFileNamerFields: () => OptionalFileNamerFields[] = () => [
  'upperName',
  'space',
  'upperUid',
  'fileSeparator',
  'collectionName',
  'fileSeparator',
  'publishDate',
  '_',
  'publishTime',
  '_',
  'title',
]

export const defaultFileNamerSettings: () => FileNamerSettings = () => ({
  fields: defaultFileNamerFields(),
  extendedFormats: {
    dateFormat: 'YYYYMMDD',
    timeFormat: 'HHmmss',
    serialNumberFormat: 'natural',
  },
})
