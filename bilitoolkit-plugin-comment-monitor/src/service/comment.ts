import { CommentFetchService } from 'bili-comment-core'
import { CommentRepo } from '@/db/repo/comment'
import { LoadStateRepo } from '@/db/repo/load-state'
import { db } from '@/db/db'

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
    await db.transaction('rw', db.comment, db.loadState, async () => {
      await db.comment.clear()
      await db.loadState.clear()
    })
  }
}

export const commentService = new CommentService()
