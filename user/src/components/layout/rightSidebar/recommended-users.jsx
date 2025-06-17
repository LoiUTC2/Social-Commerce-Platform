"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { UserPlus, Users, ArrowRight, MessageCircle, ChevronUp, Loader2 } from "lucide-react"
import { Skeleton } from "../../../components/ui/skeleton"
import { useAuth } from "../../../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { cn } from "../../../lib/utils"
import { getRecommendedUsers, getRecommendedUsersCaseLogin } from "../../../services/recommendationService"

export default function RecommendedUsers() {
    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [error, setError] = useState(null)
    const [followingUsers, setFollowingUsers] = useState(new Set())
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMoreData, setHasMoreData] = useState(true)
    const [isExpanded, setIsExpanded] = useState(false)
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()

    const ITEMS_PER_PAGE = 5

    useEffect(() => {
        fetchRecommendedUsers(1, true) // Reset data when auth changes
    }, [isAuthenticated])

    const fetchRecommendedUsers = async (page = 1, isInitial = false) => {
        try {
            if (isInitial) {
                setIsLoading(true)
                setUsers([])
                setCurrentPage(1)
                setHasMoreData(true)
                setIsExpanded(false)
            } else {
                setIsLoadingMore(true)
            }

            setError(null)

            let response

            if (isAuthenticated) {
                response = await getRecommendedUsersCaseLogin(page, ITEMS_PER_PAGE, "user")
            } else {
                response = await getRecommendedUsers(page, ITEMS_PER_PAGE)
            }

            console.log("API Response:", response)

            if (response.success) {
                let usersData = []

                if (isAuthenticated) {
                    usersData = response.data?.recommendations || []
                } else {
                    usersData = response.data?.recommendations || []
                }

                const filteredUsers = usersData.filter((item) => item.type === "user" || item.fullName || item.email)

                if (isInitial) {
                    setUsers(filteredUsers)
                } else {
                    setUsers((prev) => [...prev, ...filteredUsers])
                }

                // Check if there's more data
                const hasMore = filteredUsers.length === ITEMS_PER_PAGE
                setHasMoreData(hasMore)

                if (!isInitial) {
                    setCurrentPage(page)
                    setIsExpanded(true)
                }
            } else {
                setError("Không thể tải gợi ý kết bạn")
            }
        } catch (err) {
            console.error("Lỗi khi tải gợi ý kết bạn:", err)
            setError("Có lỗi xảy ra khi tải gợi ý")
        } finally {
            setIsLoading(false)
            setIsLoadingMore(false)
        }
    }

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMoreData) {
            fetchRecommendedUsers(currentPage + 1, false)
        }
    }

    const handleCollapse = () => {
        setUsers((prev) => prev.slice(0, ITEMS_PER_PAGE))
        setIsExpanded(false)
        setCurrentPage(1)
        setHasMoreData(true)
    }

    const handleUserClick = (user) => {
        navigate(`/profile/${user.slug || user._id}`)
    }

    const handleViewAllUsers = () => {
        navigate("/users/recommended")
    }

    const handleFollow = (e, userId) => {
        e.stopPropagation()
        setFollowingUsers((prev) => new Set([...prev, userId]))
        console.log("Theo dõi user:", userId)
    }

    const handleMessage = (e, user) => {
        e.stopPropagation()
        console.log("Nhắn tin với:", user.fullName)
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
                            onClick={() => fetchRecommendedUsers(1, true)}
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
                        <Users className="w-4 h-4 text-pink-500" />
                        <h3 className="font-semibold text-gray-900 text-sm">Gợi ý kết bạn</h3>
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
                                <Skeleton className="h-6 w-16 rounded bg-gradient-to-r from-pink-100 to-rose-100" />
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
                        <Users className="w-4 h-4 text-pink-500" />
                        <h3 className="font-semibold text-gray-900 text-sm">Gợi ý kết bạn</h3>
                    </div>
                    {users.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-2 py-1 bg-pink-100 text-pink-700">
                            {users.length}
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {users.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Chưa có gợi ý kết bạn</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-1">
                            {users.map((user, index) => (
                                <div
                                    key={`${user._id}-${index}`}
                                    className="group px-4 py-3 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 transition-all duration-200 cursor-pointer border-b border-gray-50 last:border-b-0"
                                    onClick={() => handleUserClick(user)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img
                                                src={user.avatar || "/placeholder.svg?height=48&width=48"}
                                                alt={user.fullName}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-pink-100 group-hover:border-pink-200 transition-colors"
                                            />
                                            {user.isActive && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-sm text-gray-900 truncate group-hover:text-pink-700 transition-colors">
                                                    {user.fullName}
                                                </h4>
                                                {user.roles?.includes("seller") && (
                                                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-pink-200 text-pink-600">
                                                        Seller
                                                    </Badge>
                                                )}
                                            </div>
                                            {user.bio && <p className="text-xs text-gray-500 line-clamp-1 mb-1">{user.bio}</p>}
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3 h-3 text-gray-400" />
                                                    <span className="text-xs text-gray-500">{user.followersCount || 0} người theo dõi</span>
                                                </div>
                                                {user.gender && (
                                                    <>
                                                        <span className="text-xs text-gray-400">•</span>
                                                        <span className="text-xs text-gray-500 capitalize">{user.gender}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => handleMessage(e, user)}
                                            >
                                                <MessageCircle className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant={followingUsers.has(user._id) ? "outline" : "default"}
                                                size="sm"
                                                className={cn(
                                                    "h-7 px-3 text-xs transition-all",
                                                    followingUsers.has(user._id)
                                                        ? "border-pink-200 text-pink-600 hover:bg-pink-50"
                                                        : "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white",
                                                )}
                                                onClick={(e) => handleFollow(e, user._id)}
                                                disabled={followingUsers.has(user._id)}
                                            >
                                                {followingUsers.has(user._id) ? (
                                                    "Đã theo dõi"
                                                ) : (
                                                    <>
                                                        <UserPlus className="w-3 h-3 mr-1" />
                                                        Theo dõi
                                                    </>
                                                )}
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
                                            <span className="text-sm">Xem thêm 5 người</span>
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
                                    onClick={handleViewAllUsers}
                                >
                                    <span className="text-sm">Khám phá tất cả người dùng</span>
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
