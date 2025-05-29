"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Input } from "../ui/input"
import { Star, X, Store } from "lucide-react"
import { createShopReview } from "../../services/shopReviewService"
import { toast } from "sonner"

export default function ShopReviewModal({ order, shop, onClose, onSuccess }) {
    const [rating, setRating] = useState(5)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [loading, setLoading] = useState(false)

    // Get shop info from order or passed shop prop
    const shopInfo = shop || order?.shop

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast.error("Vui lòng nhập nội dung đánh giá")
            return
        }

        if (!shopInfo?._id) {
            toast.error("Không tìm thấy thông tin cửa hàng")
            return
        }

        try {
            setLoading(true)

            // Prepare review data according to backend requirements
            const reviewData = {
                shop: shopInfo._id,
                order: order._id,
                rating,
                title: title.trim() || undefined, // Optional field
                content: content.trim(),
            }

            const response = await createShopReview(reviewData)

            if (response.success) {
                toast.success("Đánh giá cửa hàng thành công!")
                if (onSuccess) onSuccess()
                onClose()
            } else {
                toast.error(response.message || "Không thể gửi đánh giá")
            }
        } catch (error) {
            console.error("Lỗi khi đánh giá cửa hàng:", error)
            toast.error(error.response?.data?.message || "Không thể gửi đánh giá")
        } finally {
            setLoading(false)
        }
    }

    const ratingLabels = {
        1: "Rất không hài lòng",
        2: "Không hài lòng",
        3: "Bình thường",
        4: "Hài lòng",
        5: "Rất hài lòng",
    }

    if (!shopInfo) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-lg w-full p-6 text-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Lỗi</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Không tìm thấy thông tin cửa hàng</p>
                    <Button onClick={onClose} className="bg-pink-600 hover:bg-pink-700">
                        Đóng
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Đánh giá cửa hàng</h2>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Shop Info */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                        <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full">
                            <Store className="w-6 h-6 text-pink-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{shopInfo.name || shopInfo.username}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Đánh giá trải nghiệm mua sắm của bạn</p>
                            {shopInfo.contact?.phone && (
                                <p className="text-xs text-gray-400 dark:text-gray-500">SĐT: {shopInfo.contact.phone}</p>
                            )}
                        </div>
                    </div>

                    {/* Order Info */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Đơn hàng:</span>
                            <span className="font-medium text-gray-900 dark:text-white">#{order._id?.substring(0, 8)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-gray-600 dark:text-gray-400">Tổng tiền:</span>
                            <span className="font-medium text-blue-600">
                                {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                }).format(order.totalAmount)}
                            </span>
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Đánh giá tổng thể về cửa hàng
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} onClick={() => setRating(star)} className="transition-colors hover:scale-110">
                                        <Star
                                            className={`w-8 h-8 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <div className="text-sm">
                                <span className="font-bold text-yellow-600">{rating}/5</span>
                                <p className="text-gray-500 dark:text-gray-400">{ratingLabels[rating]}</p>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tiêu đề đánh giá (không bắt buộc)
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Nhập tiêu đề ngắn gọn cho đánh giá của bạn"
                            maxLength={100}
                        />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Chia sẻ trải nghiệm của bạn *
                        </label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Hãy chia sẻ cảm nhận về dịch vụ của cửa hàng, chất lượng sản phẩm, tốc độ giao hàng..."
                            rows={4}
                            className="resize-none"
                            maxLength={1000}
                        />
                        <p className="text-xs text-gray-500 text-right">{content.length}/1000</p>
                    </div>

                    {/* Review Guidelines */}
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Hướng dẫn đánh giá:</h4>
                        <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                            <li>• Đánh giá dựa trên trải nghiệm thực tế</li>
                            <li>• Chia sẻ về chất lượng sản phẩm, dịch vụ khách hàng</li>
                            <li>• Tốc độ giao hàng và đóng gói sản phẩm</li>
                            <li>• Sử dụng ngôn từ lịch sự, tích cực</li>
                        </ul>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !content.trim()}
                            className="flex-1 bg-pink-600 hover:bg-pink-700"
                        >
                            {loading ? "Đang gửi..." : "Gửi đánh giá"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
