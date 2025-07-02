"use client"

import React, { useState, useEffect } from "react"
import { Package, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../../../components/ui/button"
import ShopCard from "../../../components//marketplace/shops/ShopCard"
import ShopCardSkeleton from "../../../components//marketplace/shops/ShopCardSkeleton"
import ErrorState from "../../../components/common/ErrorState"
import { getRecommendedShops, getRecommendedShopsCaseLogin } from "../../../services/recommendationService"
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

const ShopSection = ({ title, shops, loading, pagination, onPageChange, onFollow, followingShops, error, onRetry }) => (
    <div className="mb-16">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                <div className="w-1.5 h-10 bg-gradient-to-b from-pink-400 to-pink-600 rounded-full mr-4" />
                {title}
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
                            <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">Không có cửa hàng nào</h3>
                            <p className="text-gray-500">Hiện tại chưa có cửa hàng nào để hiển thị</p>
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

const ShopRecommendationsPage = () => {
    const { isAuthenticated } = useAuth()
    const { updateFollowStatus } = useFollow()

    // State for recommended shops (for non-logged users)
    const [recommendedShops, setRecommendedShops] = useState([])
    const [recommendedLoading, setRecommendedLoading] = useState(true)
    const [recommendedError, setRecommendedError] = useState(null)
    const [recommendedPagination, setRecommendedPagination] = useState(null)

    // State for login-based shops (for logged users)
    const [loginBasedShops, setLoginBasedShops] = useState([])
    const [loginBasedLoading, setLoginBasedLoading] = useState(true)
    const [loginBasedError, setLoginBasedError] = useState(null)
    const [loginBasedPagination, setLoginBasedPagination] = useState(null)

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
                setFollowingShops(newFollowingShops)
            }
        } catch (error) {
            console.error("Error checking follow status:", error)
        }
    }

    // Load recommended shops
    const loadRecommendedShops = async (page = 1) => {
        try {
            setRecommendedLoading(true)
            setRecommendedError(null)

            const response = await getRecommendedShops(page, 8, {
                sortBy: "recommended",
                sortOrder: "desc",
            })

            if (response.success) {
                const shops = response.data.shops || []
                setRecommendedShops(shops)
                setRecommendedPagination(response.data.pagination)

                // Check follow status for loaded shops
                await checkFollowStatusBatch(shops)
            } else {
                setRecommendedError(response.message || "Không thể tải dữ liệu")
            }
        } catch (error) {
            console.error("Error loading recommended shops:", error)
            let errorMessage = "Có lỗi xảy ra khi tải dữ liệu"

            if (error.message.includes("fetch")) {
                errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn."
            } else if (error.message.includes("500")) {
                errorMessage = "Lỗi server. Vui lòng thử lại sau ít phút."
            }

            setRecommendedError(errorMessage)
        } finally {
            setRecommendedLoading(false)
        }
    }

    // Load login-based shops
    const loadLoginBasedShops = async (page = 1) => {
        if (!isAuthenticated) return

        try {
            setLoginBasedLoading(true)
            setLoginBasedError(null)

            const response = await getRecommendedShopsCaseLogin(page, 8, "shop")

            if (response.success) {
                const shops = response.data.recommendations || []
                setLoginBasedShops(shops)
                setLoginBasedPagination(response.data.pagination)

                // Check follow status for loaded shops
                await checkFollowStatusBatch(shops)
            } else {
                setLoginBasedError(response.message || "Không thể tải dữ liệu")
            }
        } catch (error) {
            console.error("Error loading login-based shops:", error)
            let errorMessage = "Có lỗi xảy ra khi tải dữ liệu"

            if (error.message.includes("fetch")) {
                errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn."
            } else if (error.message.includes("500")) {
                errorMessage = "Lỗi server. Vui lòng thử lại sau ít phút."
            }

            setLoginBasedError(errorMessage)
        } finally {
            setLoginBasedLoading(false)
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
    const retryRecommendedShops = () => {
        loadRecommendedShops(recommendedPagination?.currentPage || 1)
    }

    const retryLoginBasedShops = () => {
        loadLoginBasedShops(loginBasedPagination?.currentPage || 1)
    }

    // Load data on component mount
    useEffect(() => {
        loadRecommendedShops()
    }, [])

    useEffect(() => {
        if (isAuthenticated) {
            loadLoginBasedShops()
        }
    }, [isAuthenticated])

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50/40 via-white to-purple-50/20">
            <div className="container mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold text-gray-900 mb-6">
                        Khám phá các cửa hàng
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 ml-3">
                            tuyệt vời
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Tìm kiếm những cửa hàng phù hợp với sở thích của bạn và khám phá những sản phẩm độc đáo, chất lượng từ các
                        thương hiệu uy tín
                    </p>
                </div>

                {/* Recommended Shops Section */}
                <ShopSection
                    title="🌟 Cửa hàng gợi ý"
                    shops={recommendedShops}
                    loading={recommendedLoading}
                    pagination={recommendedPagination}
                    onPageChange={loadRecommendedShops}
                    onFollow={handleFollow}
                    followingShops={followingShops}
                    error={recommendedError}
                    onRetry={retryRecommendedShops}
                />

                {/* Login-based Shops Section */}
                {isAuthenticated && (
                    <ShopSection
                        title="💝 Cửa hàng bạn có thể biết"
                        shops={loginBasedShops}
                        loading={loginBasedLoading}
                        pagination={loginBasedPagination}
                        onPageChange={loadLoginBasedShops}
                        onFollow={handleFollow}
                        followingShops={followingShops}
                        error={loginBasedError}
                        onRetry={retryLoginBasedShops}
                    />
                )}
            </div>
        </div>
    )
}

export default ShopRecommendationsPage
