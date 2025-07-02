"use client"

import { useState } from "react"
import { Heart, MapPin, Star, Users, Package, Verified, BadgeCheck } from "lucide-react"
import { Button } from "../../ui/button"
import { Card, CardContent } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { useAuth } from "../../../contexts/AuthContext"
import { useNavigate } from "react-router-dom"

const ShopCard = ({ shop, onFollow, isFollowing, className = "" }) => {
    const navigate = useNavigate();
    const [imageLoaded, setImageLoaded] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const { isAuthenticated, setShowLoginModal } = useAuth()

    const handleFollowClick = () => {
        if (!isAuthenticated) {
            setShowLoginModal(true)
            return
        }
        onFollow(shop._id, "shop")
    }

    return (
        <Card
            className={`group relative overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg hover:shadow-pink-100/50 ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-transparent to-purple-50/30 opacity-0 group-hover:opacity-100 transition-all duration-500" />

            {/* Sparkle effect */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-200">
                <BadgeCheck className="w-5 h-5 text-pink-400 animate-pulse" />
            </div>

            <CardContent className="p-0">
                {/* Cover Image Section */}
                <div className="relative h-40 bg-gradient-to-br from-pink-100 via-pink-50 to-purple-100 overflow-hidden">
                    {shop.coverImage || shop.avatar ? (
                        <>
                            {!imageLoaded && (
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-pink-50 to-purple-100">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                </div>
                            )}
                            <img
                                src={shop.coverImage || shop.avatar}
                                alt={shop.name}
                                className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? "opacity-100" : "opacity-0"
                                    } ${isHovered ? "scale-110 brightness-110" : "scale-100"}`}
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageLoaded(true)}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                        </>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-100 via-pink-50 to-purple-100 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                            <Package className="w-16 h-16 text-pink-400/60" />
                        </div>
                    )}

                    {/* Follow button overlay */}
                    <div className="absolute top-3 right-3 transform transition-all duration-300 hover:scale-105">
                        <Button
                            size="sm"
                            variant={isFollowing ? "default" : "outline"}
                            className={`${isFollowing
                                ? "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white border-0 shadow-lg"
                                : "bg-white/95 hover:bg-white text-pink-600 border-pink-200/50 shadow-lg backdrop-blur-sm"
                                } transition-all duration-300 font-medium`}
                            onClick={handleFollowClick}
                        >
                            <Heart
                                className={`w-4 h-4 mr-1.5 transition-transform duration-200 ${isFollowing ? "fill-current scale-110" : "hover:scale-110"}`}
                            />
                            {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                        </Button>
                    </div>



                </div>



                {/* Shop Info Section */}
                <div className="p-6 pt-4" onClick={() => navigate(`/feed/profile/${shop.slug}`)}>
                    <div className="flex items-start gap-4 mb-4">
                        {/* Shop Avatar */}
                        <div className="flex-shrink-0">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-white shadow-xl border-4 border-white overflow-hidden transform transition-all duration-300 group-hover:scale-105">
                                    {shop.avatar ? (
                                        <img
                                            src={shop.avatar || "/placeholder.svg"}
                                            alt={`${shop.name} avatar`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">{shop.name?.charAt(0)?.toUpperCase()}</span>
                                        </div>
                                    )}
                                </div>
                                {/* Verification badge */}
                                {shop.status?.isApprovedCreate && (
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                                        <Verified className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Shop name and status */}
                        <div className="mb-4">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-xl text-gray-900 truncate group-hover:text-pink-600 transition-colors duration-300 leading-tight">
                                    {shop.name}
                                </h3>
                            </div>

                            {shop.status?.isApprovedCreate && (
                                <Badge
                                    variant="secondary"
                                    className="bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-0 font-medium"
                                >
                                    <Verified className="w-3 h-3 mr-1" />
                                    Đã xác minh
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {shop.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{shop.description}</p>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            {/* Rating */}
                            {shop.stats?.rating?.avg > 0 && (
                                <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                                    <span className="font-semibold text-gray-800 text-sm">{shop.stats.rating.avg.toFixed(1)}</span>
                                    <span className="text-gray-500 text-xs ml-1">({shop.stats.rating.count})</span>
                                </div>
                            )}

                            {/* Followers */}
                            <div className="flex items-center bg-pink-50 px-2 py-1 rounded-lg">
                                <Users className="w-4 h-4 text-pink-500 mr-1" />
                                <span className="font-semibold text-gray-800 text-sm">
                                    {shop.followersCount || shop.stats?.followers?.length || 0}
                                </span>
                            </div>
                        </div>

                        {/* Products count */}
                        {shop.stats?.products?.total > 0 && (
                            <div className="flex items-center text-gray-500">
                                <Package className="w-4 h-4 mr-1" />
                                <span className="text-sm font-medium">{shop.stats.products.total}</span>
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    {shop.contact?.businessAddress && (
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="truncate font-medium">
                                {shop.contact.businessAddress.city || shop.contact.businessAddress.province}
                            </span>
                        </div>
                    )}

                    {/* Category Tag */}
                    {shop.productInfo?.mainCategory && (
                        <div className="flex flex-wrap gap-2">
                            <Badge
                                variant="outline"
                                className="bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 border-pink-200/50 font-medium hover:from-pink-100 hover:to-purple-100 transition-all duration-200"
                            >
                                {shop.productInfo.mainCategory.name || "Danh mục chính"}
                            </Badge>
                        </div>
                    )}
                </div>
            </CardContent>

            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-pink-400/10 via-purple-400/5 to-pink-400/10 blur-xl" />
            </div>
        </Card>
    )
}

export default ShopCard
