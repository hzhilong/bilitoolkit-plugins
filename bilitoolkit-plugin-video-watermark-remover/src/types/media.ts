export type WatermarkRegion = { x: number; y: number; width: number; height: number }
export type VideoMediaFile = { path: string; name: string; size: number }
export type VideoPreview = { dataUrl: string; width: number; height: number; durationSeconds?: number }
export type VideoWatermarkJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'canceled'
export type VideoWatermarkMaskMode = 'light-text' | 'rectangle'
export type VideoWatermarkJob = {
  id: string
  inputPath: string
  outputPath?: string
  status: VideoWatermarkJobStatus
  progress: number
  error?: string
  createdAt: number
  updatedAt: number
}
export type CreateVideoWatermarkJobOptions = {
  inputPaths: string[]
  region: WatermarkRegion
  maskMode?: VideoWatermarkMaskMode
  textThreshold?: number
  maskExpansion?: number
  keepOriginal?: boolean
  crf?: number
  preset?: 'ultrafast' | 'fast' | 'medium' | 'slow'
}
export interface ToolkitMediaApi {
  selectVideoFiles(): Promise<VideoMediaFile[]>
  getVideoPreview(filePath: string, positionSeconds?: number): Promise<VideoPreview>
  createVideoWatermarkJobs(options: CreateVideoWatermarkJobOptions): Promise<VideoWatermarkJob[]>
  getVideoWatermarkJobs(ids?: string[]): Promise<VideoWatermarkJob[]>
  cancelVideoWatermarkJob(id: string): Promise<void>
}
export type WatermarkPreset = { id: string; name: string; region: WatermarkRegion }
