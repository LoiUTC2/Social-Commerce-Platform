"use client"

import { useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Send } from "lucide-react"

const LikesListModal = ({
    open,
    onOpenChange,
    likes = [],
    title = "Những người đã thích",
    emptyMessage = "Chưa có ai thích",
}) => {
    const navigate = useNavigate()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white rounded-xl shadow-lg" overlayClassName="bg-black/10 backdrop-blur-sm">
                <DialogHeader className="border-b pb-2 mb-2">
                    <DialogTitle className="text-center text-lg font-semibold">
                        {title} ({likes.length})
                    </DialogTitle>
                </DialogHeader>

                {/* Danh sách người thích */}
                <div className="max-h-96 overflow-y-auto space-y-2 mt-2">
                    {likes.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">{emptyMessage}</div>
                    ) : (
                        likes.map((user) => (
                            <div
                                key={user?._id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                                <img
                                    src={user?.avatar || "/placeholder.svg?height=40&width=40"}
                                    alt={user?.type === "User" ? user?.fullName : user?.name}
                                    className="w-10 h-10 rounded-full object-cover cursor-pointer"
                                    onClick={() => navigate(`/feed/profile/${user?.slug}`)}
                                />
                                <div className="flex-1">
                                    <div
                                        className="font-medium text-sm cursor-pointer hover:underline flex items-center gap-2"
                                        onClick={() => navigate(`/feed/profile/${user?.slug}`)}
                                    >
                                        {user?.type === "User" ? user?.fullName : user?.name || "Người dùng"}
                                        {user?.type === "Shop" && (
                                            <Badge variant="secondary" className="text-xs">
                                                Shop
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-blue-600 flex items-center gap-1"
                                    onClick={() => navigate(`/messages/${user?._id}`)}
                                >
                                    <Send size={14} /> Nhắn tin
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default LikesListModal
