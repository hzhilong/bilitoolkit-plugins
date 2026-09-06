import { allFileNamerFields } from '@/constants/file-namer'
import type { DateFormat, TimeFormat, SerialNumberFormat } from '@ybgnb/file-naming'

export type OptionalFileNamerFields = keyof typeof allFileNamerFields

export interface FileNamerSettings {
  fields: OptionalFileNamerFields[]
  extendedFormats: {
    dateFormat: DateFormat
    timeFormat: TimeFormat
    serialNumberFormat: SerialNumberFormat
  }
}
