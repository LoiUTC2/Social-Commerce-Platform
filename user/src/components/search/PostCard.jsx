"use client"

import { Heart, MessageCircle, Share2, ShoppingCart } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import HashtagDisplay from "./HashtagDisplay"

const PostCard = ({ post, onPostClick, onLike, onComment, onShare }) => {
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
        if (num >= 1000) return (num / 1000).toFixed(1) + "K"
        return num.toString()
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

        if (diffInHours < 1) return "Vừa xong"
        if (diffInHours < 24) return `${diffInHours} giờ trước`
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} ngày trước`
        return date.toLocaleDateString("vi-VN")
    }

    const handleClick = () => {
        if (onPostClick) {
            onPostClick(post)
        }
    }

    const handleLike = (e) => {
        e.stopPropagation()
        if (onLike) {
            onLike(post)
        }
    }

    const handleComment = (e) => {
        e.stopPropagation()
        if (onComment) {
            onComment(post)
        }
    }

    const handleShare = (e) => {
        e.stopPropagation()
        if (onShare) {
            onShare(post)
        }
    }

    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleClick}>
            <CardContent className="p-6">
                <div className="flex items-start gap-3">
                    <Avatar>
                        <AvatarImage src={post.author?._id?.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{post.author?._id?.fullName?.[0] || post.author?._id?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">
                                {post.author?._id?.fullName || post.author?._id?.name || "Người dùng"}
                            </span>
                            {post.author?.type === "Shop" && (
                                <Badge variant="secondary" className="text-xs">
                                    Shop
                                </Badge>
                            )}
                            <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                        </div>

                        <p className="mb-3 line-clamp-3" title={post.content}>
                            {post.content}
                        </p>

                        {post.images?.length > 0 && (
                            <div className="mb-3 grid grid-cols-2 gap-2">
                                {post.images.slice(0, 4).map((image, index) => (
                                    <img
                                        key={index}
                                        src={image || "/placeholder.svg?height=150&width=200"}
                                        alt={`Post image ${index + 1}`}
                                        className="rounded-lg object-cover h-32 w-full"
                                        // onError={(e) => {
                                        //     e.target.src = "/placeholder.svg?height=150&width=200&text=No+Image"
                                        // }}
                                    />
                                ))}
                                {post.images.length > 4 && (
                                    <div className="rounded-lg bg-gray-100 h-32 flex items-center justify-center text-gray-500 text-sm">
                                        +{post.images.length - 4} ảnh
                                    </div>
                                )}
                            </div>
                        )}

                        {post.productIds?.length > 0 && (
                            <div className="mb-3">
                                <Badge variant="outline" className="text-xs">
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    {post.productIds.length} sản phẩm
                                </Badge>
                            </div>
                        )}

                        {post.hashtags && post.hashtags.length > 0 && (
                            <div className="mb-3">
                                <HashtagDisplay hashtags={post.hashtags} limit={5} size="xs" />
                            </div>
                        )}

                        <div className="flex items-center gap-6 text-sm text-gray-600">
                            <button
                                className="flex items-center gap-1 hover:text-red-500 transition-colors"
                                onClick={handleLike}
                                title="Thích bài viết"
                            >
                                <Heart className="h-4 w-4" />
                                {formatNumber(post.likesCount || 0)}
                            </button>
                            <button
                                className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                                onClick={handleComment}
                                title="Bình luận"
                            >
                                <MessageCircle className="h-4 w-4" />
                                {formatNumber(post.commentsCount || 0)}
                            </button>
                            <button
                                className="flex items-center gap-1 hover:text-green-500 transition-colors"
                                onClick={handleShare}
                                title="Chia sẻ"
                            >
                                <Share2 className="h-4 w-4" />
                                {formatNumber(post.sharesCount || 0)}
                            </button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default PostCard
