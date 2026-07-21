import type { VideoInfo } from '@ybgnb/bili-api'
import type { FileNamingData } from '@/types/file-namer'

export const videoInfoExample = {
  bvid: 'BV1gc1zY1EpV',
  aid: 113260602921978,
  videos: 1,
  tid: 230,
  tid_v2: 2099,
  copyright: 1,
  pic: 'http://i2.hdslb.com/bfs/archive/85adbbb220ea41f5d458a8ace6d9975b144a8810.jpg',
  title: 'B站账号备份还原｜数据迁移｜一键重生',
  pubdate: 1728219916,
  ctime: 1728219916,
  duration: 65,
  owner: {
    mid: 3546767440218962,
    name: '账号已注销',
    face: 'https://i0.hdslb.com/bfs/face/member/noface.jpg',
  },
  cid: 26170757059,
  pages: [
    {
      cid: 26170757059,
      page: 1,
      from: 'vupload',
      part: 'B站账号备份还原｜数据迁移｜一键重生',
      duration: 65,
      dimension: {
        width: 1920,
        height: 1080,
        rotate: 0,
      },
      first_frame: 'http://i1.hdslb.com/bfs/storyff/n241006sa2sr0n3kwf7gu03nyz7pnhbn_firsti.jpg',
    },
  ],
} as unknown as VideoInfo

export const fileNamingDataExample: FileNamingData = {
  video: videoInfoExample,
  part: videoInfoExample.pages[0],
  audioQuality: 30232,
  videoCodec: 12,
  videoQuality: 80,
}
