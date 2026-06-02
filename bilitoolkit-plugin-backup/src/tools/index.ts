import type { ToolContext } from '@/types/tools'

export abstract class Tool {
  abstract title: string
  abstract desc: string
  abstract executor(context: ToolContext): Promise<void>
}
