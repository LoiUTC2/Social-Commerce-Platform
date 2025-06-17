"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Store, Star, ArrowRight, Crown, Heart, Users, ChevronUp, Loader2 } from "lucide-react"
import { Skeleton } from "../../../components/ui/skeleton"
import { useAuth } from "../../../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { cn } from "../../../lib/utils"
import { getRecommendedShops, getRecommendedShopsCaseLogin } from "../../../services/recommendationService"

export default function RecommendedShops() {
    const [shops, setShops] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [error, setError] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMoreData, setHasMoreData] = useState(true)
    const [isExpanded, setIsExpanded] = useState(false)
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()

    const ITEMS_PER_PAGE = 5

    useEffect(() => {
        fetchRecommendedShops(1, true) // Reset data when auth changes
    }, [isAuthenticated])

    const fetchRecommendedShops = async (page = 1, isInitial = false) => {
        try {
            if (isInitial) {
                setIsLoading(true)
                setShops([])
                setCurrentPage(1)
                setHasMoreData(true)
                setIsExpanded(false)
            } else {
                setIsLoadingMore(true)
            }

            setError(null)

            let response

            if (isAuthenticated) {
                response = await getRecommendedShopsCaseLogin(page, ITEMS_PER_PAGE, "shop")
            } else {
                response = await getRecommendedShops(page, ITEMS_PER_PAGE)
            }

            console.log("API Response:", response)

            if (response.success) {
                let shopsData = []

                if (isAuthenticated) {
                    shopsData = response.data?.recommendations || []
                } else {
                    shopsData = response.data?.shops || []
                }

                const filteredShops = shopsData.filter((item) => item.type === "shop" || item.seller || item.name)

                if (isInitial) {
                    setShops(filteredShops)
                } else {
                    setShops((prev) => [...prev, ...filteredShops])
                }

                // Check if there's more data
                const hasMore = filteredShops.length === ITEMS_PER_PAGE
                setHasMoreData(hasMore)

                if (!isInitial) {
                    setCurrentPage(page)
                    setIsExpanded(true)
                }
            } else {
                setError("Không thể tải cửa hàng gợi ý")
            }
        } catch (err) {
            console.error("Lỗi khi tải cửa hàng gợi ý:", err)
            setError("Có lỗi xảy ra khi tải cửa hàng")
        } finally {
            setIsLoading(false)
            setIsLoadingMore(false)
        }
    }

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMoreData) {
            fetchRecommendedShops(currentPage + 1, false)
        }
    }

    const handleCollapse = () => {
        setShops((prev) => prev.slice(0, ITEMS_PER_PAGE))
        setIsExpanded(false)
        setCurrentPage(1)
        setHasMoreData(true)
    }

    const handleShopClick = (shop) => {
        navigate(`/shops/${shop.slug || shop._id}`)
    }

    const handleViewAllShops = () => {
        navigate("/shops/recommended")
    }

    const handleFollowShop = (e, shop) => {
        e.stopPropagation()
        console.log("Theo dõi cửa hàng:", shop.name)
    }

    const handleToggleFavorite = (e, shop) => {
        e.stopPropagation()
        console.log("Yêu thích cửa hàng:", shop.name)
    }

    if (error) {
        return (
            <Card className="shadow-sm border-0 bg-white">
                <CardContent className="p-4">
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-2">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchRecommendedShops(1, true)}
                            className="text-xs border-pink-200 text-pink-600 hover:bg-pink-50"
                        >
                            Thử lại
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (isLoading) {
        return (
            <Card className="shadow-sm border-0 bg-white">
                <CardHeader className="pb-3 pt-4 px-4">
                    <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-pink-500" />
                        <h3 className="font-semibold text-gray-900 text-sm">Cửa hàng gợi ý</h3>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-200 to-rose-200" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-3 w-full bg-gradient-to-r from-pink-100 to-rose-100" />
                                    <Skeleton className="h-3 w-16 bg-gradient-to-r from-pink-100 to-rose-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="shadow-sm border-0 bg-white overflow-hidden">
            <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-pink-500" />
                        <h3 className="font-semibold text-gray-900 text-sm">Cửa hàng gợi ý</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        {shops.length > 0 && (
                            <Badge variant="secondary" className="text-xs px-2 py-1 bg-pink-100 text-pink-700">
                                {shops.length}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {shops.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500">
                        <Store className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Chưa có cửa hàng gợi ý</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-1">
                            {shops.map((shop, index) => (
                                <div
                                    key={`${shop._id}-${index}`}
                                    className="group px-4 py-3 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 transition-all duration-200 cursor-pointer border-b border-gray-50 last:border-b-0"
                                    onClick={() => handleShopClick(shop)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img
                                                src={shop.avatar || shop.logo || "/placeholder.svg?height=48&width=48"}
                                                alt={shop.name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-pink-100 group-hover:border-pink-200 transition-colors"
                                            />
                                            {shop.status?.isApprovedCreate && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                            )}
                                            <div className="absolute -top-1 -left-1">
                                                <Badge
                                                    variant={index === 0 ? "default" : index === 1 ? "destructive" : "secondary"}
                                                    className={cn(
                                                        "text-xs px-1.5 py-0.5 h-5",
                                                        index === 0 && "bg-gradient-to-r from-pink-500 to-rose-500 text-white",
                                                        index === 1 && "bg-gradient-to-r from-red-500 to-pink-500 text-white",
                                                    )}
                                                >
                                                    {index === 0 ? "TOP" : index === 1 ? "HOT" : "NEW"}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm text-gray-900 truncate group-hover:text-pink-700 transition-colors">
                                                {shop.name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                {shop.stats?.rating?.avg > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                        <span className="text-xs text-gray-600">{shop.stats.rating.avg.toFixed(1)}</span>
                                                    </div>
                                                )}
                                                <span className="text-xs text-gray-400">•</span>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3 h-3 text-gray-400" />
                                                    <span className="text-xs text-gray-500">
                                                        {shop.followersCount || shop.stats?.followers?.length || 0} theo dõi
                                                    </span>
                                                </div>
                                            </div>
                                            {shop.description && (
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{shop.description}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-500"
                                                onClick={(e) => handleToggleFavorite(e, shop)}
                                            >
                                                <Heart className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-xs hover:bg-pink-50 hover:text-pink-600"
                                                onClick={(e) => handleFollowShop(e, shop)}
                                            >
                                                Theo dõi
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Loading More Indicator */}
                        {isLoadingMore && (
                            <div className="px-4 py-3 flex items-center justify-center">
                                <Loader2 className="w-4 h-4 animate-spin text-pink-500 mr-2" />
                                <span className="text-sm text-gray-500">Đang tải thêm...</span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="p-3 border-t border-gray-100 bg-gradient-to-r from-pink-50/50 to-rose-50/50">
                            <div className="flex flex-col gap-2">
                                {/* Load More / Collapse Buttons */}
                                <div className="flex gap-2">
                                    {hasMoreData && !isExpanded && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 justify-center gap-2 text-pink-600 hover:text-pink-700 hover:bg-pink-50 font-medium"
                                            onClick={handleLoadMore}
                                            disabled={isLoadingMore}
                                        >
                                            <span className="text-sm">Xem thêm 5 cửa hàng</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    )}

                                    {hasMoreData && isExpanded && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 justify-center gap-2 text-pink-600 hover:text-pink-700 hover:bg-pink-50 font-medium"
                                            onClick={handleLoadMore}
                                            disabled={isLoadingMore}
                                        >
                                            <span className="text-sm">Xem thêm</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    )}

                                    {isExpanded && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 justify-center gap-2 border-pink-200 text-pink-600 hover:bg-pink-50 font-medium"
                                            onClick={handleCollapse}
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                            <span className="text-sm">Thu gọn</span>
                                        </Button>
                                    )}
                                </div>

                                {/* View All Button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-center gap-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 font-medium border-t border-gray-200 pt-2"
                                    onClick={handleViewAllShops}
                                >
                                    <span className="text-sm">Khám phá tất cả cửa hàng</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
