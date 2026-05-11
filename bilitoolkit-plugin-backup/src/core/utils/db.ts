/**
 * 忽略 undefined 值的字段
 * @param obj
 */
export const omitUndefined = <T extends object>(obj: T): Partial<T> =>
  Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined)) as Partial<T>
