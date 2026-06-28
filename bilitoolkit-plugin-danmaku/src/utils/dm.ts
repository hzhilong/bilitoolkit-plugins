export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  const parts = [hours, minutes, seconds]
  const startIndex = hours > 0 ? 0 : 1

  return parts
    .slice(startIndex)
    .map((v) => String(v).padStart(2, '0'))
    .join(':')
}
