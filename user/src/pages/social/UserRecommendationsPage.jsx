"use client"

import React, { useState, useEffect } from "react"
import { User, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../../components/ui/button"
import UserCard from "../../components/recommendation/user/UserCard"
import UserCardSkeleton from "../../components/recommendation/user/UserCardSkeleton"
import ErrorState from "../../components/common/ErrorState"
import { getRecommendedUsers, getRecommendedUsersCaseLogin } from "../../services/recommendationService"
import { toggleFollow, batchCheckFollowStatus } from "../../services/followService"
import { useAuth } from "../../contexts/AuthContext"
import { useFollow } from "../../contexts/FollowContext"

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

const UserSection = ({ title, users, loading, pagination, onPageChange, onFollow, followingUsers, error, onRetry }) => (
    <div className="mb-16">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                <div className="w-1.5 h-10 bg-gradient-to-b from-pink-400 to-pink-600 rounded-full mr-4" />
                {title}
            </h2>
            {pagination && !error && (
                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border">
                    Trang {pagination.currentPage} / {pagination.totalPages}
                    <span className="ml-2 text-pink-600 font-medium">({pagination.totalCount} người dùng)</span>
                </div>
            )}
        </div>

        {error ? (
            <div className="grid grid-cols-1 gap-6">
                <ErrorState
                    title="Không thể tải danh sách người dùng"
                    message={error}
                    onRetry={onRetry}
                    type={error.includes("network") ? "network" : error.includes("server") ? "server" : "general"}
                />
            </div>
        ) : (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, index) => <UserCardSkeleton key={index} />)
                    ) : users.length > 0 ? (
                        users.map((user) => (
                            <UserCard key={user._id} user={user} onFollow={onFollow} isFollowing={followingUsers.has(user._id)} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16">
                            <User className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">Không có người dùng nào</h3>
                            <p className="text-gray-500">Hiện tại chưa có người dùng nào để hiển thị</p>
                        </div>
                    )}
                </div>

                {pagination && !loading && (
                    <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={onPageChange}
                        hasNext={pagination.hasNextPage}
                        hasPrev={pagination.hasPreviousPage}
                    />
                )}
            </>
        )}
    </div>
)

const UserRecommendationsPage = () => {
    const { isAuthenticated } = useAuth()
    const { updateFollowStatus } = useFollow()

    // State for recommended users (for non-logged users)
    const [recommendedUsers, setRecommendedUsers] = useState([])
    const [recommendedLoading, setRecommendedLoading] = useState(true)
    const [recommendedError, setRecommendedError] = useState(null)
    const [recommendedPagination, setRecommendedPagination] = useState(null)

    // State for login-based users (for logged users)
    const [loginBasedUsers, setLoginBasedUsers] = useState([])
    const [loginBasedLoading, setLoginBasedLoading] = useState(true)
    const [loginBasedError, setLoginBasedError] = useState(null)
    const [loginBasedPagination, setLoginBasedPagination] = useState(null)

    // Following state
    const [followingUsers, setFollowingUsers] = useState(new Set())

    // Batch check follow status for users
    const checkFollowStatusBatch = async (users) => {
        if (!isAuthenticated || users.length === 0) return

        try {
            const targets = users.map((user) => ({
                targetId: user._id,
                targetType: "user",
            }))

            const response = await batchCheckFollowStatus(targets)
            if (response.success) {
                const newFollowingUsers = new Set()
                Object.entries(response.data).forEach(([key, isFollowing]) => {
                    if (isFollowing) {
                        const [targetId] = key.split("_")
                        newFollowingUsers.add(targetId)
                    }
                })
                setFollowingUsers(newFollowingUsers)
            }
        } catch (error) {
            console.error("Error checking follow status:", error)
        }
    }

    // Load recommended users
    const loadRecommendedUsers = async (page = 1) => {
        try {
            setRecommendedLoading(true)
            setRecommendedError(null)

            const response = await getRecommendedUsers(page, 8, "score", "desc")

            if (response.success) {
                const users = response.data.recommendations || []
                setRecommendedUsers(users)
                setRecommendedPagination(response.data.pagination)

                // Check follow status for loaded users
                await checkFollowStatusBatch(users)
            } else {
                setRecommendedError(response.message || "Không thể tải dữ liệu")
            }
        } catch (error) {
            console.error("Error loading recommended users:", error)
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

    // Load login-based users
    const loadLoginBasedUsers = async (page = 1) => {
        if (!isAuthenticated) return

        try {
            setLoginBasedLoading(true)
            setLoginBasedError(null)

            const response = await getRecommendedUsersCaseLogin(page, 8, "user")

            if (response.success) {
                const users = response.data.recommendations || []
                setLoginBasedUsers(users)
                setLoginBasedPagination(response.data.pagination)

                // Check follow status for loaded users
                await checkFollowStatusBatch(users)
            } else {
                setLoginBasedError(response.message || "Không thể tải dữ liệu")
            }
        } catch (error) {
            console.error("Error loading login-based users:", error)
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
                setFollowingUsers((prev) => {
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
    const retryRecommendedUsers = () => {
        loadRecommendedUsers(recommendedPagination?.currentPage || 1)
    }

    const retryLoginBasedUsers = () => {
        loadLoginBasedUsers(loginBasedPagination?.currentPage || 1)
    }

    // Load data on component mount
    useEffect(() => {
        loadRecommendedUsers()
    }, [])

    useEffect(() => {
        if (isAuthenticated) {
            loadLoginBasedUsers()
        }
    }, [isAuthenticated])

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50/40 via-white to-purple-50/20">
            <div className="container mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold text-gray-900 mb-6">
                        Kết nối với những người
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 ml-3">
                            thú vị
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Khám phá và kết nối với những người dùng có cùng sở thích, chia sẻ những trải nghiệm tuyệt vời và xây dựng
                        cộng đồng mạnh mẽ
                    </p>
                </div>

                {/* Recommended Users Section */}
                <UserSection
                    title="🌟 Người dùng gợi ý"
                    users={recommendedUsers}
                    loading={recommendedLoading}
                    pagination={recommendedPagination}
                    onPageChange={loadRecommendedUsers}
                    onFollow={handleFollow}
                    followingUsers={followingUsers}
                    error={recommendedError}
                    onRetry={retryRecommendedUsers}
                />

                {/* Login-based Users Section */}
                {isAuthenticated && (
                    <UserSection
                        title="💝 Người dùng bạn có thể biết"
                        users={loginBasedUsers}
                        loading={loginBasedLoading}
                        pagination={loginBasedPagination}
                        onPageChange={loadLoginBasedUsers}
                        onFollow={handleFollow}
                        followingUsers={followingUsers}
                        error={loginBasedError}
                        onRetry={retryLoginBasedUsers}
                    />
                )}
            </div>
        </div>
    )
}

export default UserRecommendationsPage
