"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Badge } from "../../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import {
    Store,
    User,
    Mail,
    Phone,
    Calendar,
    Star,
    Package,
    Users,
    TrendingUp,
    Eye,
    MessageSquare,
    Heart,
    Shield,
} from "lucide-react"
import { getShopDetails } from "../../../services/shopService"

export default function ShopDetailModal({ shop, open, onOpenChange }) {
    const [shopDetails, setShopDetails] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (shop && open) {
            loadShopDetails()
        }
    }, [shop, open])

    const loadShopDetails = async () => {
        try {
            setLoading(true)
            const response = await getShopDetails(shop._id)
            if (response.success) {
                setShopDetails(response.data)
            }
        } catch (error) {
            console.error("Error loading shop details:", error)
        } finally {
            setLoading(false)
        }
    }

    if (!shop) return null

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getStatusBadge = (shop) => {
        if (!shop.status?.isActive) {
            return (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Tạm dừng
                </Badge>
            )
        }
        if (!shop.status?.isApprovedCreate) {
            return (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Chờ duyệt
                </Badge>
            )
        }
        return (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
                Hoạt động
            </Badge>
        )
    }

    const getFeatureLevelBadge = (level) => {
        const colors = {
            normal: "bg-gray-100 text-gray-800",
            premium: "bg-blue-100 text-blue-800",
            vip: "bg-purple-100 text-purple-800",
        }
        const labels = {
            normal: "Normal",
            premium: "Premium",
            vip: "VIP",
        }
        return (
            <Badge variant="secondary" className={colors[level]}>
                {labels[level]}
            </Badge>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-pink-600" />
                        Chi tiết Shop
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <Card className="border-pink-200">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-6">
                                    <div className="flex flex-col items-center gap-2">
                                        <Avatar className="w-20 h-20">
                                            <AvatarImage src={shop.avatar || "/placeholder.svg"} />
                                            <AvatarFallback className="bg-pink-100 text-pink-600 text-xl">
                                                {shop.name?.[0] || "S"}
                                            </AvatarFallback>
                                        </Avatar>
                                        {shop.logo && (
                                            <Avatar className="w-16 h-16">
                                                <AvatarImage src={shop.logo || "/placeholder.svg"} />
                                                <AvatarFallback>Logo</AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">{shop.name || "Chưa có tên"}</h3>
                                            <p className="text-gray-500">@{shop.slug}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                {getStatusBadge(shop)}
                                                {getFeatureLevelBadge(shop.status?.featureLevel || "normal")}
                                                {shop.status?.isApprovedCreate && (
                                                    <Badge variant="outline" className="border-green-200 text-green-600">
                                                        Đã duyệt
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span>Tạo ngày {formatDate(shop.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Eye className="w-4 h-4 text-gray-400" />
                                                <span>{shop.stats?.views || 0} lượt xem</span>
                                            </div>
                                            {shop.contact?.phone && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    <span>{shop.contact.phone}</span>
                                                </div>
                                            )}
                                            {shop.contact?.email && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <span>{shop.contact.email}</span>
                                                </div>
                                            )}
                                        </div>

                                        {shop.description && (
                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-2">Mô tả</h4>
                                                <p className="text-gray-600 text-sm">{shop.description}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Owner Info */}
                        <Card className="border-pink-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-purple-600" />
                                    Thông tin chủ shop
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={shop.owner?.avatar || "/placeholder.svg"} />
                                        <AvatarFallback className="bg-purple-100 text-purple-600">
                                            {shop.owner?.fullName?.[0] || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-semibold">{shop.owner?.fullName || "Unknown"}</h4>
                                        <p className="text-sm text-gray-500">{shop.owner?.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge
                                                variant="secondary"
                                                className={shop.owner?.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                            >
                                                {shop.owner?.isActive ? "Hoạt động" : "Không hoạt động"}
                                            </Badge>
                                            {shop.owner?.roles?.map((role, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                    {role}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {shop.owner?.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{shop.owner.phone}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>Tham gia {formatDate(shop.owner?.createdAt)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-pink-200">
                                <CardHeader>
                                    <CardTitle className="text-lg">Thống kê tổng quan</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-pink-50 rounded-lg">
                                            <Star className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                                            <p className="text-2xl font-bold text-yellow-600">
                                                {shop.stats?.rating?.avg?.toFixed(1) || "0.0"}
                                            </p>
                                            <p className="text-sm text-gray-600">Đánh giá ({shop.stats?.rating?.count || 0})</p>
                                        </div>
                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                            <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                                            <p className="text-2xl font-bold text-blue-600">{shop.stats?.followers?.length || 0}</p>
                                            <p className="text-sm text-gray-600">Followers</p>
                                        </div>
                                        <div className="text-center p-3 bg-green-50 rounded-lg">
                                            <Package className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                            <p className="text-2xl font-bold text-green-600">{shop.stats?.orderCount || 0}</p>
                                            <p className="text-sm text-gray-600">Đơn hàng</p>
                                        </div>
                                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                                            <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                                            <p className="text-2xl font-bold text-purple-600">
                                                {shop.stats?.revenue?.toLocaleString("vi-VN") || "0"}đ
                                            </p>
                                            <p className="text-sm text-gray-600">Doanh thu</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-pink-200">
                                <CardHeader>
                                    <CardTitle className="text-lg">Hoạt động</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Sản phẩm:</span>
                                            <span className="font-medium">{shopDetails?.statistics?.products?.totalProducts || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Sản phẩm hoạt động:</span>
                                            <span className="font-medium">{shopDetails?.statistics?.products?.activeProducts || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Bài viết:</span>
                                            <span className="font-medium">{shopDetails?.statistics?.posts?.totalPosts || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tổng lượt thích:</span>
                                            <span className="font-medium">{shopDetails?.statistics?.posts?.totalLikes || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tuổi tài khoản:</span>
                                            <span className="font-medium">{shopDetails?.metadata?.accountAge || 0} ngày</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Độ hoàn thiện:</span>
                                            <span className="font-medium">{shopDetails?.metadata?.completenessScore || 0}%</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Business Info */}
                        {shop.businessInfo && (
                            <Card className="border-pink-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-gray-600" />
                                        Thông tin doanh nghiệp
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {shop.businessInfo.businessLicense && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Giấy phép kinh doanh:</span>
                                            <span className="font-medium">{shop.businessInfo.businessLicense}</span>
                                        </div>
                                    )}
                                    {shop.businessInfo.taxIdentificationNumber && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Mã số thuế:</span>
                                            <span className="font-medium">{shop.businessInfo.taxIdentificationNumber}</span>
                                        </div>
                                    )}
                                    {shop.businessInfo.businessAddress && (
                                        <div>
                                            <span className="text-gray-600">Địa chỉ kinh doanh:</span>
                                            <p className="font-medium mt-1">
                                                {[
                                                    shop.businessInfo.businessAddress.street,
                                                    shop.businessInfo.businessAddress.ward,
                                                    shop.businessInfo.businessAddress.district,
                                                    shop.businessInfo.businessAddress.city,
                                                ]
                                                    .filter(Boolean)
                                                    .join(", ")}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Top Products */}
                        {shopDetails?.topProducts?.length > 0 && (
                            <Card className="border-pink-200">
                                <CardHeader>
                                    <CardTitle>Sản phẩm bán chạy</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {shopDetails.topProducts.map((product) => (
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
                                                    <p className="text-sm text-pink-600">{product.price?.toLocaleString("vi-VN")}đ</p>
                                                    <p className="text-xs text-gray-500">Đã bán: {product.soldCount}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Posts */}
                        {shopDetails?.recentPosts?.length > 0 && (
                            <Card className="border-pink-200">
                                <CardHeader>
                                    <CardTitle>Bài viết gần đây</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {shopDetails.recentPosts.map((post) => (
                                            <div key={post._id} className="p-3 border border-gray-200 rounded-lg">
                                                <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <Heart className="w-3 h-3" />
                                                            {post.likesCount || 0}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MessageSquare className="w-3 h-3" />
                                                            {post.commentsCount || 0}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Suspension Info */}
                        {shop.status?.suspensionInfo && (
                            <Card className="border-red-200 bg-red-50">
                                <CardHeader>
                                    <CardTitle className="text-red-800">Thông tin tạm dừng</CardTitle>
                                </CardHeader>
                                <CardContent className="text-red-700">
                                    <div className="space-y-2">
                                        <div>
                                            <strong>Lý do:</strong> {shop.status.suspensionInfo.reason}
                                        </div>
                                        <div>
                                            <strong>Thời gian:</strong> {formatDate(shop.status.suspensionInfo.suspendedAt)}
                                        </div>
                                        {shop.status.suspensionInfo.expiresAt && (
                                            <div>
                                                <strong>Hết hạn:</strong> {formatDate(shop.status.suspensionInfo.expiresAt)}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
