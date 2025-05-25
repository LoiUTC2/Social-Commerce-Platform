"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Textarea } from "../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Heart, MessageCircle, MoreHorizontal, Send, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "../../components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { getCommentsByPost, commentOrReply, likeComment, getCommentLikes } from "../../services/postInteractionService"
import { useAuth } from "../../contexts/AuthContext"
import { toast } from "sonner"
import LikesListModal from "./LikesListModal"

export default function CommentSection({ postId, commentsCount = 0, onCommentsCountChange }) {
    const { user, setShowLoginModal } = useAuth()

    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [loading, setLoading] = useState(false)
    const [sortBy, setSortBy] = useState("newest")
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [replyingTo, setReplyingTo] = useState(null)
    const [replyText, setReplyText] = useState("")
    const [expandedReplies, setExpandedReplies] = useState(new Set())
    const [expandedLevel2Replies, setExpandedLevel2Replies] = useState(new Set())

    // Modal states for comment likes
    const [likesModal, setLikesModal] = useState({
        open: false,
        commentId: null,
        likes: [],
        title: "Những người đã thích bình luận",
    })

    useEffect(() => {
        setPage(1)
        setHasMore(true)
        fetchComments(1, true)
    }, [postId, sortBy])

    const fetchComments = async (pageNum = 1, reset = false) => {
        try {
            setLoading(true)
            const response = await getCommentsByPost(postId, sortBy, pageNum, 5)
            const { comments: newComments, pagination } = response.data

            // Debug: Log dữ liệu nhận được
            console.log("Fetched comments:", newComments)

            if (reset || pageNum === 1) {
                setComments(newComments) // Reset comments
            } else {
                setComments((prev) => [...prev, ...newComments]) // Append comments
            }

            setPage(pageNum) // ✅ Cập nhật page state
            setHasMore(pageNum < pagination.totalPages)
        } catch (err) {
            console.error("Lỗi khi tải bình luận:", err)
            toast.error("Không thể tải bình luận")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitComment = async () => {
        if (!user) return setShowLoginModal(true)
        if (!newComment.trim()) return

        try {
            const response = await commentOrReply(postId, newComment)
            const { comment, commentsCount: newCount } = response.data

            // Add new comment to the top
            const newCommentData = {
                ...comment,
                author: {
                    type: user?.role === "seller" ? "Shop" : "User",
                    _id: {
                        fullName: user?.fullName,
                        name: user?.shopName || user?.fullName,
                        avatar: user?.avatar,
                    },
                },
                isLiked: false,
                likeCount: 0,
                replyCount: 0,
                replies: [],
            }

            setComments((prev) => [newCommentData, ...prev])
            setNewComment("")
            onCommentsCountChange?.(newCount)
            toast.success("Đã đăng bình luận")
        } catch (err) {
            console.error("Lỗi khi đăng bình luận:", err)
            toast.error("Không thể đăng bình luận")
        }
    }

    const handleSubmitReply = async (parentId, level = 2, originalParentId = null) => {
        if (!user) return setShowLoginModal(true)
        if (!replyText.trim()) return

        try {
            // Đối với tầng 4+, sử dụng parentId của tầng 2
            const actualParentId = level >= 4 ? originalParentId : parentId

            const response = await commentOrReply(postId, replyText, actualParentId)
            const { comment } = response.data

            const newReply = {
                ...comment,
                author: {
                    type: user?.role === "seller" ? "Shop" : "User",
                    _id: {
                        fullName: user?.fullName,
                        name: user?.shopName || user?.fullName,
                        avatar: user?.avatar,
                    },
                },
                isLiked: false,
                likeCount: 0,
                replyCount: 0,
                replies: [],
                // Thêm thông tin về ai đang được trả lời cho tầng 4+
                replyingToName: level >= 4 ? getCommentAuthorName(parentId) : null,
                replyingToId: level >= 4 ? parentId : null,
            }

            // Logic cập nhật comments dựa trên level
            setComments((prev) =>
                prev.map((c) => {
                    if (level === 2 && c._id === parentId) {
                        // Trả lời trực tiếp tầng 1
                        return {
                            ...c,
                            replies: [...(c.replies || []), newReply],
                            replyCount: c.replyCount + 1,
                        }
                    } else if (level >= 3) {
                        // Trả lời tầng 2 hoặc cao hơn
                        const targetParentId = level >= 4 ? originalParentId : parentId

                        // Tìm comment tầng 1 chứa reply được trả lời
                        const hasTargetReply = c.replies?.some((r) => r._id === targetParentId)

                        if (hasTargetReply) {
                            const updatedReplies = c.replies.map((r) => {
                                if (r._id === targetParentId) {
                                    return {
                                        ...r,
                                        replyCount: (r.replyCount || 0) + 1,
                                    }
                                }
                                return r
                            })

                            return {
                                ...c,
                                replies: c.replies.map((r) => {
                                    if (r._id === targetParentId) {
                                        return {
                                            ...r,
                                            replyCount: (r.replyCount || 0) + 1,
                                            replies: [...(r.replies || []), newReply], // ✅ Nhét đúng vào replies
                                        }
                                    }
                                    return r
                                }),
                            }
                        }
                    }
                    return c
                }),
            )

            setReplyText("")
            setReplyingTo(null)
            toast.success("Đã trả lời bình luận")
        } catch (err) {
            console.error("Lỗi khi trả lời:", err)
            toast.error("Không thể trả lời bình luận")
        }
    }

    const handleLikeComment = async (commentId, level = 1, parentId = null) => {
        if (!user) return setShowLoginModal(true)

        try {
            const response = await likeComment(commentId)
            const { totalLikes, isLiked } = response.data

            setComments((prev) =>
                prev.map((c) => {
                    if (level === 1 && c._id === commentId) {
                        // Like level 1 comment
                        return { ...c, isLiked, likeCount: totalLikes }
                    } else if (level >= 2) {
                        // Like level 2 or 3 comment
                        return {
                            ...c,
                            replies: c.replies.map((r) => (r._id === commentId ? { ...r, isLiked, likeCount: totalLikes } : r)),
                        }
                    }
                    return c
                }),
            )
        } catch (err) {
            console.error("Lỗi khi thích bình luận:", err)
            toast.error("Không thể thích bình luận")
        }
    }

    const handleShowCommentLikes = async (commentId) => {
        if (!user) return setShowLoginModal(true)

        try {
            const response = await getCommentLikes(commentId)
            const { likes } = response.data
            setLikesModal({
                open: true,
                commentId,
                likes,
                title: "Những người đã thích bình luận",
            })
        } catch (err) {
            console.error("Lỗi khi lấy danh sách like:", err)
            toast.error("Không thể tải danh sách like")
        }
    }

    const toggleReplies = (commentId) => {
        console.log("Toggle replies for comment:", commentId)
        setExpandedReplies((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(commentId)) {
                newSet.delete(commentId)
            } else {
                newSet.add(commentId)
            }
            console.log("New expanded replies:", newSet)
            return newSet
        })
    }

    const toggleLevel2Replies = (commentId) => {
        console.log("Toggle level 2 replies for comment:", commentId)
        setExpandedLevel2Replies((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(commentId)) {
                newSet.delete(commentId)
            } else {
                newSet.add(commentId)
            }
            console.log("New expanded level 2 replies:", newSet)
            return newSet
        })
    }

    const getCommentAuthorName = (commentId) => {
        const findAuthor = (commentList) => {
            for (const comment of commentList) {
                if (comment._id === commentId) {
                    return comment.author.type === "User"
                        ? comment.author._id.fullName
                        : comment.author._id.name
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


    // Hàm phân loại replies theo tầng
    const categorizeReplies = (replies, level1CommentId) => {
        const level2Replies = []
        const level3PlusReplies = []

        replies.forEach((reply) => {
            // Tầng 2: parentId trỏ đến comment tầng 1
            if (reply.parentId === level1CommentId) {
                level2Replies.push(reply)
            } else {
                // Tầng 3+: parentId trỏ đến reply tầng 2
                level3PlusReplies.push(reply)
            }
        })

        return { level2Replies, level3PlusReplies }
    }

    const renderComment = (comment, level = 1, parentId = null, allReplies = [], originalParentId = null) => {
        // Debug log
        console.log("Rendering comment:", {
            id: comment._id,
            level,
            text: comment.text?.substring(0, 20),
            repliesCount: comment.replies?.length || 0,
            replyCount: comment.replyCount,
            expanded: level === 1 ? expandedReplies.has(comment._id) : expandedLevel2Replies.has(comment._id),
        })

        // Xác định level thực tế
        let actualLevel = level
        if (level > 1) {
            // Kiểm tra xem có phải là tầng 3+ không
            if (level === 2) {
                actualLevel = 2
            } else if (level >= 3) {
                actualLevel = level
            }
        }

        const isLevel2 = actualLevel === 2
        const isLevel3Plus = actualLevel >= 3
        const isLevel4Plus = actualLevel >= 4

        // CSS classes cho từng level
        let containerClass = ""
        if (isLevel2) {
            containerClass = "ml-8 border-l-2 border-blue-300 pl-4"
        } else if (isLevel3Plus) {
            containerClass = "ml-16 border-l-2 border-blue-200 pl-4"
            if (isLevel4Plus) {
                containerClass += " bg-blue-25 rounded-lg p-2"
            } else {
                containerClass += " bg-gray-25 rounded-lg p-2"
            }
        }

        return (
            <div key={comment._id} className={containerClass}>
                <div className="flex gap-3">
                    <img
                        src={comment.author._id.avatar || "/placeholder.svg?height=32&width=32"}
                        alt="Commenter avatar"
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                    {comment.author.type === "User" ? comment.author._id.fullName : comment.author._id.name}
                                </span>
                                {comment.author.type === "Shop" && (
                                    <Badge variant="secondary" className="text-xs">
                                        Shop
                                    </Badge>
                                )}
                                {isLevel3Plus && (
                                    <Badge variant="outline" className="text-xs text-blue-600">
                                        {isLevel4Plus ? `Trả lời ${comment.replyingToName || ""}` : "Phản hồi"}
                                    </Badge>
                                )}
                            </div>
                            {/* Hiển thị thông tin trả lời cho tầng 4+ */}
                            {isLevel4Plus && comment.replyingToName && (
                                <div className="text-xs text-blue-600 mb-1">
                                    Đang trả lời <span className="font-medium">{comment.replyingToName}</span>
                                </div>
                            )}
                            <p className="text-sm text-gray-900">{comment.text}</p>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}</span>

                            {/* Like button */}
                            <button
                                className={`flex items-center gap-1 hover:text-red-500 transition-colors ${comment.isLiked ? "text-red-500" : ""}`}
                                onClick={() => handleLikeComment(comment._id, actualLevel, parentId)}
                            >
                                <Heart className={`w-3 h-3 ${comment.isLiked ? "fill-red-500" : ""}`} />
                                {comment.likeCount > 0 && (
                                    <span
                                        className="cursor-pointer hover:underline"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleShowCommentLikes(comment._id)
                                        }}
                                    >
                                        {comment.likeCount}
                                    </span>
                                )}
                            </button>

                            {/* Reply button */}
                            <button
                                className="hover:text-blue-500 transition-colors"
                                onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                            >
                                Trả lời
                            </button>

                            {/* Show replies button cho tầng 1 */}
                            {level === 1 && comment.replyCount > 0 && (
                                <button
                                    className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                                    onClick={() => toggleReplies(comment._id)}
                                >
                                    {expandedReplies.has(comment._id) ? (
                                        <>
                                            <ChevronUp className="w-3 h-3" />
                                            Ẩn {comment.replyCount} phản hồi
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-3 h-3" />
                                            Xem {comment.replyCount} phản hồi
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Show replies button cho tầng 2 */}
                            {isLevel2 && comment.replyCount > 0 && (
                                <button
                                    className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                                    onClick={() => toggleLevel2Replies(comment._id)}
                                >
                                    {expandedLevel2Replies.has(comment._id) ? (
                                        <>
                                            <ChevronUp className="w-3 h-3" />
                                            Ẩn {comment.replyCount} phản hồi
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-3 h-3" />
                                            Xem {comment.replyCount} phản hồi
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Hiển thị số phản hồi cho tầng 3+ */}
                            {isLevel3Plus && comment.replyCount > 0 && (
                                <span className="text-blue-600">{comment.replyCount} phản hồi</span>
                            )}
                        </div>

                        {/* Reply Input */}
                        {replyingTo === comment._id && (
                            <div className="mt-3 flex gap-2">
                                <img
                                    src={user?.avatar || "/placeholder.svg?height=24&width=24"}
                                    alt="Your avatar"
                                    className="w-6 h-6 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <Textarea
                                        placeholder={`Trả lời ${comment.author.type === "User" ? comment.author._id.fullName : comment.author._id.name}...`}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        className="min-h-[60px] resize-none text-sm"
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setReplyingTo(null)
                                                setReplyText("")
                                            }}
                                        >
                                            Hủy
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                handleSubmitReply(
                                                    comment._id,
                                                    actualLevel + 1,
                                                    actualLevel >= 3 ? originalParentId || parentId : null,
                                                )
                                            }
                                            disabled={!replyText.trim()}
                                        >
                                            Trả lời
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Replies cho tầng 1 */}
                        {level === 1 && expandedReplies.has(comment._id) && comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 space-y-3">
                                {comment.replies.map((replyLv2) => (
                                    <div key={replyLv2._id}>
                                        {renderComment(replyLv2, 2, comment._id, comment.replies, comment._id)}
                                        {expandedLevel2Replies.has(replyLv2._id) && replyLv2.replies?.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                {replyLv2.replies.map((replyLv3Plus) =>
                                                    renderComment(replyLv3Plus, 3, replyLv2._id, replyLv2.replies, replyLv2._id)
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                        <MoreHorizontal className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <>
            <Card>
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg">Bình luận ({commentsCount || 0})</h3>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Mới nhất</SelectItem>
                                <SelectItem value="oldest">Cũ nhất</SelectItem>
                                <SelectItem value="top">Phổ biến</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Comment Input */}
                    <div className="mb-6">
                        <div className="flex gap-3">
                            <img
                                src={user?.avatar || "/placeholder.svg?height=40&width=40"}
                                alt="Your avatar"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1">
                                <Textarea
                                    placeholder="Viết bình luận..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="min-h-[80px] resize-none"
                                />
                                <div className="flex justify-end mt-2">
                                    <Button onClick={handleSubmitComment} disabled={!newComment.trim() || loading}>
                                        <Send className="w-4 h-4 mr-2" />
                                        Đăng bình luận
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4">{comments.map((comment) => renderComment(comment))}</div>

                    {/* Load More */}
                    {hasMore && (
                        <div className="text-center mt-6">
                            <Button variant="outline" onClick={() => fetchComments(page + 1, false)} disabled={loading}>
                                {loading ? "Đang tải..." : "Xem thêm bình luận"}
                            </Button>
                        </div>
                    )}

                    {comments.length === 0 && !loading && (
                        <div className="text-center py-8 text-gray-500">
                            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Comment Likes Modal - Reusing LikesListModal */}
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
