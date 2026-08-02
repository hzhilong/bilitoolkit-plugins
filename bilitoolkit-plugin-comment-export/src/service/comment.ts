import { CommentFetchService } from 'bili-comment-core'
import { CommentRepo } from '@/db/repo/comment'
import { LoadStateRepo } from '@/db/repo/load-state'

export class CommentService extends CommentFetchService<LoadStateRepo, CommentRepo> {
  constructor() {
    super({
      commentStorage: new CommentRepo(),
      loadStateStorage: new LoadStateRepo(),
    })
  }

  async getCount() {
    return await this.commentStorage.getCount()
  }

  async deleteAll() {
    await Promise.allSettled([this.commentStorage.deleteAll, this.loadStateStorage.deleteAll])
  }
}

export const commentService = new CommentService()
