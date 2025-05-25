import { Heart, MessageCircle, MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react"
import { useState, useEffect } from "react"
import { Textarea } from "../../components/ui/textarea"
import { Button } from '../../components/ui/button';
import { Badge } from "../../components/ui/badge"
import { useAuth } from "../../contexts/AuthContext"
import { cn } from "../../lib/utils"
import { likeComment, getCommentLikes } from "../../services/postInteractionService"
import { formatDistanceToNow, format } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"

export default function CommentItem({ data, onReply, nestLevel = 0, postId, onShowLikes }) {
  const { user, setShowLoginModal } = useAuth()
  const [isLiked, setIsLiked] = useState(data?.isLiked || false)
  const [likesCount, setLikesCount] = useState(data?.likeCount || 0)
  const [replyCount, setReplyCount] = useState(data?.replyCount || 0)
  const [showReply, setShowReply] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [isReplying, setIsReplying] = useState(false)

  const maxNestLevel = 3

  useEffect(() => {
    setIsLiked(data?.isLiked || false)
    setLikesCount(data?.likeCount || 0)
    setReplyCount(data?.replyCount || 0)
  }, [data])

  const handleLike = async () => {
    if (!user) return setShowLoginModal(true)
    try {
      const res = await likeComment(data._id)
      setIsLiked(res.data.isLiked)
      setLikesCount(res.data.totalLikes)
    } catch (err) {
      console.error("Lỗi khi like bình luận:", err)
      toast.error("Không thể thích bình luận")
    }
  }

  const handleShowLikes = async () => {
    if (!user) return setShowLoginModal(true)
    if (likesCount === 0) return

    try {
      const response = await getCommentLikes(data._id)
      const { likes } = response.data
      onShowLikes?.(data._id, likes)
    } catch (err) {
      console.error("Lỗi khi lấy danh sách like:", err)
      toast.error("Không thể tải danh sách like")
    }
  }

  const handleReplySubmit = async () => {
    if (!user) return setShowLoginModal(true)
    if (!replyText.trim()) return

    setIsReplying(true)
    try {
      // Logic xác định parentId cho các tầng khác nhau
      let actualParentId = data._id

      // Nếu đã ở tầng 3+, gửi về tầng 2 (để backend xử lý)
      if (nestLevel >= 2) {
        // Tìm parentId gốc (tầng 2) để gửi lên backend
        actualParentId = data.parentId || data._id
      }

      await onReply(actualParentId, {
        content: replyText,
        postId: postId,
        replyingTo: nestLevel >= 2 ? data._id : null, // Thông tin ai đang được reply
      })

      setReplyText("")
      setShowReply(false)
      setReplyCount((prev) => prev + 1)
    } catch (err) {
      console.error("Lỗi gửi phản hồi:", err)
    } finally {
      setIsReplying(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleReplySubmit()
    }
  }

  // ✅ Cải thiện logic CSS cho từng tầng
  const getMarginClass = () => {
    if (nestLevel === 0) return ""
    if (nestLevel === 1) return "ml-8 border-l-2 border-blue-300 pl-4"
    if (nestLevel === 2) return "ml-12 border-l-2 border-blue-200 pl-4 bg-gray-25 rounded-lg p-2"
    return "ml-16 border-l-2 border-blue-100 pl-4 bg-blue-25 rounded-lg p-2" // Tầng 3+
  }

  const isLevel1 = nestLevel === 0
  const isLevel2 = nestLevel === 1
  const isLevel3Plus = nestLevel >= 2
  const isLevel4Plus = nestLevel >= 3

  // ✅ Kiểm tra có thông tin "replyingToName" không
  const hasReplyingInfo = data.replyingToName && data.replyingToName.trim() !== ""

  return (
    <div className={cn("space-y-3", getMarginClass())}>
      <div className="flex gap-3">
        {/* Avatar */}
        <img
          src={data.author?._id?.avatar || "/placeholder.svg?height=32&width=32"}
          alt="Commenter avatar"
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
        />

        <div className="flex-1 min-w-0">
          {/* Comment Content */}
          <div className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-gray-900">
                {data.author?.type === "User" ? data.author?._id?.fullName : data.author?._id?.name || "Người dùng"}
              </span>
              {data.author?.type === "Shop" && (
                <Badge variant="secondary" className="text-xs">
                  Shop
                </Badge>
              )}
              {isLevel3Plus && (
                <Badge variant="outline" className="text-xs text-blue-600">
                  {hasReplyingInfo ? `Trả lời ${data.replyingToName}` : "Phản hồi"}
                </Badge>
              )}
            </div>

            {/* ✅ Hiển thị thông tin "Đang trả lời..." cho tầng 3+ */}
            {isLevel3Plus && hasReplyingInfo && (
              <div className="text-xs text-blue-600 mb-1 font-medium">
                💬 Đang trả lời <span className="font-semibold">{data.replyingToName}</span>
              </div>
            )}

            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{data.text}</p>
          </div>

          {/* Interaction Bar */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span
              className="cursor-pointer hover:text-gray-700 transition-colors"
              title={format(new Date(data.createdAt), "EEEE, dd 'tháng' MM, yyyy 'lúc' HH:mm", { locale: vi })}
            >
              {formatDistanceToNow(new Date(data.createdAt), { addSuffix: true, locale: vi }).replace(/^khoảng /, "")}
            </span>

            {/* Like Button */}
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1 hover:text-red-500 transition-colors font-medium",
                isLiked && "text-red-500",
              )}
            >
              <Heart className={cn("w-3 h-3", isLiked && "fill-red-500")} />
              {isLiked ? "Đã thích" : "Thích"}
            </button>

            {/* Likes Count */}
            {likesCount > 0 && (
              <button
                onClick={handleShowLikes}
                className="hover:text-blue-500 transition-colors hover:underline font-medium"
              >
                {likesCount} lượt thích
              </button>
            )}

            {/* Reply Button */}
            <button
              onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1 hover:text-blue-500 transition-colors font-medium"
            >
              <MessageCircle className="w-3 h-3" />
              Trả lời
            </button>

            {/* ✅ Show Replies Button - cho tầng 1 và tầng 2 */}
            {(isLevel1 || isLevel2) && replyCount > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 hover:text-blue-500 transition-colors font-medium"
              >
                {showReplies ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Ẩn {replyCount} phản hồi
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Xem {replyCount} phản hồi
                  </>
                )}
              </button>
            )}

            {/* Reply Count for level 3+ (chỉ hiển thị số, không có nút) */}
            {isLevel3Plus && replyCount > 0 && <span className="text-blue-600 font-medium">{replyCount} phản hồi</span>}
          </div>

          {/* Reply Input */}
          {showReply && (
            <div className="mt-3 flex gap-2">
              <img
                src={user?.avatar || "/placeholder.svg?height=24&width=24"}
                alt="Your avatar"
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <Textarea
                  placeholder={`Trả lời ${data.author?.type === "User" ? data.author?._id?.fullName : data.author?._id?.name}... (Ctrl+Enter để gửi)`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="min-h-[60px] resize-none text-sm border-gray-200 focus:border-blue-300"
                  disabled={isReplying}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReply(false)
                      setReplyText("")
                    }}
                    disabled={isReplying}
                  >
                    Hủy
                  </Button>
                  <Button size="sm" onClick={handleReplySubmit} disabled={!replyText.trim() || isReplying}>
                    {isReplying ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        Đang gửi...
                      </>
                    ) : (
                      "Trả lời"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ✅ Replies - hiển thị cho tầng 1 và tầng 2 */}
          {(isLevel1 || isLevel2) && showReplies && data.replies && data.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {data.replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  data={reply}
                  onReply={onReply}
                  nestLevel={nestLevel + 1}
                  postId={postId}
                  onShowLikes={onShowLikes}
                />
              ))}
            </div>
          )}
        </div>

        {/* More Options */}
        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}