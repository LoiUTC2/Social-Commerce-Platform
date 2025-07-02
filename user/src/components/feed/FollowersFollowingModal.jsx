"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { UserPlus, UserCheck, Loader2, Users, HeartIcon as UserHeart } from "lucide-react"
import { getFollowList, toggleFollow } from "../../services/followService"
import { useFollow } from "../../contexts/FollowContext"
import { useAuth } from "../../contexts/AuthContext"
import { toast } from "sonner"

const FollowersFollowingModal = ({
    open,
    onOpenChange,
    userSlug,
    initialTab = "followers", // "followers" hoặc "following"
}) => {
    const navigate = useNavigate()
    const { getFollowStatus, updateFollowStatus } = useFollow()
    const { user: currentUser, isAuthenticated, setShowLoginModal } = useAuth()

    const [activeTab, setActiveTab] = useState(initialTab)
    const [followersData, setFollowersData] = useState({ list: [], loading: false, hasMore: true, page: 1 })
    const [followingData, setFollowingData] = useState({ list: [], loading: false, hasMore: true, page: 1 })
    const [followStates, setFollowStates] = useState({})
    const [loadingStates, setLoadingStates] = useState({})

    // Load dữ liệu khi modal mở
    useEffect(() => {
        if (open && userSlug) {
            setActiveTab(initialTab) // Reset tab khi modal mở
            loadFollowData("followers", true)
            loadFollowData("following", true)
        }
    }, [open, userSlug, initialTab])

    const loadFollowData = async (listType, reset = false) => {
        const currentData = listType === "followers" ? followersData : followingData
        const setData = listType === "followers" ? setFollowersData : setFollowingData

        if (currentData.loading || (!reset && !currentData.hasMore)) return

        setData((prev) => ({ ...prev, loading: true }))

        try {
            const page = reset ? 1 : currentData.page
            const response = await getFollowList({
                slug: userSlug,
                listType,
                page,
                limit: 20,
            })

            const newList = response.data?.list || []

            setData((prev) => ({
                ...prev,
                list: reset ? newList : [...prev.list, ...newList],
                page: page + 1,
                hasMore: newList.length === 20,
                loading: false,
            }))

            // Kiểm tra trạng thái follow cho các user mới
            if (isAuthenticated && newList.length > 0) {
                checkFollowStatuses(newList)
            }
        } catch (error) {
            console.error(`Error loading ${listType}:`, error)
            toast.error(`Không thể tải danh sách ${listType === "followers" ? "người theo dõi" : "đang theo dõi"}`)
            setData((prev) => ({ ...prev, loading: false }))
        }
    }

    const checkFollowStatuses = async (users) => {
        try {
            const states = {}
            await Promise.all(
                users.map(async (user) => {
                    try {
                        const targetType = user.type === "shop" ? "shop" : "user"
                        const isFollowing = await getFollowStatus(user._id, targetType)
                        states[user._id] = isFollowing
                    } catch (error) {
                        states[user._id] = false
                    }
                }),
            )
            setFollowStates((prev) => ({ ...prev, ...states }))
        } catch (error) {
            console.error("Error checking follow statuses:", error)
        }
    }

    const handleToggleFollow = async (user) => {
        // Kiểm tra đăng nhập trước
        if (!isAuthenticated) {
            setShowLoginModal(true)
            return
        }

        const userId = user._id
        const targetType = user.type === "shop" ? "shop" : "user"

        setLoadingStates((prev) => ({ ...prev, [userId]: true }))

        try {
            const response = await toggleFollow({
                targetId: userId,
                targetType: targetType,
            })

            const newFollowStatus = response.data?.isFollowing || false

            setFollowStates((prev) => ({
                ...prev,
                [userId]: newFollowStatus,
            }))

            updateFollowStatus(userId, targetType, newFollowStatus)

            toast.success(
                newFollowStatus
                    ? `Đã follow ${user.type === "shop" ? user.name : user.fullName}`
                    : `Đã unfollow ${user.type === "shop" ? user.name : user.fullName}`,
            )
        } catch (error) {
            console.error("Error toggling follow:", error)
            toast.error("Có lỗi xảy ra khi thực hiện hành động")
        } finally {
            setLoadingStates((prev) => ({ ...prev, [userId]: false }))
        }
    }

    const handleLoadMore = () => {
        loadFollowData(activeTab)
    }

    const currentData = activeTab === "followers" ? followersData : followingData

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-lg bg-white rounded-xl shadow-lg border-pink-100 max-h-[80vh]"
                overlayClassName="bg-black/20 backdrop-blur-sm"
            >
                <DialogHeader className="border-b border-pink-100 pb-3">
                    <DialogTitle className="text-center text-lg font-semibold text-gray-800">Danh sách theo dõi</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-pink-50 border border-pink-100">
                        <TabsTrigger
                            value="followers"
                            className="data-[state=active]:bg-pink-500 data-[state=active]:text-white flex items-center gap-2"
                        >
                            <UserHeart size={16} />
                            Người theo dõi ({followersData.list.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="following"
                            className="data-[state=active]:bg-pink-500 data-[state=active]:text-white flex items-center gap-2"
                        >
                            <Users size={16} />
                            Đang theo dõi ({followingData.list.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="followers" className="mt-4">
                        <FollowList
                            data={followersData}
                            currentUser={currentUser}
                            followStates={followStates}
                            loadingStates={loadingStates}
                            onToggleFollow={handleToggleFollow}
                            onLoadMore={handleLoadMore}
                            navigate={navigate}
                            isAuthenticated={isAuthenticated}
                            emptyMessage="Chưa có ai theo dõi"
                        />
                    </TabsContent>

                    <TabsContent value="following" className="mt-4">
                        <FollowList
                            data={followingData}
                            currentUser={currentUser}
                            followStates={followStates}
                            loadingStates={loadingStates}
                            onToggleFollow={handleToggleFollow}
                            onLoadMore={handleLoadMore}
                            navigate={navigate}
                            isAuthenticated={isAuthenticated}
                            emptyMessage="Chưa theo dõi ai"
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

// Component con để render danh sách
const FollowList = ({
    data,
    currentUser,
    followStates,
    loadingStates,
    onToggleFollow,
    onLoadMore,
    navigate,
    isAuthenticated,
    emptyMessage,
}) => {
    return (
        <div className="max-h-96 overflow-y-auto space-y-3">
            {data.list.length === 0 && !data.loading ? (
                <div className="text-center text-gray-500 py-10">{emptyMessage}</div>
            ) : (
                <>
                    {data.list.map((user) => {
                        const isFollowing = followStates[user._id] || false
                        const isLoading = loadingStates[user._id] || false
                        const isCurrentUser = user._id === currentUser?._id

                        return (
                            <div
                                key={user._id}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-pink-50 transition-colors duration-200 border border-transparent hover:border-pink-100"
                            >
                                <img
                                    src={user.avatar || "/placeholder.svg?height=40&width=40"}
                                    alt={user.type === "shop" ? user.name : user.fullName}
                                    className="w-12 h-12 rounded-full object-cover cursor-pointer ring-2 ring-pink-100 hover:ring-pink-200 transition-all"
                                    onClick={() => navigate(`/feed/profile/${user.slug}`)}
                                />
                                <div className="flex-1">
                                    <div
                                        className="font-medium text-sm cursor-pointer hover:text-pink-600 transition-colors flex items-center gap-2"
                                        onClick={() => navigate(`/feed/profile/${user.slug}`)}
                                    >
                                        {user.type === "shop" ? user.name : user.fullName || "Người dùng"}
                                        {user.type === "shop" && (
                                            <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700 hover:bg-pink-200">
                                                Shop
                                            </Badge>
                                        )}
                                    </div>
                                    {user.bio && <p className="text-xs text-gray-500 mt-1 truncate">{user.bio}</p>}
                                </div>
                                {!isCurrentUser && (
                                    <Button
                                        size="sm"
                                        variant={isFollowing ? "outline" : "default"}
                                        className={`flex items-center gap-2 min-w-[100px] transition-all duration-200 ${isFollowing
                                            ? "border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300"
                                            : "bg-pink-500 hover:bg-pink-600 text-white border-pink-500"
                                            }`}
                                        onClick={() => onToggleFollow(user)}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : isFollowing ? (
                                            <>
                                                <UserCheck size={14} />
                                                Đang follow
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={14} />
                                                Follow
                                            </>
                                        )}
                                    </Button>
                                )}

                            </div>
                        )
                    })}

                    {/* Load more button */}
                    {data.hasMore && (
                        <div className="text-center pt-4">
                            <Button
                                variant="outline"
                                onClick={onLoadMore}
                                disabled={data.loading}
                                className="border-pink-200 text-pink-600 hover:bg-pink-50 bg-transparent"
                            >
                                {data.loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin mr-2" />
                                        Đang tải...
                                    </>
                                ) : (
                                    "Xem thêm"
                                )}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default FollowersFollowingModal
