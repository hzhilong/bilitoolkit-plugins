export function parsePositiveInteger(str: string) {
  const trimmed = str.trim()
  if (!/^\d+$/.test(trimmed)) return null
  try {
    return Number(trimmed)
  } catch {
    return null
  }
}
