import { ElMessageBox } from 'element-plus'

export const inputUid = async (msg: string = '请输入 UID') => {
  const { value } = await ElMessageBox.prompt(msg, '提示', {
    confirmButtonText: '下一步',
    cancelButtonText: '取消',
    inputPattern: /^[0-9]+$/,
    inputErrorMessage: '无效 uid',
  })
  return Number(value)
}
