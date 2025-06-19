"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Badge } from "../../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { Card, CardContent } from "../../ui/card"
import { Heart, MessageSquare, Share2, Calendar, MapPin, Tag, Package, Eye } from "lucide-react"

export default function PostDetailModal({ post, open, onOpenChange }) {
    if (!post) return null

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getAuthorTypeBadge = (type) => {
        return type === "User" ? (
            <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                Người dùng
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Shop
            </Badge>
        )
    }

    const getPrivacyBadge = (privacy) => {
        const colors = {
            public: "bg-green-100 text-green-800",
            friends: "bg-yellow-100 text-yellow-800",
            private: "bg-red-100 text-red-800",
        }
        const labels = {
            public: "Công khai",
            friends: "Bạn bè",
            private: "Riêng tư",
        }
        return (
            <Badge variant="secondary" className={colors[privacy]}>
                {labels[privacy]}
            </Badge>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-pink-600" />
                        Chi tiết bài viết
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Author Info */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={post.author?._id?.avatar || "/placeholder.svg"} />
                                    <AvatarFallback className="bg-pink-100 text-pink-600">
                                        {post.author?._id?.fullName?.[0] || post.author?._id?.name?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">
                                        {post.author?._id?.fullName || post.author?._id?.name || "Unknown"}
                                    </h3>
                                    <p className="text-sm text-gray-500">{post.author?._id?.email}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {getAuthorTypeBadge(post.author?.type)}
                                        {post.isSponsored && <Badge className="bg-yellow-100 text-yellow-800">Bài tài trợ</Badge>}
                                        {getPrivacyBadge(post.privacy)}
                                    </div>
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(post.createdAt)}
                                    </div>
                                    {post.location && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {post.location}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Nội dung bài viết</h4>
                            <div className="prose max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Media */}
                    {(post.images?.length > 0 || post.videos?.length > 0) && (
                        <Card className="border-pink-200">
                            <CardContent className="p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Media</h4>

                                {/* Images */}
                                {post.images?.length > 0 && (
                                    <div className="mb-4">
                                        <h5 className="text-sm font-medium text-gray-700 mb-2">Hình ảnh ({post.images.length})</h5>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {post.images.map((image, idx) => (
                                                <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                                    <img
                                                        src={image || "/placeholder.svg"}
                                                        alt={`Image ${idx + 1}`}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                                        onClick={() => window.open(image, "_blank")}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Videos */}
                                {post.videos?.length > 0 && (
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-700 mb-2">Video ({post.videos.length})</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {post.videos.map((video, idx) => (
                                                <div key={idx} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                                    <video src={video} controls className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Products */}
                    {post.productIds?.length > 0 && (
                        <Card className="border-pink-200">
                            <CardContent className="p-4">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Sản phẩm liên kết ({post.productIds.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {post.productIds.map((product) => (
                                        <div key={product._id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                {product.images?.[0] && (
                                                    <img
                                                        src={product.images[0] || "/placeholder.svg"}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-medium text-gray-900 truncate">{product.name}</h5>
                                                <p className="text-sm text-gray-500">{product.slug}</p>
                                                <p className="text-sm font-semibold text-pink-600">{product.price?.toLocaleString("vi-VN")}đ</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tags and Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Hashtags */}
                        {post.hashtags?.length > 0 && (
                            <Card className="border-pink-200">
                                <CardContent className="p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Tag className="w-4 h-4" />
                                        Hashtags
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {post.hashtags.map((tag, idx) => (
                                            <Badge key={idx} variant="outline" className="border-pink-200 text-pink-600">
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Tags */}
                        {post.tags?.length > 0 && (
                            <Card className="border-pink-200">
                                <CardContent className="p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {post.tags.map((tag, idx) => (
                                            <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-700">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Stats */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Thống kê tương tác</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-pink-50 rounded-lg">
                                    <Heart className="w-6 h-6 text-pink-600 mx-auto mb-1" />
                                    <p className="text-2xl font-bold text-pink-600">{post.likesCount || 0}</p>
                                    <p className="text-sm text-gray-600">Lượt thích</p>
                                </div>
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <MessageSquare className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                                    <p className="text-2xl font-bold text-blue-600">{post.commentsCount || 0}</p>
                                    <p className="text-sm text-gray-600">Bình luận</p>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <Share2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                    <p className="text-2xl font-bold text-green-600">{post.sharesCount || 0}</p>
                                    <p className="text-sm text-gray-600">Chia sẻ</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Analysis */}
                    {(post.aiScore || post.sentiment) && (
                        <Card className="border-pink-200">
                            <CardContent className="p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Phân tích AI</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {post.aiScore && (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Điểm AI</p>
                                            <p className="text-lg font-semibold text-purple-600">{post.aiScore}/100</p>
                                        </div>
                                    )}
                                    {post.sentiment && (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Cảm xúc</p>
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    post.sentiment === "positive"
                                                        ? "bg-green-100 text-green-800"
                                                        : post.sentiment === "negative"
                                                            ? "bg-red-100 text-red-800"
                                                            : "bg-gray-100 text-gray-800"
                                                }
                                            >
                                                {post.sentiment === "positive"
                                                    ? "Tích cực"
                                                    : post.sentiment === "negative"
                                                        ? "Tiêu cực"
                                                        : "Trung tính"}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
