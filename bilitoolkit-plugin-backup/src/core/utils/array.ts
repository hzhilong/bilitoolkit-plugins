export function inArray<T>(value: T, array: readonly T[]): boolean {
  return array.includes(value)
}
