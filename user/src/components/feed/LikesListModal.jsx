"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { UserPlus, UserCheck, Loader2 } from "lucide-react"
import { toggleFollow } from "../../services/followService"
import { useFollow } from "../../contexts/FollowContext"
import { toast } from "sonner"
import { useAuth } from "../../contexts/AuthContext"

const FollowListModal = ({
    open,
    onOpenChange,
    likes = [],
    title = "Những người đã thích",
    emptyMessage = "Chưa có ai thích",
}) => {
    const { isAuthenticated, setShowLoginModal } = useAuth()
    const navigate = useNavigate()
    const { getFollowStatus, updateFollowStatus } = useFollow()
    const [followStates, setFollowStates] = useState({})
    const [loadingStates, setLoadingStates] = useState({})

    // Kiểm tra trạng thái follow khi modal mở
    useEffect(() => {
        if (open && likes.length > 0 && isAuthenticated) {
            checkFollowStatuses()
        }
    }, [open, likes])

    const checkFollowStatuses = async () => {
        try {
            const states = {}
            await Promise.all(
                likes.map(async (user) => {
                    try {
                        const targetType = user.type === "Shop" ? "shop" : "user"
                        const isFollowing = await getFollowStatus(user._id, targetType)
                        states[user._id] = isFollowing
                    } catch (error) {
                        console.error(`Error checking follow status for ${user._id}:`, error)
                        states[user._id] = false
                    }
                }),
            )
            setFollowStates(states)
        } catch (error) {
            console.error("Error checking follow statuses:", error)
        }
    }

    const handleToggleFollow = async (user) => {
        if (!isAuthenticated) return setShowLoginModal(true)

        const userId = user._id
        const targetType = user.type === "Shop" ? "shop" : "user"

        setLoadingStates((prev) => ({ ...prev, [userId]: true }))

        try {
            const response = await toggleFollow({
                targetId: userId,
                targetType: targetType,
            })

            const newFollowStatus = response.data?.isFollowing || false

            // Cập nhật local state
            setFollowStates((prev) => ({
                ...prev,
                [userId]: newFollowStatus,
            }))

            // Cập nhật context cache
            updateFollowStatus(userId, targetType, newFollowStatus)

            toast.success(
                newFollowStatus
                    ? `Đã follow ${user.type === "User" ? user.fullName : user.name}`
                    : `Đã unfollow ${user.type === "User" ? user.fullName : user.name}`,
            )
        } catch (error) {
            console.error("Error toggling follow:", error)
            toast.error("Có lỗi xảy ra khi thực hiện hành động")
        } finally {
            setLoadingStates((prev) => ({ ...prev, [userId]: false }))
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-md bg-white rounded-xl shadow-lg border-pink-100"
                overlayClassName="bg-black/20 backdrop-blur-sm"
            >
                <DialogHeader className="border-b border-pink-100 pb-3 mb-3">
                    <DialogTitle className="text-center text-lg font-semibold text-gray-800">
                        {title} ({likes.length})
                    </DialogTitle>
                </DialogHeader>

                {/* Danh sách người thích */}
                <div className="max-h-96 overflow-y-auto space-y-3 mt-2">
                    {likes.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">{emptyMessage}</div>
                    ) : (
                        likes.map((user) => {
                            const isFollowing = followStates[user._id] || false
                            const isLoading = loadingStates[user._id] || false

                            return (
                                <div
                                    key={user?._id}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-pink-50 transition-colors duration-200 border border-transparent hover:border-pink-100"
                                >
                                    <img
                                        src={user?.avatar || "/placeholder.svg?height=40&width=40"}
                                        alt={user?.type === "User" ? user?.fullName : user?.name}
                                        className="w-12 h-12 rounded-full object-cover cursor-pointer ring-2 ring-pink-100 hover:ring-pink-200 transition-all"
                                        onClick={() => navigate(`/feed/profile/${user?.slug}`)}
                                    />
                                    <div className="flex-1">
                                        <div
                                            className="font-medium text-sm cursor-pointer hover:text-pink-600 transition-colors flex items-center gap-2"
                                            onClick={() => navigate(`/feed/profile/${user?.slug}`)}
                                        >
                                            {user?.type === "User" ? user?.fullName : user?.name || "Người dùng"}
                                            {user?.type === "Shop" && (
                                                <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700 hover:bg-pink-200">
                                                    Shop
                                                </Badge>
                                            )}
                                        </div>
                                        {user?.bio && <p className="text-xs text-gray-500 mt-1 truncate">{user.bio}</p>}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={isFollowing ? "outline" : "default"}
                                        className={`flex items-center gap-2 min-w-[100px] transition-all duration-200 ${isFollowing
                                            ? "border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300"
                                            : "bg-pink-500 hover:bg-pink-600 text-white border-pink-500"
                                            }`}
                                        onClick={() => handleToggleFollow(user)}
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
                                </div>
                            )
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default FollowListModal
