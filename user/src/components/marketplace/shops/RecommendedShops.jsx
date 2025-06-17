"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../../ui/card"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { Star, Users, Eye, Heart, ChevronUp, AlertCircle } from "lucide-react"
import { getRecommendedShops } from "../../../services/recommendationService"

export default function RecommendedShops() {
    const [shops, setShops] = useState([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [pagination, setPagination] = useState(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadInitialData()
    }, [])

    const loadInitialData = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await getRecommendedShops(1, 8)

            // Transform data to match component expectations
            const transformedShops = res.data.shops.map((shop) => ({
                _id: shop._id,
                name: shop.name,
                slug: shop.slug,
                avatar: shop.avatar || shop.logo,
                description: shop.description,
                stats: {
                    rating: {
                        avg: shop.stats?.rating?.avg || 0,
                        count: shop.stats?.rating?.count || 0,
                    },
                    followers: Array.isArray(shop.stats?.followers) ? shop.stats.followers.length : shop.stats?.followers || 0,
                    views: shop.stats?.views || 0,
                },
                status: {
                    featureLevel: shop.status?.featureLevel || "normal",
                    isActive: shop.status?.isActive || true,
                },
                productInfo: {
                    mainCategory: shop.productInfo?.mainCategory?.name || "Chưa phân loại",
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

            // Transform data
            const transformedShops = res.data.shops.map((shop) => ({
                _id: shop._id,
                name: shop.name,
                slug: shop.slug,
                avatar: shop.avatar || shop.logo,
                description: shop.description,
                stats: {
                    rating: {
                        avg: shop.stats?.rating?.avg || 0,
                        count: shop.stats?.rating?.count || 0,
                    },
                    followers: Array.isArray(shop.stats?.followers) ? shop.stats.followers.length : shop.stats?.followers || 0,
                    views: shop.stats?.views || 0,
                },
                status: {
                    featureLevel: shop.status?.featureLevel || "normal",
                    isActive: shop.status?.isActive || true,
                },
                productInfo: {
                    mainCategory: shop.productInfo?.mainCategory?.name || "Chưa phân loại",
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

    const getFeatureBadge = (featureLevel) => {
        switch (featureLevel) {
            case "vip":
                return (
                    <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-1.5 py-0.5">
                        VIP
                    </Badge>
                )
            case "premium":
                return (
                    <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-400 to-pink-500 text-white text-xs px-1.5 py-0.5">
                        Premium
                    </Badge>
                )
            default:
                return null
        }
    }

    const formatNumber = (num) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
        return num.toString()
    }

    if (loading) {
        return (
            <Card className="border-pink-100 shadow-lg">
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-6 bg-pink-100 rounded w-48"></div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-32 bg-pink-50 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="border-red-100 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-red-600 mb-3">
                        <AlertCircle className="w-5 h-5" />
                        <h2 className="text-xl font-bold">Lỗi tải dữ liệu</h2>
                    </div>
                    <p className="text-sm text-red-600 mb-4">{error}</p>
                    <Button onClick={loadInitialData} className="bg-red-500 hover:bg-red-600 text-white">
                        Thử lại
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-pink-100 shadow-lg">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-pink-400 to-pink-500 rounded-lg">
                            <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Gợi Ý Dành Cho Bạn</h2>
                            <p className="text-sm text-gray-600">Khám phá những cửa hàng thú vị</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    {shops.map((shop) => (
                        <Card
                            key={shop._id}
                            className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-pink-300 cursor-pointer"
                        >
                            <CardContent className="p-4 text-center">
                                <div className="relative mb-3">
                                    <Avatar className="w-12 h-12 mx-auto border-2 border-gray-200 group-hover:border-pink-300 transition-colors">
                                        <AvatarImage src={shop.avatar || "/placeholder.svg"} alt={shop.name} />
                                        <AvatarFallback className="bg-gray-100 text-gray-600 font-semibold">
                                            {shop.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    {getFeatureBadge(shop.status.featureLevel)}
                                </div>

                                <h3 className="font-medium text-sm text-gray-800 mb-1 truncate group-hover:text-pink-600 transition-colors">
                                    {shop.name}
                                </h3>

                                <p className="text-xs text-gray-500 mb-2 line-clamp-1">{shop.productInfo.mainCategory}</p>

                                <div className="flex items-center justify-center gap-3 text-xs text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        <span>{shop.stats.rating.avg}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3 text-pink-500" />
                                        <span>{formatNumber(shop.stats.followers)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-3">
                    {!isExpanded && pagination?.hasNext && (
                        <Button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-8 py-2 rounded-full transition-all duration-300 transform hover:scale-105"
                        >
                            {loadingMore ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Đang tải...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    Xem thêm shop ({pagination.totalCount - shops.length} còn lại)
                                </div>
                            )}
                        </Button>
                    )}

                    {isExpanded && (
                        <Button
                            onClick={collapse}
                            variant="outline"
                            className="border-pink-300 text-pink-600 hover:bg-pink-50 px-6 py-2 rounded-full transition-all duration-300"
                        >
                            <div className="flex items-center gap-2">
                                <ChevronUp className="w-4 h-4" />
                                Thu gọn
                            </div>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
