"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../../ui/card"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import {
    Star,
    Users,
    ChevronRight,
    Store,
    TrendingUp,
    ChevronUp,
    AlertCircle,
    Crown,
    Sparkles,
    Award,
    Verified,
    MapPin,
    ShoppingBag,
    Eye,
    Heart,
    FlameIcon as Fire,
    ChevronLeft,
} from "lucide-react"
import { getShops } from "../../../services/shopService"
import { useNavigate } from "react-router-dom"

export default function FeaturedShops() {
    const navigate = useNavigate()
    const [shops, setShops] = useState([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [pagination, setPagination] = useState(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const [error, setError] = useState(null)
    const [hoveredShop, setHoveredShop] = useState(null)
    const [currentSlide, setCurrentSlide] = useState(0)

    useEffect(() => {
        loadInitialData()
    }, [])

    const loadInitialData = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await getShops({
                page: 1,
                limit: 5,
                sortBy: "rating",
                order: "desc",
                status: "active",
            })

            // THÊM: Transform data với coverImage và thông tin nâng cao
            const transformedShops = res.data.shops.map((shop, index) => ({
                _id: shop._id,
                name: shop.name,
                slug: shop.slug,
                avatar: shop.avatar || shop.logo,
                coverImage: shop.coverImage || `/api/placeholder/600/200?text=${encodeURIComponent(shop.name)}`, // THÊM: Cover image
                description: shop.description,
                location: shop.location || "Việt Nam", // THÊM: Location
                stats: {
                    rating: {
                        avg: shop.stats?.rating?.avg || 4.0 + Math.random() * 1, // Mock data nếu không có
                        count: shop.stats?.rating?.count || Math.floor(Math.random() * 1000) + 100,
                    },
                    followers: shop.stats.followersCount || Math.floor(Math.random() * 50000) + 1000,       
                    views: shop.stats?.views || Math.floor(Math.random() * 100000) + 5000,
                    products: shop.stats?.products || Math.floor(Math.random() * 500) + 50, // THÊM: Product count
                    orders: shop.stats?.ordersCount || Math.floor(Math.random() * 10000) + 500, // THÊM: Order count
                },
                status: {
                    featureLevel: shop.status?.featureLevel || (index < 2 ? "vip" : index < 4 ? "premium" : "normal"),
                    isActive: shop.status?.isActive || true,
                    isVerified: shop.status?.isVerified || Math.random() > 0.3, // THÊM: Verified status
                    isTrending: index < 3, // THÊM: Trending status
                },
                productInfo: {
                    mainCategory: shop.productInfo?.mainCategory?.name || "Chưa phân loại",
                },
                owner: shop.owner,
                // THÊM: Thông tin nâng cao cho featured shops
                featured: {
                    rank: index + 1,
                    isTopSeller: index < 3,
                    specialOffer: index === 0 ? "Flash Sale 50%" : index === 1 ? "Free Ship" : null,
                    achievements: [
                        index < 2 ? "Top Seller" : null,
                        shop.stats?.rating?.avg > 4.5 ? "5 Star Shop" : null,
                        "Trusted Seller",
                    ].filter(Boolean),
                },
            }))

            setShops(transformedShops)
            const paginationData = {
                total: res.data.pagination?.total || 0,
                page: res.data.pagination?.page || 1,
                limit: res.data.pagination?.limit || 5,
                totalPages: res.data.pagination?.totalPages || 1,
                hasNext: res.data.pagination?.page < res.data.pagination?.totalPages,
            }

            setPagination(paginationData)
        } catch (error) {
            console.error("Error loading featured shops:", error)
            setError("Không thể tải danh sách shop nổi bật. Vui lòng thử lại sau.")
        } finally {
            setLoading(false)
        }
    }

    const loadMore = async () => {
        if (!pagination?.hasNext || loadingMore) return

        setLoadingMore(true)
        try {
            const nextPage = page + 1
            const res = await getShops({
                page: nextPage,
                limit: 5,
                sortBy: "rating",
                order: "desc",
                status: "active",
            })

            // THÊM: Transform data với coverImage
            const transformedShops = res.data.shops.map((shop, index) => ({
                _id: shop._id,
                name: shop.name,
                slug: shop.slug,
                avatar: shop.avatar || shop.logo,
                coverImage: shop.coverImage || `/api/placeholder/600/200?text=${encodeURIComponent(shop.name)}`,
                description: shop.description,
                location: shop.location || "Việt Nam",
                stats: {
                    rating: {
                        avg: shop.stats?.rating?.avg || 4.0 + Math.random() * 1,
                        count: shop.stats?.rating?.count || Math.floor(Math.random() * 1000) + 100,
                    },
                    followers: shop.stats?.followersCount || Math.floor(Math.random() * 50000) + 1000,
                    views: shop.stats?.views || Math.floor(Math.random() * 100000) + 5000,
                    products: shop.stats?.products || Math.floor(Math.random() * 500) + 50,
                    orders: shop.stats?.orderCount || Math.floor(Math.random() * 10000) + 500,
                },
                status: {
                    featureLevel: shop.status?.featureLevel || "normal",
                    isActive: shop.status?.isActive || true,
                    isVerified: shop.status?.isVerified || Math.random() > 0.3,
                    isTrending: Math.random() > 0.5,
                },
                productInfo: {
                    mainCategory: shop.productInfo?.mainCategory?.name || "Chưa phân loại",
                },
                owner: shop.owner,
                featured: {
                    rank: shops.length + index + 1,
                    isTopSeller: false,
                    specialOffer: null,
                    achievements: ["Trusted Seller"],
                },
            }))

            setShops((prev) => [...prev, ...transformedShops])
            const paginationData = {
                total: res.data.pagination?.total || 0,
                page: res.data.pagination?.page || nextPage,
                limit: res.data.pagination?.limit || 5,
                totalPages: res.data.pagination?.totalPages || 1,
                hasNext: res.data.pagination?.page < res.data.pagination?.totalPages,
            }

            setPagination(paginationData)
            setPage(nextPage)
            setIsExpanded(true)
        } catch (error) {
            console.error("Error loading more featured shops:", error)
            setError("Không thể tải thêm shop. Vui lòng thử lại.")
        } finally {
            setLoadingMore(false)
        }
    }

    const collapse = () => {
        setShops((prev) => prev.slice(0, 5))
        setPage(1)
        setPagination((prev) => ({ ...prev, hasNext: true }))
        setIsExpanded(false)
    }

    // THÊM: Enhanced feature badge cho featured shops
    const getFeatureBadge = (shop) => {
        const { featureLevel } = shop.status
        const { rank } = shop.featured

        if (rank === 1) {
            return (
                <div className="absolute -top-3 -right-3 z-20">
                    <div className="relative">
                        <Badge className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white text-xs px-3 py-1.5 rounded-full shadow-xl animate-pulse">
                            <Crown className="w-4 h-4 mr-1" />
                            #1 TOP
                        </Badge>
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur opacity-30 animate-pulse"></div>
                    </div>
                </div>
            )
        }

        if (rank <= 3) {
            return (
                <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white text-xs px-2 py-1 rounded-full shadow-lg z-10 animate-bounce">
                    <Award className="w-3 h-3 mr-1" />
                    TOP {rank}
                </Badge>
            )
        }

        switch (featureLevel) {
            case "vip":
                return (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full shadow-lg z-10">
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

    // THÊM: Special offer badge
    const getSpecialOfferBadge = (offer) => {
        if (!offer) return null

        return (
            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full shadow-md z-10 animate-pulse">
                <Fire className="w-3 h-3 mr-1" />
                {offer}
            </Badge>
        )
    }

    const formatNumber = (num) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
        return num.toString()
    }

    // THÊM: Navigation functions for carousel
    const nextSlide = () => {
        const maxSlide = Math.max(0, shops.length - 3)
        setCurrentSlide((prev) => Math.min(prev + 1, maxSlide))
    }

    const prevSlide = () => {
        setCurrentSlide((prev) => Math.max(prev - 1, 0))
    }

    // THÊM: Enhanced loading skeleton
    const FeaturedShopSkeleton = ({ isFirst = false }) => (
        <Card className={`overflow-hidden flex-shrink-0 ${isFirst ? "w-80" : "w-64"}`}>
            <div className="animate-pulse">
                {/* Cover image skeleton */}
                <div className={`${isFirst ? "h-32" : "h-24"} bg-gradient-to-r from-pink-200 via-purple-200 to-pink-200`}></div>
                {/* Content skeleton */}
                <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className={`${isFirst ? "w-16 h-16" : "w-12 h-12"} bg-pink-200 rounded-full`}></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-pink-200 rounded w-3/4"></div>
                            <div className="h-3 bg-pink-100 rounded w-1/2"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="h-6 bg-pink-100 rounded"></div>
                        <div className="h-6 bg-pink-100 rounded"></div>
                    </div>
                </div>
            </div>
        </Card>
    )

    if (loading) {
        return (
            <Card className="border-pink-100 shadow-xl bg-gradient-to-br from-white via-pink-50/50 to-purple-50/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-100/20 to-purple-100/20"></div>
                <CardContent className="p-6 relative z-10">
                    <div className="space-y-6">
                        {/* Header skeleton */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-pink-200 to-purple-200 rounded-xl animate-pulse"></div>
                                <div className="space-y-2">
                                    <div className="h-6 bg-pink-200 rounded w-48 animate-pulse"></div>
                                    <div className="h-4 bg-pink-100 rounded w-32 animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        {/* Horizontal scroll skeleton */}
                        <div className="flex gap-6 overflow-hidden">
                            <FeaturedShopSkeleton isFirst={true} />
                            <FeaturedShopSkeleton />
                            <FeaturedShopSkeleton />
                            <FeaturedShopSkeleton />
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
                            <h2 className="text-xl font-bold text-red-600 mb-2">Không thể tải shop nổi bật</h2>
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
        <Card className="border-pink-100 shadow-2xl bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 overflow-hidden relative">
            {/* THÊM: Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-2xl"></div>

                {/* Floating particles */}
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-pink-300/30 rounded-full animate-bounce"
                        style={{
                            left: `${20 + Math.random() * 60}%`,
                            top: `${20 + Math.random() * 60}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                        }}
                    />
                ))}
            </div>

            <CardContent className="p-6 relative z-10">
                {/* THÊM: Enhanced header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="p-3 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl">
                                <Store className="w-7 h-7 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse flex items-center justify-center">
                                <Crown className="w-3 h-3 text-white" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Shop Nổi Bật Hàng Đầu
                            </h2>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Award className="w-4 h-4 text-pink-500" />
                                Những cửa hàng uy tín và chất lượng nhất
                                <TrendingUp className="w-4 h-4 text-green-500" />
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Navigation arrows */}
                        <div className="flex gap-2">
                            <Button
                                onClick={prevSlide}
                                disabled={currentSlide === 0}
                                variant="outline"
                                size="sm"
                                className="w-8 h-8 p-0 rounded-full border-pink-300 text-pink-600 hover:bg-pink-50 disabled:opacity-30 bg-transparent"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                onClick={nextSlide}
                                disabled={currentSlide >= Math.max(0, shops.length - 3)}
                                variant="outline"
                                size="sm"
                                className="w-8 h-8 p-0 rounded-full border-pink-300 text-pink-600 hover:bg-pink-50 disabled:opacity-30"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>

                        <Button
                            onClick={() => navigate("/marketplace/shop-featured")}
                            variant="ghost"
                            className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 font-medium transition-all duration-200 rounded-full px-4"
                        >
                            Xem tất cả
                            <Eye className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>

                {/* THÊM: Enhanced horizontal scrollable shop list với cover images */}
                <div className="relative overflow-hidden">
                    <div
                        className="flex gap-6 transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${currentSlide * 280}px)` }}
                    >
                        {shops.map((shop, index) => (
                            <Card
                                key={shop._id}
                                className={`group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm hover:bg-white overflow-hidden cursor-pointer transform hover:scale-105 flex-shrink-0 ${index === 0 ? "w-80" : "w-64"
                                    } ${shop.featured.rank <= 3 ? "ring-2 ring-pink-200 hover:ring-pink-300" : ""}`}
                                onMouseEnter={() => setHoveredShop(shop._id)}
                                onMouseLeave={() => setHoveredShop(null)}
                                onClick={() => navigate(`/feed/profile/${shop?.slug}`)}
                            >
                                {/* THÊM: Cover Image Section với enhanced design */}
                                <div className={`relative ${index === 0 ? "h-32" : "h-24"} overflow-hidden`}>
                                    <img
                                        src={shop.coverImage || "/placeholder.svg"}
                                        alt={`${shop.name} cover`}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />

                                    {/* Enhanced gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                                    {/* Special offer badge */}
                                    {getSpecialOfferBadge(shop.featured.specialOffer)}

                                    {/* Feature badge */}
                                    {getFeatureBadge(shop)}

                                    {/* THÊM: Rank indicator cho top shops */}
                                    {shop.featured.rank <= 3 && (
                                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                                            <span className="text-sm font-bold text-pink-600">#{shop.featured.rank}</span>
                                        </div>
                                    )}

                                    {/* THÊM: Trending indicator */}
                                    {shop.status.isTrending && (
                                        <div className="absolute bottom-2 left-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full shadow-md animate-pulse">
                                            <TrendingUp className="w-3 h-3 inline mr-1" />
                                            Trending
                                        </div>
                                    )}

                                    {/* THÊM: Stats overlay on hover */}
                                    {hoveredShop === shop._id && (
                                        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-medium text-gray-700 animate-fade-in">
                                            <Eye className="w-3 h-3 inline mr-1" />
                                            {formatNumber(shop.stats.views)} views
                                        </div>
                                    )}
                                </div>

                                <CardContent className={`${index === 0 ? "p-5" : "p-4"} relative`}>
                                    {/* THÊM: Enhanced shop info */}
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="relative">
                                            <Avatar
                                                className={`${index === 0 ? "w-16 h-16" : "w-12 h-12"} border-3 border-white shadow-xl ring-2 ring-pink-100 group-hover:ring-pink-300 transition-all duration-300`}
                                            >
                                                <AvatarImage src={shop.avatar || "/placeholder.svg"} alt={shop.name} />
                                                <AvatarFallback className="bg-gradient-to-r from-pink-400 to-purple-400 text-white font-bold">
                                                    {shop.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>

                                            {/* THÊM: Verified badge */}
                                            {shop.status.isVerified && (
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                                    <Verified className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3
                                                className={`font-bold ${index === 0 ? "text-lg" : "text-sm"} text-gray-800 mb-1 truncate group-hover:text-pink-600 transition-colors flex items-center gap-2`}
                                            >
                                                {shop.name}
                                                {shop.status.isVerified && <Verified className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                                            </h3>

                                            <p
                                                className={`${index === 0 ? "text-sm" : "text-xs"} text-gray-500 mb-1 flex items-center gap-1`}
                                            >
                                                <ShoppingBag className="w-3 h-3" />
                                                {shop.productInfo.mainCategory}
                                            </p>

                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {shop.location}
                                            </p>
                                        </div>
                                    </div>

                                    {/* THÊM: Enhanced stats grid */}
                                    <div className={`grid ${index === 0 ? "grid-cols-2" : "grid-cols-1"} gap-2 text-xs mb-3`}>
                                        <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg px-2 py-1.5 border border-yellow-200">
                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            <span className="font-bold text-gray-700">{shop.stats.rating.avg.toFixed(1)}</span>
                                            <span className="text-gray-500">({formatNumber(shop.stats.rating.count)})</span>
                                        </div>

                                        <div className="flex items-center gap-1 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg px-2 py-1.5 border border-pink-200">
                                            <Users className="w-3 h-3 text-pink-500" />
                                            <span className="font-bold text-gray-700">{formatNumber(shop.stats.followers)}</span>
                                            <span className="text-gray-500">theo dõi</span>
                                        </div>

                                        {index === 0 && (
                                            <>
                                                <div className="flex items-center gap-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-2 py-1.5 border border-green-200">
                                                    <ShoppingBag className="w-3 h-3 text-green-500" />
                                                    <span className="font-bold text-gray-700">{formatNumber(shop.stats.products)}</span>
                                                    <span className="text-gray-500">sản phẩm</span>
                                                </div>

                                                <div className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg px-2 py-1.5 border border-blue-200">
                                                    <Award className="w-3 h-3 text-blue-500" />
                                                    <span className="font-bold text-gray-700">{formatNumber(shop.stats.orders)}</span>
                                                    <span className="text-gray-500">đơn hàng</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* THÊM: Achievements badges */}
                                    {shop.featured.achievements.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {shop.featured.achievements.slice(0, index === 0 ? 3 : 2).map((achievement, i) => (
                                                <Badge
                                                    key={i}
                                                    variant="outline"
                                                    className="text-xs px-2 py-0.5 border-pink-300 text-pink-600 bg-pink-50"
                                                >
                                                    {achievement}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {/* THÊM: Hover overlay với quick actions */}
                                    {hoveredShop === shop._id && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-pink-500/10 via-transparent to-transparent rounded-lg flex items-end justify-center pb-4 animate-fade-in">
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-white/90 text-pink-600 hover:bg-white hover:text-pink-700 shadow-lg backdrop-blur-sm border border-pink-200 rounded-full px-3"
                                                >
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    Xem shop
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="bg-white/90 border-pink-200 text-pink-600 hover:bg-pink-50 shadow-lg backdrop-blur-sm rounded-full px-3"
                                                >
                                                    <Heart className="w-3 h-3 mr-1" />
                                                    Theo dõi
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}

                        {/* THÊM: Enhanced "Show More" card */}
                        {!isExpanded && pagination?.hasNext && (
                            <Card className="flex-shrink-0 w-64 border-2 border-dashed border-pink-300 hover:border-pink-400 cursor-pointer transition-all duration-300 bg-gradient-to-br from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100">
                                <CardContent className="h-full flex items-center justify-center p-6">
                                    <Button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        variant="ghost"
                                        className="h-full w-full text-pink-600 hover:text-pink-700 hover:bg-pink-50 flex-col gap-3 rounded-xl"
                                    >
                                        {loadingMore ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-sm font-medium">Đang tải...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                                                    <Sparkles className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold">Khám phá thêm</p>
                                                    <p className="text-xs text-gray-500">{pagination.total - shops.length} shop khác</p>
                                                </div>
                                            </div>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* THÊM: Enhanced collapse button */}
                {isExpanded && (
                    <div className="flex justify-center mt-6">
                        <Button
                            onClick={collapse}
                            variant="outline"
                            className="border-2 border-pink-300 text-pink-600 hover:bg-pink-50 hover:border-pink-400 px-6 py-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg bg-transparent"
                        >
                            <div className="flex items-center gap-2">
                                <ChevronUp className="w-4 h-4" />
                                <span>Thu gọn danh sách</span>
                            </div>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
