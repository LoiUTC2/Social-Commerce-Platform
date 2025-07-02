"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../../ui/card"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import {
    Star,
    Users,
    Eye,
    Heart,
    ChevronUp,
    AlertCircle,
    Crown,
    Sparkles,
    TrendingUp,
    MapPin,
    ShoppingBag,
    Verified,
} from "lucide-react"
import { getRecommendedShops } from "../../../services/recommendationService"
import { useNavigate } from "react-router-dom"

export default function RecommendedShops() {
    const navigate = useNavigate()
    const [shops, setShops] = useState([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [pagination, setPagination] = useState(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const [error, setError] = useState(null)
    const [hoveredShop, setHoveredShop] = useState(null)

    useEffect(() => {
        loadInitialData()
    }, [])

    const loadInitialData = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await getRecommendedShops(1, 8)

            // THÊM: Transform data với coverImage
            const transformedShops = res.data.shops.map((shop) => ({
                _id: shop._id,
                name: shop.name,
                slug: shop.slug,
                avatar: shop.avatar || shop.logo,
                coverImage: shop.coverImage || "/api/placeholder/400/200", // THÊM: Cover image
                description: shop.description,
                location: shop.location || "Việt Nam", // THÊM: Location
                stats: {
                    rating: {
                        avg: shop.stats?.rating?.avg || 0,
                        count: shop.stats?.rating?.count || 0,
                    },
                    followers: shop.stats?.followersCount || 0,
                    views: shop.stats?.views || 0,
                    products: shop.stats?.products || 0, // THÊM: Product count
                },
                status: {
                    featureLevel: shop.status?.featureLevel || "normal",
                    isActive: shop.status?.isActive || true,
                    isVerified: shop.status?.isVerified || false, // THÊM: Verified status
                },
                productInfo: {
                    mainCategory: shop.productInfo?.mainCategory?.name || "Chưa phân loại",
                },
                // THÊM: Thêm thông tin trending
                trending: {
                    isHot: shop.stats?.views > 10000,
                    isNew: new Date(shop.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    growthRate: Math.floor(Math.random() * 50) + 10, // Mock data
                },
            }))

            setShops(transformedShops)
            setPagination(res.data.pagination)
        } catch (error) {
            console.error("Error loading recommended shops:", error)
            setError("Không thể tải danh sách shop gợi ý. Vui lòng thử lại sau.")
        } finally {
            setLoading(false)
        }
    }

    const loadMore = async () => {
        if (!pagination?.hasNext || loadingMore) return

        setLoadingMore(true)
        try {
            const nextPage = page + 1
            const res = await getRecommendedShops(nextPage, 8)

            // THÊM: Transform data với coverImage
            const transformedShops = res.data.shops.map((shop) => ({
                _id: shop._id,
                name: shop.name,
                slug: shop.slug,
                avatar: shop.avatar || shop.logo,
                coverImage: shop.coverImage || "/api/placeholder/400/200", // THÊM: Cover image
                description: shop.description,
                location: shop.location || "Việt Nam",
                stats: {
                    rating: {
                        avg: shop.stats?.rating?.avg || 0,
                        count: shop.stats?.rating?.count || 0,
                    },
                    followers: shop.stats?.followersCount || 0,
                    views: shop.stats?.views || 0,
                    products: shop.stats?.products || 0,
                },
                status: {
                    featureLevel: shop.status?.featureLevel || "normal",
                    isActive: shop.status?.isActive || true,
                    isVerified: shop.status?.isVerified || false,
                },
                productInfo: {
                    mainCategory: shop.productInfo?.mainCategory?.name || "Chưa phân loại",
                },
                trending: {
                    isHot: shop.stats?.views > 10000,
                    isNew: new Date(shop.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    growthRate: Math.floor(Math.random() * 50) + 10,
                },
            }))

            setShops((prev) => [...prev, ...transformedShops])
            setPagination(res.data.pagination)
            setPage(nextPage)
            setIsExpanded(true)
        } catch (error) {
            console.error("Error loading more recommended shops:", error)
            setError("Không thể tải thêm shop. Vui lòng thử lại.")
        } finally {
            setLoadingMore(false)
        }
    }

    const collapse = () => {
        setShops((prev) => prev.slice(0, 8))
        setPage(1)
        setPagination((prev) => ({ ...prev, hasNext: true }))
        setIsExpanded(false)
    }

    // THÊM: Enhanced feature badge với animations
    const getFeatureBadge = (featureLevel) => {
        switch (featureLevel) {
            case "vip":
                return (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full shadow-lg animate-pulse z-10">
                        <Crown className="w-3 h-3 mr-1" />
                        VIP
                    </Badge>
                )
            case "premium":
                return (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full shadow-lg z-10">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Premium
                    </Badge>
                )
            default:
                return null
        }
    }

    // THÊM: Trending badges
    const getTrendingBadge = (trending) => {
        if (trending.isHot) {
            return (
                <Badge className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full shadow-md z-10">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    HOT
                </Badge>
            )
        }
        if (trending.isNew) {
            return (
                <Badge className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full shadow-md z-10">
                    <Sparkles className="w-3 h-3 mr-1" />
                    NEW
                </Badge>
            )
        }
        return null
    }

    const formatNumber = (num) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
        return num.toString()
    }

    // THÊM: Loading skeleton với cover image
    const ShopCardSkeleton = () => (
        <Card className="overflow-hidden">
            <div className="animate-pulse">
                {/* Cover image skeleton */}
                <div className="h-24 bg-gradient-to-r from-pink-100 to-purple-100"></div>
                {/* Content skeleton */}
                <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-pink-100 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-pink-100 rounded w-3/4"></div>
                            <div className="h-3 bg-pink-50 rounded w-1/2"></div>
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <div className="h-3 bg-pink-50 rounded w-1/4"></div>
                        <div className="h-3 bg-pink-50 rounded w-1/4"></div>
                    </div>
                </div>
            </div>
        </Card>
    )

    if (loading) {
        return (
            <Card className="border-pink-100 shadow-xl bg-gradient-to-br from-white to-pink-50">
                <CardContent className="p-6">
                    <div className="space-y-6">
                        {/* Header skeleton */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-pink-200 to-purple-200 rounded-lg animate-pulse"></div>
                                <div className="space-y-2">
                                    <div className="h-6 bg-pink-100 rounded w-48 animate-pulse"></div>
                                    <div className="h-4 bg-pink-50 rounded w-32 animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        {/* Grid skeleton */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <ShopCardSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="border-red-100 shadow-xl bg-gradient-to-br from-red-50 to-pink-50">
                <CardContent className="p-6">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-pink-400 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-red-600 mb-2">Oops! Có lỗi xảy ra</h2>
                            <p className="text-sm text-red-600 mb-4">{error}</p>
                        </div>
                        <Button
                            onClick={loadInitialData}
                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-2 rounded-full"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            Thử lại
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-pink-100 shadow-xl bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 overflow-hidden">
            {/* THÊM: Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-xl"></div>
            </div>

            <CardContent className="p-6 relative z-10">
                {/* THÊM: Enhanced header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl shadow-lg">
                                <Heart className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                                Shop Đề Xuất Cho Bạn
                            </h2>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Sparkles className="w-4 h-4 text-pink-500" />
                                Khám phá những cửa hàng tuyệt vời nhất
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => navigate("/marketplace/shop-recommendation")}
                        variant="ghost"
                        className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 font-medium transition-all duration-200 rounded-full px-4"
                    >
                        Xem tất cả
                        <Eye className="w-4 h-4 ml-2" />
                    </Button>
                </div>

                {/* THÊM: Enhanced shop grid với cover images */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {shops.map((shop) => (
                        <Card
                            key={shop._id}
                            className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm hover:bg-white overflow-hidden cursor-pointer transform hover:scale-105"
                            onMouseEnter={() => setHoveredShop(shop._id)}
                            onMouseLeave={() => setHoveredShop(null)}
                            onClick={() => navigate(`/feed/profile/${shop?.slug}`)}
                        >
                            {/* THÊM: Cover Image Section */}
                            <div className="relative h-24 overflow-hidden">
                                <img
                                    src={shop.coverImage || "/placeholder.svg"}
                                    alt={`${shop.name} cover`}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />

                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                                {/* Trending badge */}
                                {getTrendingBadge(shop.trending)}

                                {/* Feature badge */}
                                {getFeatureBadge(shop.status.featureLevel)}

                                {/* THÊM: Floating stats on hover */}
                                {hoveredShop === shop._id && (
                                    <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-gray-700 animate-fade-in">
                                        <Eye className="w-3 h-3 inline mr-1" />
                                        {formatNumber(shop.stats.views)}
                                    </div>
                                )}
                            </div>

                            <CardContent className="p-4 relative">
                                {/* THÊM: Shop info với enhanced layout */}
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="relative">
                                        <Avatar className="w-12 h-12 border-3 border-white shadow-lg ring-2 ring-pink-100 group-hover:ring-pink-300 transition-all duration-300">
                                            <AvatarImage src={shop.avatar || "/placeholder.svg"} alt={shop.name} />
                                            <AvatarFallback className="bg-gradient-to-r from-pink-400 to-purple-400 text-white font-bold">
                                                {shop.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* THÊM: Verified badge */}
                                        {shop.status.isVerified && (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                <Verified className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm text-gray-800 mb-1 truncate group-hover:text-pink-600 transition-colors flex items-center gap-1">
                                            {shop.name}
                                            {shop.status.isVerified && <Verified className="w-3 h-3 text-blue-500" />}
                                        </h3>

                                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                            <ShoppingBag className="w-3 h-3" />
                                            {shop.productInfo.mainCategory}
                                        </p>

                                        {/* THÊM: Location */}
                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {shop.location}
                                        </p>
                                    </div>
                                </div>

                                {/* THÊM: Enhanced stats */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="flex items-center gap-1 bg-yellow-50 rounded-lg px-2 py-1">
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        <span className="font-medium text-gray-700">{shop.stats.rating.avg.toFixed(1)}</span>
                                        <span className="text-gray-500">({formatNumber(shop.stats.rating.count)})</span>
                                    </div>

                                    <div className="flex items-center gap-1 bg-pink-50 rounded-lg px-2 py-1">
                                        <Users className="w-3 h-3 text-pink-500" />
                                        <span className="font-medium text-gray-700">{formatNumber(shop.stats.followers)}</span>
                                        <span className="text-gray-500">theo dõi</span>
                                    </div>
                                </div>

                                {/* THÊM: Growth indicator */}
                                {shop.trending.growthRate > 20 && (
                                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600 bg-green-50 rounded-full px-2 py-1">
                                        <TrendingUp className="w-3 h-3" />
                                        <span className="font-medium">+{shop.trending.growthRate}% tăng trưởng</span>
                                    </div>
                                )}

                                {/* THÊM: Hover overlay với quick actions */}
                                {hoveredShop === shop._id && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-pink-500/10 to-transparent rounded-lg flex items-end justify-center pb-2 animate-fade-in">
                                        <Button
                                            size="sm"
                                            className="bg-white/90 text-pink-600 hover:bg-white hover:text-pink-700 shadow-lg backdrop-blur-sm border border-pink-200 rounded-full px-4"
                                        >
                                            <Eye className="w-3 h-3 mr-1" />
                                            Xem shop
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* THÊM: Enhanced action buttons */}
                <div className="flex justify-center gap-4">
                    {!isExpanded && pagination?.hasNext && (
                        <Button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 hover:from-pink-600 hover:via-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            {loadingMore ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Đang khám phá...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    <span>Khám phá thêm ({pagination.totalCount - shops.length} shop)</span>
                                    <Eye className="w-4 h-4" />
                                </div>
                            )}
                        </Button>
                    )}

                    {isExpanded && (
                        <Button
                            onClick={collapse}
                            variant="outline"
                            className="border-2 border-pink-300 text-pink-600 hover:bg-pink-50 hover:border-pink-400 px-6 py-3 rounded-full transition-all duration-300 shadow-md hover:shadow-lg bg-transparent"
                        >
                            <div className="flex items-center gap-2">
                                <ChevronUp className="w-4 h-4" />
                                <span>Thu gọn</span>
                            </div>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
