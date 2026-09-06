import markdownToTxt from 'markdown-to-txt'

export async function markdownToDocx(markdown: string) {
  return markdownToTxt(markdown)
}
