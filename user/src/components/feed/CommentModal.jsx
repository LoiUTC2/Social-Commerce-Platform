import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Textarea } from "../../components/ui/textarea"
import { Button } from "../../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { MessageCircle, Send, Users, TrendingUp, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import CommentItem from "./CommentItem"
import LikesListModal from "./LikesListModal"
import { commentOrReply, getCommentsByPost } from "../../services/postInteractionService"
import { toast } from "sonner"

export default function CommentModal({ open, onClose, postId }) {
  const { user, setShowLoginModal } = useAuth()
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState([])
  const [sortType, setSortType] = useState("newest")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalComments, setTotalComments] = useState(0)

  // Likes modal state
  const [likesModal, setLikesModal] = useState({
    open: false,
    commentId: null,
    likes: [],
    title: "Những người đã thích bình luận",
  })

  const sortOptions = [
    { value: "newest", label: "Mới nhất", icon: Clock },
    { value: "oldest", label: "Cũ nhất", icon: Clock },
    { value: "top", label: "Phổ biến", icon: TrendingUp },
  ]

  useEffect(() => {
    if (open) {
      setPage(1)
      fetchComments(1, true)
    } else {
      // Reset state when modal closes
      setComments([])
      setComment("")
      setPage(1)
      setHasMore(true)
    }
  }, [open, postId, sortType])

  const fetchComments = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true)
      const response = await getCommentsByPost(postId, sortType, pageNum, 5)
      const { comments: newComments, pagination } = response.data

      // ✅ Debug log để kiểm tra cấu trúc dữ liệu
      console.log("Fetched comments structure:", newComments)

      if (reset || pageNum === 1) {
        setComments(newComments)
      } else {
        setComments((prev) => [...prev, ...newComments])
      }

      setPage(pageNum)
      setHasMore(pageNum < pagination.totalPages)
      setTotalComments(pagination.totalComments || newComments.length)
    } catch (err) {
      console.error("Lỗi khi tải bình luận:", err)
      toast.error("Không thể tải bình luận")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }

    if (!comment.trim()) return

    setIsSubmitting(true)
    try {
      const res = await commentOrReply(postId, comment)
      if (res.data.comment) {
        const newComment = {
          ...res.data.comment,
          author: {
            type: user.role === "seller" ? "Shop" : "User",
            _id: {
              _id: user._id,
              fullName: user.fullName,
              avatar: user.avatar,
              name: user.role === "seller" ? user.shopName || user.fullName : undefined,
            },
          },
          replies: [],
          isLiked: false,
          likeCount: 0,
          replyCount: 0,
        }
        setComments((prev) => [newComment, ...prev])
        setComment("")
        setTotalComments((prev) => prev + 1)
        toast.success("Đã đăng bình luận")
      }
    } catch (err) {
      console.error("Lỗi gửi bình luận:", err)
      toast.error("Không thể đăng bình luận")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ✅ Cải thiện hàm handleReply để xử lý tầng 3+
  const handleReply = async (parentId, replyData) => {
    if (!user) return setShowLoginModal(true)

    try {
      const res = await commentOrReply(postId, replyData.content, parentId)
      if (res.data.comment) {
        const newReply = {
          ...res.data.comment,
          author: {
            type: user.role === "seller" ? "Shop" : "User",
            _id: {
              _id: user._id,
              fullName: user.fullName,
              avatar: user.avatar,
              name: user.role === "seller" ? user.shopName || user.fullName : undefined,
            },
          },
          isLiked: false,
          likeCount: 0,
          replyCount: 0,
          // ✅ Thêm thông tin replyingToName nếu có
          replyingToName: replyData.replyingTo ? getCommentAuthorName(replyData.replyingTo) : null,
        }

        const updatedComments = updateCommentTree(comments, parentId, newReply)
        setComments(updatedComments)
        toast.success("Đã trả lời bình luận")
      }
    } catch (err) {
      console.error("Lỗi gửi phản hồi:", err)
      toast.error("Không thể gửi phản hồi")
    }
  }

  // ✅ Hàm tìm tên tác giả comment
  const getCommentAuthorName = (commentId) => {
    const findAuthor = (commentList) => {
      for (const comment of commentList) {
        if (comment._id === commentId) {
          return comment.author.type === "User" ? comment.author._id.fullName : comment.author._id.name
        }
        if (comment.replies?.length) {
          const found = findAuthor(comment.replies)
          if (found) return found
        }
      }
      return null
    }

    return findAuthor(comments) || "Người dùng"
  }

  // ✅ Cải thiện hàm updateCommentTree để xử lý đệ quy tốt hơn
  const updateCommentTree = (comments, parentId, newReply) => {
    return comments.map((comment) => {
      if (comment._id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply],
          replyCount: (comment.replyCount || 0) + 1,
        }
      }

      if (comment.replies && comment.replies.length > 0) {
        const updatedReplies = updateCommentTree(comment.replies, parentId, newReply)
        // Kiểm tra xem có thay đổi gì không
        if (updatedReplies !== comment.replies) {
          return {
            ...comment,
            replies: updatedReplies,
          }
        }
      }

      return comment
    })
  }

  const handleShowCommentLikes = (commentId, likes) => {
    setLikesModal({
      open: true,
      commentId,
      likes,
      title: "Những người đã thích bình luận",
    })
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmit()
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-white rounded-xl shadow-xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <span>Bình luận</span>
                <p className="text-sm font-normal text-gray-500 mt-1">
                  {totalComments > 0 ? `${totalComments} bình luận` : "Chưa có bình luận"}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Sort Options */}
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Sắp xếp theo:</span>
            </div>
            <Select value={sortType} onValueChange={setSortType}>
              <SelectTrigger className="w-40 h-9 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => {
                  const IconComponent = opt.icon
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
            {loading && comments.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có bình luận nào</h3>
                <p className="text-gray-500">Hãy là người đầu tiên bình luận về bài viết này!</p>
              </div>
            ) : (
              <>
                {comments.map((comment) => (
                  <CommentItem
                    key={comment._id}
                    data={comment}
                    onReply={handleReply}
                    nestLevel={0}
                    postId={postId}
                    onShowLikes={handleShowCommentLikes}
                  />
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => fetchComments(page + 1)}
                      disabled={loading}
                      className="hover:bg-gray-50"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          Đang tải...
                        </>
                      ) : (
                        "Xem thêm bình luận"
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Comment Input */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex gap-3">
              <img
                src={user?.avatar || "/placeholder.svg?height=40&width=40"}
                alt="Your avatar"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
              />
              <div className="flex-1">
                <Textarea
                  placeholder="Viết bình luận của bạn... (Ctrl+Enter để gửi)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="min-h-[80px] resize-none border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-center mt-3">
                  <p className="text-xs text-gray-500">
                    Nhấn <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Enter</kbd> để gửi nhanh
                  </p>
                  <Button
                    onClick={handleSubmit}
                    disabled={!comment.trim() || isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Đăng bình luận
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Likes Modal */}
      <LikesListModal
        open={likesModal.open}
        onOpenChange={(open) => setLikesModal({ ...likesModal, open })}
        likes={likesModal.likes}
        title={likesModal.title}
        emptyMessage="Chưa có ai thích bình luận này"
      />
    </>
  )
}