import type { DMItem, DMXml } from '@/types'
import { toolkitApi, loadingDialog } from 'bilitoolkit-ui'
import { XMLBuilder, XMLParser } from 'fast-xml-parser'
import { AppError } from 'bilitoolkit-types'
import { getErrorMessage } from '@ybgnb/utils'

export async function createDMFile(dmXml: DMXml, newFile: boolean = true) {
  try {
    loadingDialog.show()
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
      indentBy: '    ',
    })

    const { cid, items, part, page, bvid, title } = dmXml

    const dArray = items.map((item) => {
      const attrs: (string | number)[] = [
        item.progress / 1000,
        item.mode,
        item.fontsize,
        item.color,
        `${item.ctime}`,
        item.pool,
        item.midHash,
        item.idStr,
        item.weight,
      ]
      const users = JSON.stringify(item.users ?? [])

      const dObj: any = {
        '@_p': attrs.join(','),
        '#text': item.content,
      }
      if (users.length > 0) {
        dObj['@_users'] = users
      }
      if (item.cracked) {
        dObj['@_cracked'] = item.cracked
      }
      return dObj
    })

    const xmlObj = {
      i: {
        chatserver: 'chat.bilibili.com',
        bvid: bvid,
        title: title,
        chatid: `${cid}`,
        part: part,
        page: page,
        mission: '0',
        maxlimit: `${items.length}`,
        state: '0',
        real_name: '0',
        source: 'e-r',
        d: dArray,
      },
    }

    const xmlContent = builder.build(xmlObj)
    const targetFileName = `${bvid}_${cid}_${page}P_弹幕.xml`
    const fileName = newFile ? await toolkitApi.file.getUniqueFileName(targetFileName) : targetFileName
    try {
      await toolkitApi.file.delete(fileName)
    } catch {}
    await toolkitApi.file.write(fileName, new TextEncoder().encode(xmlContent))
    const filePath = [await toolkitApi.file.getRootDir(), fileName].join('/').replace(/\/+/g, '/')
    await toolkitApi.system.showItemInFolder(filePath)
  } finally {
    loadingDialog.close()
  }
}

export async function parseDMFile(xmlStr: string): Promise<DMXml | null> {
  try {
    loadingDialog.show()
    const parser = new XMLParser({
      ignoreAttributes: false,
      allowBooleanAttributes: true,
      attributeNamePrefix: '@_',
      isArray: (tagName) => tagName === 'd',
    })

    const result = parser.parse(xmlStr)
    const i = result.i
    if (!i) return null

    const meta = {
      bvid: i.bvid,
      title: i.title,
      cid: Number(i.chatid),
      part: i.part,
      page: i.page,
    }

    const dList = i.d || []
    const dmItems = dList.map((d: any) => {
      const pStr = d['@_p'] || ''
      const parts = pStr.split(',').map((s: any) => s.trim())
      // 顺序必须与生成时一致：
      // progress/1000, mode, fontsize, color, ctime, pool, midHash, idStr, weight
      const [progressSec, mode, fontsize, color, ctime, pool, midHash, idStr, weight] = parts

      const cracked = d['@_cracked']
      const users: DMItem['users'] = d['@_users'] ? JSON.parse(d['@_users']) : []
      // 还原为 DMItem
      const item: DMItem = {
        progress: parseFloat(progressSec) * 1000, // 转回毫秒
        mode: parseInt(mode, 10),
        fontsize: parseInt(fontsize, 10),
        color: parseInt(color, 10),
        ctime: BigInt(parseInt(ctime, 10)),
        pool: parseInt(pool, 10),
        midHash: midHash || '',
        idStr: idStr || '',
        weight: parseInt(weight, 10) || 0,
        content: String(d['#text']) || '',
        users: users,
        uids: users.map((u) => u.mid),
        cracked: cracked,
        loading: false,
      }
      return item
    })
    return {
      ...meta,
      items: dmItems,
    }
  } catch (e) {
    console.error(e)
    throw new AppError(`解析xml文件失败：${getErrorMessage(e)}`)
  } finally {
    loadingDialog.close()
  }
}
