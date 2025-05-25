"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Textarea } from "../../components/ui/textarea"
import { Button } from "../../components/ui/button"
import { Lock, Globe, Users, Loader2, Smile } from "lucide-react"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../../components/ui/select"
import { useState, useEffect, useRef } from "react"

import { useAuth } from "../../contexts/AuthContext"
import { sharePost } from "../../services/postInteractionService"
import { toast } from "sonner"
import FeedItem from "./FeedItem"
import EmojiPicker from "emoji-picker-react"

const SharePostModal = ({ open, onOpenChange, post, postIdToShare, onShareCompleted }) => {
    const { user, setShowLoginModal } = useAuth()

    const [privacy, setPrivacy] = useState("public")
    const [content, setContent] = useState("")
    const [isSharing, setIsSharing] = useState(false)
    const [showEmoji, setShowEmoji] = useState(false)
    const emojiRef = useRef(null)

    const privacyIcons = {
        public: <Globe size={14} />,
        friends: <Users size={14} />,
        private: <Lock size={14} />,
    }

    const handleEmojiClick = (emojiData) => {
        setContent((prev) => prev + emojiData.emoji)
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiRef.current && !emojiRef.current.contains(event.target)) {
                setShowEmoji(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleShare = async () => {
        if (isSharing) return

        try {
            setIsSharing(true)
            const res = await sharePost(postIdToShare, content, privacy)

            toast.success("Chia sẻ thành công", {
                description: "Bài viết đã được chia sẻ lên tường của bạn",
            })

            onOpenChange(false)
            setContent("")

            if (typeof onShareCompleted === "function") {
                onShareCompleted()
            }
            console.log("Chia sẻ thành công:", res)
        } catch (error) {
            toast.error("Lỗi chia sẻ", {
                description: "Không thể chia sẻ bài viết. Vui lòng thử lại sau.",
            })
            console.error("Lỗi chia sẻ:", error)
        } finally {
            setIsSharing(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-xl bg-white rounded-xl shadow-lg max-h-[90vh] overflow-y-auto px-4 py-3"
                overlayClassName="bg-black/10 backdrop-blur-sm"
            >
                <DialogHeader className="border-b pb-2 mb-3">
                    <DialogTitle className="text-center text-lg font-semibold">Chia sẻ bài viết</DialogTitle>
                </DialogHeader>

                {/* Avatar người dùng */}
                <div className="flex items-center gap-3 mb-1">
                    <img
                        src={user?.avatar || "/placeholder.svg?height=40&width=40"}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                        <div className="font-medium">{user?.fullName}</div>
                        <div className="flex items-center text-sm text-gray-500 gap-1">
                            {privacyIcons[privacy]}
                            <Select value={privacy} onValueChange={setPrivacy}>
                                <SelectTrigger className="h-6 text-xs w-auto px-2 py-0 bg-gray-100 border-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">Công khai</SelectItem>
                                    <SelectItem value="friends">Bạn bè</SelectItem>
                                    <SelectItem value="private">Chỉ mình tôi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-1 space-y-2">
                    {/* Nội dung người chia sẻ */}
                    <div className="relative">
                        <Textarea
                            placeholder="Bạn muốn nói gì thêm? 😄"
                            className="min-h-[60px] resize-none text-base"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />

                        <button
                            type="button"
                            onClick={() => setShowEmoji(!showEmoji)}
                            className="absolute bottom-2 right-2 text-gray-500 hover:text-black"
                        >
                            <Smile size={20} />
                        </button>

                        {showEmoji && (
                            <div ref={emojiRef} className="absolute z-50 top-10 right-2">
                                <EmojiPicker onEmojiClick={handleEmojiClick} />
                            </div>
                        )}
                    </div>

                    {/* Hiển thị bài viết gốc */}
                    <div className="border rounded-lg overflow-hidden">
                        <FeedItem post={post} />
                    </div>
                </div>

                {/* Nút chia sẻ */}
                <div className="border-t p-4 sticky bottom-0 bg-white z-10">
                    <Button className="w-full" onClick={handleShare} disabled={isSharing}>
                        {isSharing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang chia sẻ...
                            </>
                        ) : (
                            "Chia sẻ ngay"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default SharePostModal
