"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../../ui/card"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { Star, Users, ChevronRight, Store, TrendingUp, ChevronUp, AlertCircle } from "lucide-react"
import { getShops } from "../../../services/shopService"

export default function FeaturedShops() {
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
            const res = await getShops({
                page: 1,
                limit: 5,
                sortBy: "rating",
                order: "desc",
                status: "active",
            })
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
                owner: shop.owner,
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

            console.log("Pagination data:", paginationData)
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
                owner: shop.owner,
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
            console.log("Load more - Pagination data:", paginationData)
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

    const getFeatureBadge = (featureLevel) => {
        switch (featureLevel) {
            case "vip":
                return (
                    <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-1 py-0.5 text-[10px]">
                        VIP
                    </Badge>
                )
            case "premium":
                return (
                    <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-400 to-pink-500 text-white text-xs px-1 py-0.5 text-[10px]">
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
            <Card className="border-pink-100 shadow-lg bg-gradient-to-br from-pink-50 to-rose-50">
                <CardContent className="p-4">
                    <div className="animate-pulse space-y-3">
                        <div className="h-5 bg-pink-100 rounded w-40"></div>
                        <div className="flex gap-3 overflow-hidden">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex-shrink-0 w-32 h-24 bg-pink-50 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="border-red-100 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-600 mb-3">
                        <AlertCircle className="w-5 h-5" />
                        <h2 className="text-lg font-bold">Lỗi tải dữ liệu</h2>
                    </div>
                    <p className="text-sm text-red-600 mb-3">{error}</p>
                    <Button onClick={loadInitialData} className="bg-red-500 hover:bg-red-600 text-white" size="sm">
                        Thử lại
                    </Button>
                </CardContent>
            </Card>
        )
    }

    console.log("Current pagination:", pagination)
    console.log("Current shops count:", shops.length)
    console.log("Is expanded:", isExpanded)

    return (
        <Card className="border-pink-100 shadow-lg bg-gradient-to-br from-pink-50 to-rose-50">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg">
                            <Store className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Shop Nổi Bật</h2>
                            <p className="text-xs text-gray-600">Cửa hàng uy tín hàng đầu</p>
                        </div>
                    </div>
                    <TrendingUp className="w-5 h-5 text-pink-500" />
                </div>

                {/* Horizontal Scrollable Shop List */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {shops.map((shop, index) => (
                        <Card
                            key={shop._id}
                            className="group hover:shadow-lg transition-all duration-300 border-pink-200 hover:border-pink-300 cursor-pointer bg-white flex-shrink-0 w-40"
                        >
                            <CardContent className="p-3">
                                <div className="text-center">
                                    <div className="relative mb-2">
                                        <Avatar className="w-12 h-12 mx-auto border-2 border-pink-200">
                                            <AvatarImage src={shop.avatar || "/placeholder.svg"} alt={shop.name} />
                                            <AvatarFallback className="bg-pink-100 text-pink-600 font-semibold text-sm">
                                                {shop.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {getFeatureBadge(shop.status.featureLevel)}
                                    </div>

                                    <h3 className="font-semibold text-sm text-gray-800 mb-1 truncate group-hover:text-pink-600 transition-colors">
                                        {shop.name}
                                    </h3>

                                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">{shop.productInfo.mainCategory}</p>

                                    <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            <span className="font-medium">{shop.stats.rating.avg}</span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3 text-pink-500" />
                                            <span>{formatNumber(shop.stats.followers)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Show More Card */}
                    {!isExpanded && pagination?.hasNext && (
                        <Card className="flex-shrink-0 w-40 border-2 border-dashed border-pink-300 hover:border-pink-400 cursor-pointer transition-colors">
                            <CardContent className="p-3 h-full flex items-center justify-center">
                                <Button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    variant="ghost"
                                    className="h-full w-full text-pink-600 hover:text-pink-700 hover:bg-pink-50 flex-col gap-1"
                                >
                                    {loadingMore ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-xs">Đang tải...</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <ChevronRight className="w-5 h-5" />
                                            <span className="text-xs font-medium">Xem thêm</span>
                                        </div>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Collapse Button */}
                {isExpanded && (
                    <div className="flex justify-center mt-3">
                        <Button
                            onClick={collapse}
                            variant="outline"
                            size="sm"
                            className="border-pink-300 text-pink-600 hover:bg-pink-50 px-4 py-1 rounded-full transition-all duration-300"
                        >
                            <div className="flex items-center gap-1">
                                <ChevronUp className="w-3 h-3" />
                                <span className="text-xs">Thu gọn</span>
                            </div>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
