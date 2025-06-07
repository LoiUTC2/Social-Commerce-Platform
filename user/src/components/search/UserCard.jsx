"use client"

import { Users, Star, Store } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

const UserCard = ({ user, onUserClick }) => {
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
        if (num >= 1000) return (num / 1000).toFixed(1) + "K"
        return num.toString()
    }

    const handleClick = () => {
        if (onUserClick) {
            onUserClick(user)
        }
    }

    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleClick}>
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{user.fullName?.[0] || "U"}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg" title={user.fullName}>
                                {user.fullName || "Người dùng"}
                            </h3>
                            {user.roles?.includes("seller") && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    Seller
                                </Badge>
                            )}
                            {user.shopId && <Store className="h-4 w-4 text-green-500" />}
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2" title={user.bio}>
                            {user.bio || "Chưa có mô tả"}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span>{formatNumber(user.followers?.length || 0)} theo dõi</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span>{formatNumber(user.following?.length || 0)} đang theo dõi</span>
                            </div>
                            {user.reviewStats?.asCustomer && (
                                <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span>{user.reviewStats.asCustomer.avgRatingGiven || 0} đánh giá</span>
                                </div>
                            )}
                            {user.shopId && (
                                <div className="flex items-center gap-2">
                                    <Store className="h-4 w-4 text-green-500" />
                                    <span>Có shop</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default UserCard
