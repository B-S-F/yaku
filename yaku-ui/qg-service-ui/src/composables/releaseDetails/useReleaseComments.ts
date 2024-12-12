// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ReleaseComment } from '~/api'
import { useApiReleases } from '../api/useApiReleases'
import { Ref } from 'vue'

type checkPayload = {
  chapterId: string
  requirementId: string
  checkId: string
}

const useReleaseComments = (comments: Ref<ReleaseComment[]>) => {
  const {
    addCommentToRelease,
    resolveReleaseComment,
    resetReleaseComment,
    deleteReleaseComment,
  } = useApiReleases()

  /**
   * Add a comment on a release
   * @param releaseId number
   * @param comment string
   * @returns
   */
  const addCommentToARelease = async (
    releaseId: number,
    comment: string,
    todo = true,
  ) => {
    const r = await addCommentToRelease({
      releaseId,
      comment: {
        reference: {
          type: 'release',
        },
        content: comment,
        todo,
      },
    })
    if (!r.ok) {
      throw new Error((await r.json())?.message)
    }
    const rjson = (await r.json()) as ReleaseComment
    comments.value.unshift(rjson) // A new comment is added at the top of the list
  }

  /**
   * Reply a comment
   * @param releaseId number
   * @param commentPayload { commentId: number, comment: string }
   * @returns void
   */
  const replyComment = async (
    releaseId: number,
    { commentId, comment }: { commentId: number; comment: string },
  ) => {
    const r = await addCommentToRelease({
      releaseId,
      comment: {
        reference: {
          type: 'comment',
          id: commentId,
        },
        content: comment,
        todo: false,
      },
    })
    if (!r.ok) {
      throw new Error((await r.json())?.message)
    }
    const rjson = (await r.json()) as ReleaseComment
    const parentCommentIdx = comments.value.findIndex((c) => c.id === commentId)
    if (parentCommentIdx === -1) return
    if (comments.value[parentCommentIdx]?.replies)
      comments.value[parentCommentIdx]?.replies.push(rjson)
    else {
      comments.value[parentCommentIdx].replies = []
      comments.value[parentCommentIdx].replies.push(rjson) // A reply is added at the end of the list
    }
  }

  /**
   * Resolve comment
   * @param releaseId number
   * @param commentId number
   * @returns void
   */
  const resolveComment = async (releaseId: number, commentId: number) => {
    const r = await resolveReleaseComment({ releaseId, commentId })
    if (r.ok) {
      const commentIdx = comments.value.findIndex((c) => c.id === commentId)
      if (commentIdx === -1) return
      comments.value[commentIdx].status = 'resolved'
    } else {
      throw new Error((await r.json())?.message)
    }
  }

  /**
   * Reset comment i.e. resolve -> created
   * @param releaseId number
   * @param commentId number
   * @returns void
   */
  const resetComment = async (releaseId: number, commentId: number) => {
    const r = await resetReleaseComment({ releaseId, commentId })
    if (r.ok) {
      const commentIdx = comments.value.findIndex((c) => c.id === commentId)
      if (commentIdx === -1) return
      comments.value[commentIdx].status = 'created'
    } else {
      throw new Error((await r.json())?.message)
    }
  }

  /**
   * Add a comment to a release check
   * @param releaseId number
   * @param comment string
   * @param checkParams checkPayload
   * @returns
   */
  const AddCommentToAReleaseCheck = async (
    releaseId: number,
    comment: string,
    { checkId, chapterId, requirementId }: checkPayload,
  ) => {
    const r = await addCommentToRelease({
      releaseId,
      comment: {
        reference: {
          type: 'check',
          chapter: chapterId,
          requirement: requirementId,
          check: checkId,
        },
        content: comment,
        todo: true,
      },
    })
    if (!r.ok) {
      throw new Error((await r.json())?.message)
    }
    const rjson = (await r.json()) as ReleaseComment
    comments.value.unshift(rjson)
  }

  /**
   * Delete a comment
   * @param releaseId number
   * @param commentId number
   * @returns void
   */
  const deleteComment = async (releaseId: number, commentId: number) => {
    const r = await deleteReleaseComment({ releaseId, commentId })
    if (r.ok) {
      const commentIdx = comments.value.findIndex((c) => c.id === commentId)
      if (commentIdx === -1) return
      comments.value.splice(commentIdx, 1)
    } else {
      throw new Error((await r.json())?.message)
    }
  }

  /**
   * Deletes Reply
   * @param releaseId number
   * @param commentId number
   * @param parentComment number
   * @returns void
   */
  const deleteReply = async (
    releaseId: number,
    commentId: number,
    parentComment: number,
  ) => {
    const r = await deleteReleaseComment({ releaseId, commentId })
    if (r.ok) {
      const parentCommentIdx = comments.value.findIndex(
        (c) => c.id === parentComment,
      )
      if (parentCommentIdx === -1 || !comments.value[parentCommentIdx].replies)
        return
      const replyIdx = comments.value[parentCommentIdx].replies.findIndex(
        (r) => r.id === commentId,
      )
      if (replyIdx === -1) return
      comments.value[parentCommentIdx].replies.splice(replyIdx, 1)
    } else {
      throw new Error((await r.json())?.message)
    }
  }

  return {
    addCommentToARelease,
    AddCommentToAReleaseCheck,
    replyComment,
    resolveComment,
    resetComment,
    deleteComment,
    deleteReply,
  }
}

export default useReleaseComments
