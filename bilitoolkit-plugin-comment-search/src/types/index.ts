export interface CommentSource {
  oid: string
  type: string | number
}

export interface CommentQuery {
  keyword?: string
  uid?: number
  maxCount?: number
  isFetchSub: boolean
  mode: string
}
