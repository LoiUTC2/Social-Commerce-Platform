"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Heart, MessageCircle, Share, ShoppingCart } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { vi } from "date-fns/locale"
import { getPostShares, likePost, sharePost } from "../../services/postInteractionService"
import { useAuth } from "../../contexts/AuthContext"
import { toast } from "sonner"

export default function SharesListModal({ open, onOpenChange, shares }) {
    const [sharesList, setSharesList] = useState(shares || [])
    const [page, setPage] = useState(1)
    const [limit] = useState(5)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [interactions, setInteractions] = useState({})
    const { user, setShowLoginModal } = useAuth()

    useEffect(() => {
        setSharesList(shares || [])
        setPage(1)
        const initialInteractions = {}
        shares?.forEach((share) => {
            initialInteractions[share._id] = {
                liked: user ? share.likedBy?.includes(user._id) : false,
                likesCount: share.likesCount || 0,
                commentsCount: share.commentsCount || 0,
                sharesCount: share.sharesCount || 0,
            }
        })
        setInteractions(initialInteractions)
    }, [shares, user])

    const fetchShares = async (pageToFetch) => {
        try {
            const postId = shares[0]?.sharedPost || shares[0]?._id
            if (!postId) return
            const res = await getPostShares(postId, { page: pageToFetch, limit })
            const { shares: newShares, pagination } = res.data
            setSharesList(newShares)
            setTotalPages(pagination.totalPages)
            setTotalItems(pagination.totalItems)
            setPage(pageToFetch)

            const updatedInteractions = { ...interactions }
            newShares.forEach((share) => {
                updatedInteractions[share._id] = {
                    liked: user ? share.likedBy?.includes(user._id) : false,
                    likesCount: share.likesCount || 0,
                    commentsCount: share.commentsCount || 0,
                    sharesCount: share.sharesCount || 0,
                }
            })
            setInteractions(updatedInteractions)
        } catch (err) {
            console.error("Lỗi khi lấy danh sách chia sẻ:", err)
            toast.error("Lỗi khi tải danh sách chia sẻ", { description: err.message })
        }
    }

    const handleNextPage = () => {
        if (page < totalPages) {
            fetchShares(page + 1)
        }
    }

    const handlePrevPage = () => {
        if (page > 1) {
            fetchShares(page - 1)
        }
    }

    const handleLike = async (shareId) => {
        if (!user) return setShowLoginModal(true)
        try {
            const res = await likePost(shareId)
            const { likesCount } = res.data
            setInteractions((prev) => ({
                ...prev,
                [shareId]: {
                    ...prev[shareId],
                    liked: res.message.includes("Đã thích"),
                    likesCount,
                },
            }))
            toast.success(res.message)
        } catch (err) {
            console.error("Lỗi khi thích bài viết:", err)
            toast.error("Lỗi khi thích bài viết", { description: err.message })
        }
    }

    const handleComment = (shareId) => {
        if (!user) return setShowLoginModal(true)
        toast.info("Vui lòng mở bài viết để bình luận")
    }

    const handleShare = async (shareId) => {
        if (!user) return setShowLoginModal(true)
        try {
            const res = await sharePost(shareId, "", "public")
            setInteractions((prev) => ({
                ...prev,
                [shareId]: {
                    ...prev[shareId],
                    sharesCount: (prev[shareId].sharesCount || 0) + 1,
                },
            }))
            toast.success("Chia sẻ thành công", { description: "Bài viết đã được chia sẻ lên tường của bạn" })
        } catch (err) {
            console.error("Lỗi khi chia sẻ:", err)
            toast.error("Lỗi khi chia sẻ", { description: err.message })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Danh sách chia sẻ ({totalItems})</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {sharesList.length === 0 ? (
                        <p className="text-center text-gray-500">Chưa có lượt chia sẻ nào</p>
                    ) : (
                        sharesList.map((share) => (
                            <Card key={share._id} className="border-gray-200">
                                <CardContent className="p-3 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img
                                                src={share.author?._id?.avatar || "/placeholder.svg?height=32&width=32"}
                                                className="w-8 h-8 rounded-full object-cover"
                                                alt="Author"
                                            />
                                            {share.author?.type === "Shop" && (
                                                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                                                    <ShoppingCart className="w-2 h-2 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm">
                                                    {share.author?.type === "User"
                                                        ? share.author?._id?.fullName
                                                        : share.author?._id?.name || "Người dùng"}
                                                </p>
                                                {share.author?.type === "Shop" && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Shop
                                                    </Badge>
                                                )}
                                            </div>
                                            <p
                                                className="text-xs text-gray-500"
                                                title={format(new Date(share.createdAt), "EEEE, dd 'tháng' MM, yyyy 'lúc' HH:mm", {
                                                    locale: vi,
                                                })}
                                            >
                                                {formatDistanceToNow(new Date(share.createdAt), { addSuffix: true, locale: vi }).replace(
                                                    /^khoảng /,
                                                    "",
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm whitespace-pre-line">{share.content || "Đã chia sẻ bài viết"}</p>

                                    {/* Thanh tương tác */}
                                    <div className="flex justify-between items-center text-sm text-gray-600 px-2">
                                        <span className="cursor-pointer hover:underline">
                                            {interactions[share._id]?.likesCount || 0} lượt thích
                                        </span>
                                        <div className="flex items-center gap-4">
                                            <span className="cursor-pointer hover:underline">
                                                {interactions[share._id]?.commentsCount || 0} bình luận
                                            </span>
                                            <span className="cursor-pointer hover:underline">
                                                {interactions[share._id]?.sharesCount || 0} lượt chia sẻ
                                            </span>
                                        </div>
                                    </div>

                                    {/* Nút tương tác hành động */}
                                    <div className="flex justify-around text-gray-700 border-t pt-2 text-sm">
                                        <button
                                            onClick={() => handleLike(share._id)}
                                            className={`flex items-center gap-1 hover:text-red-500 transition-colors ${interactions[share._id]?.liked ? "text-red-500" : ""}`}
                                        >
                                            <Heart size={16} className={interactions[share._id]?.liked ? "fill-red-500" : ""} /> Thích
                                        </button>
                                        <button
                                            onClick={() => handleComment(share._id)}
                                            className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                                        >
                                            <MessageCircle size={16} /> Bình luận
                                        </button>
                                        <button
                                            onClick={() => handleShare(share._id)}
                                            className="flex items-center gap-1 hover:text-green-500 transition-colors"
                                        >
                                            <Share size={16} /> Chia sẻ
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                        <Button variant="outline" onClick={handlePrevPage} disabled={page === 1} className="text-sm">
                            Trang trước
                        </Button>
                        <span className="text-sm text-gray-600">
                            Trang {page} / {totalPages} ({totalItems} chia sẻ)
                        </span>
                        <Button variant="outline" onClick={handleNextPage} disabled={page === totalPages} className="text-sm">
                            Trang sau
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
