"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Badge } from "../../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Store,
    Shield,
    Heart,
    MessageSquare,
    Package,
    ShoppingCart,
} from "lucide-react"

export default function UserDetailModal({ user, open, onOpenChange }) {
    if (!user) return null

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getRoleBadge = (role) => {
        const colors = {
            admin: "bg-red-100 text-red-800",
            seller: "bg-blue-100 text-blue-800",
            buyer: "bg-green-100 text-green-800",
        }
        return (
            <Badge variant="secondary" className={colors[role] || "bg-gray-100 text-gray-800"}>
                {role?.toUpperCase()}
            </Badge>
        )
    }

    const getStatusBadge = (isActive) => {
        return (
            <Badge
                variant={isActive ? "default" : "secondary"}
                className={isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
            >
                {isActive ? "Hoạt động" : "Không hoạt động"}
            </Badge>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-pink-600" />
                        Chi tiết người dùng
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Basic Info */}
                    <Card className="border-pink-200">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-6">
                                <Avatar className="w-20 h-20">
                                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                    <AvatarFallback className="bg-pink-100 text-pink-600 text-xl">
                                        {user.fullName?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">{user.fullName || "Chưa có tên"}</h3>
                                        <p className="text-gray-500">@{user.slug || user._id}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {getRoleBadge(user.role)}
                                            {getStatusBadge(user.isActive)}
                                            {user.shopId && (
                                                <Badge variant="outline" className="border-purple-200 text-purple-600">
                                                    Có shop
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span>{user.email}</span>
                                        </div>
                                        {user.phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span>{user.phone}</span>
                                            </div>
                                        )}
                                        {user.address && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span>{user.address}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span>Tham gia {formatDate(user.createdAt)}</span>
                                        </div>
                                    </div>

                                    {user.bio && (
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-2">Giới thiệu</h4>
                                            <p className="text-gray-600 text-sm">{user.bio}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-pink-200">
                            <CardHeader>
                                <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {user.gender && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Giới tính:</span>
                                        <span className="font-medium">
                                            {user.gender === "male" ? "Nam" : user.gender === "female" ? "Nữ" : "Khác"}
                                        </span>
                                    </div>
                                )}
                                {user.dateOfBirth && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Ngày sinh:</span>
                                        <span className="font-medium">{formatDate(user.dateOfBirth)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Roles:</span>
                                    <div className="flex gap-1">
                                        {user.roles?.map((role, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs">
                                                {role}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tham gia:</span>
                                    <span className="font-medium">{user.joinedDays} ngày trước</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Activity Stats */}
                        <Card className="border-pink-200">
                            <CardHeader>
                                <CardTitle className="text-lg">Thống kê hoạt động</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-pink-50 rounded-lg">
                                        <MessageSquare className="w-6 h-6 text-pink-600 mx-auto mb-1" />
                                        <p className="text-2xl font-bold text-pink-600">{user.stats?.totalPosts || 0}</p>
                                        <p className="text-sm text-gray-600">Bài viết</p>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <ShoppingCart className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                                        <p className="text-2xl font-bold text-blue-600">{user.stats?.totalOrders || 0}</p>
                                        <p className="text-sm text-gray-600">Đơn hàng</p>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <Heart className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                        <p className="text-2xl font-bold text-green-600">{user.likedPosts?.length || 0}</p>
                                        <p className="text-sm text-gray-600">Đã thích</p>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                                        <Package className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                                        <p className="text-2xl font-bold text-purple-600">{user.savedPosts?.length || 0}</p>
                                        <p className="text-sm text-gray-600">Đã lưu</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Shop Information */}
                    {user.shopId && user.shopDetails && (
                        <Card className="border-pink-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Store className="w-5 h-5 text-purple-600" />
                                    Thông tin Shop
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={user.shopDetails.avatar || "/placeholder.svg"} />
                                        <AvatarFallback className="bg-purple-100 text-purple-600">
                                            {user.shopDetails.name?.[0] || "S"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-semibold">{user.shopDetails.name}</h4>
                                        <p className="text-sm text-gray-500">@{user.shopDetails.slug}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    user.shopDetails.isApproved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                                }
                                            >
                                                {user.shopDetails.isApproved ? "Đã duyệt" : "Chờ duyệt"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {user.shopDetails.description && (
                                    <div>
                                        <h5 className="font-medium mb-2">Mô tả shop</h5>
                                        <p className="text-sm text-gray-600">{user.shopDetails.description}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                        <p className="text-lg font-bold">{user.shopDetails.stats?.rating?.avg?.toFixed(1) || "0.0"}</p>
                                        <p className="text-xs text-gray-600">Đánh giá</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                        <p className="text-lg font-bold">{user.shopDetails.stats?.followers?.length || 0}</p>
                                        <p className="text-xs text-gray-600">Followers</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                        <p className="text-lg font-bold">{user.shopDetails.stats?.orderCount || 0}</p>
                                        <p className="text-xs text-gray-600">Đơn hàng</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                        <p className="text-lg font-bold">{user.shopDetails.stats?.views || 0}</p>
                                        <p className="text-xs text-gray-600">Lượt xem</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Review Stats */}
                    {user.reviewStats && (
                        <Card className="border-pink-200">
                            <CardHeader>
                                <CardTitle>Thống kê đánh giá</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h5 className="font-medium mb-3">Là khách hàng</h5>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Đánh giá đã viết:</span>
                                                <span className="font-medium">{user.reviewStats.asCustomer?.reviewsGiven || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Điểm TB đã cho:</span>
                                                <span className="font-medium">
                                                    {user.reviewStats.asCustomer?.avgRatingGiven?.toFixed(1) || "0.0"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Lượt hữu ích:</span>
                                                <span className="font-medium">{user.reviewStats.asCustomer?.helpfulVotes || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="font-medium mb-3">Được đánh giá</h5>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Điểm TB nhận được:</span>
                                                <span className="font-medium">
                                                    {user.reviewStats.fromShops?.avgRating?.toFixed(1) || "0.0"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Tổng đánh giá:</span>
                                                <span className="font-medium">{user.reviewStats.fromShops?.totalReviews || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Account Security */}
                    <Card className="border-pink-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-gray-600" />
                                Bảo mật tài khoản
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Refresh token usage:</span>
                                <span className="font-medium">{user.refreshTokenUsage || 0}</span>
                            </div>
                            {user.ip && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">IP cuối:</span>
                                    <span className="font-medium font-mono text-sm">{user.ip}</span>
                                </div>
                            )}
                            {user.userAgent && (
                                <div>
                                    <span className="text-gray-600">User Agent:</span>
                                    <p className="text-sm text-gray-500 mt-1 break-all">{user.userAgent}</p>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Cập nhật cuối:</span>
                                <span className="font-medium">{formatDate(user.updatedAt)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}
