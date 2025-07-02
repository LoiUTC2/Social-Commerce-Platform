"use client"

import React, { useState, useEffect } from "react"
import { Star, ChevronLeft, ChevronRight, Award, TrendingUp } from "lucide-react"
import { Button } from "../../../components/ui/button"
import ShopCard from "../../../components/marketplace/shops/ShopCard"
import ShopCardSkeleton from "../../../components/marketplace/shops/ShopCardSkeleton"
import ErrorState from "../../../components/common/ErrorState"
import { getShops } from "../../../services/shopService"
import { toggleFollow, batchCheckFollowStatus } from "../../../services/followService"
import { useAuth } from "../../../contexts/AuthContext"
import { useFollow } from "../../../contexts/FollowContext"

const Pagination = ({ currentPage, totalPages, onPageChange, hasNext, hasPrev }) => {
    const getVisiblePages = () => {
        const delta = 2
        const range = []
        const rangeWithDots = []

        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i)
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, "...")
        } else {
            rangeWithDots.push(1)
        }

        rangeWithDots.push(...range)

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push("...", totalPages)
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages)
        }

        return rangeWithDots
    }

    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-center space-x-2 mt-8">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!hasPrev}
                className="bg-white hover:bg-pink-50 border-pink-200 text-pink-600 disabled:opacity-50 shadow-sm"
            >
                <ChevronLeft className="w-4 h-4" />
            </Button>

            {getVisiblePages().map((page, index) => (
                <React.Fragment key={index}>
                    {page === "..." ? (
                        <span className="px-2 text-gray-400">...</span>
                    ) : (
                        <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => onPageChange(page)}
                            className={
                                currentPage === page
                                    ? "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white border-0 shadow-lg"
                                    : "bg-white hover:bg-pink-50 border-pink-200 text-pink-600 shadow-sm"
                            }
                        >
                            {page}
                        </Button>
                    )}
                </React.Fragment>
            ))}

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNext}
                className="bg-white hover:bg-pink-50 border-pink-200 text-pink-600 disabled:opacity-50 shadow-sm"
            >
                <ChevronRight className="w-4 h-4" />
            </Button>
        </div>
    )
}

const ShopSection = ({ title, icon, shops, loading, pagination, onPageChange, onFollow, followingShops, error, onRetry }) => (
    <div className="mb-16">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                <div className="w-1.5 h-10 bg-gradient-to-b from-pink-400 to-pink-600 rounded-full mr-4" />
                {icon}
                <span className="ml-2">{title}</span>
            </h2>
            {pagination && !error && (
                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border">
                    Trang {pagination.currentPage} / {pagination.totalPages}
                    <span className="ml-2 text-pink-600 font-medium">({pagination.totalCount} cửa hàng)</span>
                </div>
            )}
        </div>

        {error ? (
            <div className="grid grid-cols-1 gap-6">
                <ErrorState
                    title="Không thể tải danh sách cửa hàng"
                    message={error}
                    onRetry={onRetry}
                    type={error.includes("network") ? "network" : error.includes("server") ? "server" : "general"}
                />
            </div>
        ) : (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, index) => <ShopCardSkeleton key={index} />)
                    ) : shops.length > 0 ? (
                        shops.map((shop) => (
                            <ShopCard key={shop._id} shop={shop} onFollow={onFollow} isFollowing={followingShops.has(shop._id)} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16">
                            <Star className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">Không có cửa hàng nào</h3>
                            <p className="text-gray-500">Hiện tại chưa có cửa hàng nổi bật nào để hiển thị</p>
                        </div>
                    )}
                </div>

                {pagination && !loading && (
                    <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={onPageChange}
                        hasNext={pagination.hasNext}
                        hasPrev={pagination.hasPrev}
                    />
                )}
            </>
        )}
    </div>
)

const FeaturedShopsPage = () => {
    const { isAuthenticated } = useAuth()
    const { updateFollowStatus } = useFollow()

    // State for featured shops (highest rated)
    const [featuredShops, setFeaturedShops] = useState([])
    const [featuredLoading, setFeaturedLoading] = useState(true)
    const [featuredError, setFeaturedError] = useState(null)
    const [featuredPagination, setFeaturedPagination] = useState(null)

    // State for trending shops (newest with good ratings)
    const [trendingShops, setTrendingShops] = useState([])
    const [trendingLoading, setTrendingLoading] = useState(true)
    const [trendingError, setTrendingError] = useState(null)
    const [trendingPagination, setTrendingPagination] = useState(null)

    // Following state
    const [followingShops, setFollowingShops] = useState(new Set())

    // Batch check follow status for shops
    const checkFollowStatusBatch = async (shops) => {
        if (!isAuthenticated || shops.length === 0) return

        try {
            const targets = shops.map((shop) => ({
                targetId: shop._id,
                targetType: "shop",
            }))

            const response = await batchCheckFollowStatus(targets)
            if (response.success) {
                const newFollowingShops = new Set()
                Object.entries(response.data).forEach(([key, isFollowing]) => {
                    if (isFollowing) {
                        const [targetId] = key.split("_")
                        newFollowingShops.add(targetId)
                    }
                })
                setFollowingShops(prev => new Set([...prev, ...newFollowingShops]))
            }
        } catch (error) {
            console.error("Error checking follow status:", error)
        }
    }

    // Load featured shops (highest rated)
    const loadFeaturedShops = async (page = 1) => {
        try {
            setFeaturedLoading(true)
            setFeaturedError(null)

            const response = await getShops({
                page,
                limit: 8,
                sortBy: "rating",
                order: "desc",
                status: "active",
            })

            if (response.success) {
                const shops = response.data.shops || []
                setFeaturedShops(shops)

                // Transform pagination data to match component expectations
                const pagination = response.data.pagination
                setFeaturedPagination({
                    currentPage: pagination.page,
                    totalPages: pagination.totalPages,
                    totalCount: pagination.total,
                    hasNext: pagination.page < pagination.totalPages,
                    hasPrev: pagination.page > 1
                })

                // Check follow status for loaded shops
                await checkFollowStatusBatch(shops)
            } else {
                setFeaturedError(response.message || "Không thể tải dữ liệu")
            }
        } catch (error) {
            console.error("Error loading featured shops:", error)
            let errorMessage = "Có lỗi xảy ra khi tải dữ liệu"

            if (error.message.includes("fetch")) {
                errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn."
            } else if (error.message.includes("500")) {
                errorMessage = "Lỗi server. Vui lòng thử lại sau ít phút."
            }

            setFeaturedError(errorMessage)
        } finally {
            setFeaturedLoading(false)
        }
    }

    // Load trending shops (newest)
    const loadTrendingShops = async (page = 1) => {
        try {
            setTrendingLoading(true)
            setTrendingError(null)

            const response = await getShops({
                page,
                limit: 8,
                sortBy: "createdAt",
                order: "desc",
                status: "active",
            })

            if (response.success) {
                const shops = response.data.shops || []
                setTrendingShops(shops)

                // Transform pagination data to match component expectations
                const pagination = response.data.pagination
                setTrendingPagination({
                    currentPage: pagination.page,
                    totalPages: pagination.totalPages,
                    totalCount: pagination.total,
                    hasNext: pagination.page < pagination.totalPages,
                    hasPrev: pagination.page > 1
                })

                // Check follow status for loaded shops
                await checkFollowStatusBatch(shops)
            } else {
                setTrendingError(response.message || "Không thể tải dữ liệu")
            }
        } catch (error) {
            console.error("Error loading trending shops:", error)
            let errorMessage = "Có lỗi xảy ra khi tải dữ liệu"

            if (error.message.includes("fetch")) {
                errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn."
            } else if (error.message.includes("500")) {
                errorMessage = "Lỗi server. Vui lòng thử lại sau ít phút."
            }

            setTrendingError(errorMessage)
        } finally {
            setTrendingLoading(false)
        }
    }

    // Handle follow/unfollow
    const handleFollow = async (targetId, targetType) => {
        try {
            const response = await toggleFollow({ targetId, targetType })

            if (response.success) {
                const isFollowing = response.data.isFollowing

                // Update local state
                setFollowingShops((prev) => {
                    const newSet = new Set(prev)
                    if (isFollowing) {
                        newSet.add(targetId)
                    } else {
                        newSet.delete(targetId)
                    }
                    return newSet
                })

                // Update follow context cache
                updateFollowStatus(targetId, targetType, isFollowing)

                console.log(`${isFollowing ? "Followed" : "Unfollowed"} ${targetType}:`, targetId)
            }
        } catch (error) {
            console.error("Error toggling follow:", error)
        }
    }

    // Retry handlers
    const retryFeaturedShops = () => {
        loadFeaturedShops(featuredPagination?.currentPage || 1)
    }

    const retryTrendingShops = () => {
        loadTrendingShops(trendingPagination?.currentPage || 1)
    }

    // Handle page change for featured shops
    const handleFeaturedPageChange = (page) => {
        loadFeaturedShops(page)
    }

    // Handle page change for trending shops  
    const handleTrendingPageChange = (page) => {
        loadTrendingShops(page)
    }

    // Load data on component mount
    useEffect(() => {
        loadFeaturedShops()
        loadTrendingShops()
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50/40 via-white to-purple-50/20">
            <div className="container mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="flex items-center justify-center mb-6">
                        <Award className="w-12 h-12 text-pink-500 mr-4" />
                        <h1 className="text-5xl font-bold text-gray-900">
                            Cửa hàng
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 ml-3">
                                nổi bật
                            </span>
                        </h1>
                    </div>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Khám phá những cửa hàng được đánh giá cao nhất và các thương hiệu mới nổi đang thu hút sự chú ý của cộng đồng
                    </p>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl mx-auto mb-4">
                                <Star className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Đánh giá cao</h3>
                            <p className="text-gray-600 text-sm">Cửa hàng với rating trên 4.5 sao</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl mx-auto mb-4">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chất lượng</h3>
                            <p className="text-gray-600 text-sm">Sản phẩm và dịch vụ tốt nhất</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-pink-600 to-purple-500 rounded-xl mx-auto mb-4">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xu hướng</h3>
                            <p className="text-gray-600 text-sm">Thương hiệu mới và đang phát triển</p>
                        </div>
                    </div>
                </div>

                {/* Featured Shops Section */}
                <ShopSection
                    title="Cửa hàng được yêu thích nhất"
                    icon={<Star className="w-8 h-8 text-pink-500" />}
                    shops={featuredShops}
                    loading={featuredLoading}
                    pagination={featuredPagination}
                    onPageChange={handleFeaturedPageChange}
                    onFollow={handleFollow}
                    followingShops={followingShops}
                    error={featuredError}
                    onRetry={retryFeaturedShops}
                />

                {/* Trending Shops Section */}
                <ShopSection
                    title="Cửa hàng mới và đang hot"
                    icon={<TrendingUp className="w-8 h-8 text-purple-500" />}
                    shops={trendingShops}
                    loading={trendingLoading}
                    pagination={trendingPagination}
                    onPageChange={handleTrendingPageChange}
                    onFollow={handleFollow}
                    followingShops={followingShops}
                    error={trendingError}
                    onRetry={retryTrendingShops}
                />
            </div>
        </div>
    )
}

export default FeaturedShopsPage