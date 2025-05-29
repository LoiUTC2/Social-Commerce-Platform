"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Input } from "../ui/input"
import { Star, X, Upload } from "lucide-react"
import { createReview } from "../../services/productReviewService"
import { toast } from "sonner"

export default function ProductReviewModal({ order, product, onClose, onSuccess }) {
    const [rating, setRating] = useState(5)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(false)
    const [currentProductIndex, setCurrentProductIndex] = useState(0)

    // If no specific product is selected, show all products
    const productsToReview = product ? [product] : order?.items || []
    const currentProduct = productsToReview[currentProductIndex]

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files)
        if (files.length + images.length > 5) {
            toast.error("Chỉ được tải lên tối đa 5 hình ảnh")
            return
        }

        const promises = files.map((file) => {
            return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onload = (e) => {
                    resolve(e.target.result)
                }
                reader.readAsDataURL(file)
            })
        })

        Promise.all(promises).then((results) => {
            setImages((prev) => [...prev, ...results])
        })
    }

    const removeImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast.error("Vui lòng nhập nội dung đánh giá")
            return
        }

        try {
            setLoading(true)

            // Prepare review data according to backend requirements
            const reviewData = {
                product: currentProduct.product._id,
                order: order._id,
                shop: order.shop._id, // Shop ID is required by the backend
                rating,
                title: title.trim() || undefined, // Optional field
                content: content.trim(),
                images, // Array of image URLs or base64 strings
            }

            const response = await createReview(reviewData)

            if (response.success) {
                toast.success("Đánh giá sản phẩm thành công!")

                // Reset form for next product or close modal
                if (currentProductIndex < productsToReview.length - 1) {
                    setCurrentProductIndex(currentProductIndex + 1)
                    setRating(5)
                    setTitle("")
                    setContent("")
                    setImages([])
                } else {
                    if (onSuccess) onSuccess()
                    onClose()
                }
            } else {
                toast.error(response.message || "Không thể gửi đánh giá")
            }
        } catch (error) {
            console.error("Lỗi khi đánh giá sản phẩm:", error)
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

    if (!currentProduct) {
        return null
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Đánh giá sản phẩm {currentProductIndex + 1}/{productsToReview.length}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
                        {/* Product Info */}
                        <div className="flex gap-4 mb-4">
                            <img
                                src={currentProduct.product?.images?.[0] || "/placeholder.svg?height=80&width=80"}
                                alt={currentProduct.product?.name}
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                            />
                            <div className="flex-1">
                                <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                                    {currentProduct.product?.name}
                                </h3>
                                {Object.keys(currentProduct.selectedVariant || {}).length > 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {Object.entries(currentProduct.selectedVariant)
                                            .map(([key, value]) => `${key}: ${value}`)
                                            .join(", ")}
                                    </p>
                                )}
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Số lượng: {currentProduct.quantity}</p>
                            </div>
                        </div>

                        {/* Rating */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Đánh giá chất lượng sản phẩm
                            </label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} onClick={() => setRating(star)} className="transition-colors">
                                        <Star
                                            className={`w-8 h-8 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{ratingLabels[rating]}</p>
                        </div>

                        {/* Title */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tiêu đề đánh giá (không bắt buộc)
                            </label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Nhập tiêu đề ngắn gọn cho đánh giá của bạn"
                                maxLength={100}
                            />
                        </div>

                        {/* Comment */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Chia sẻ cảm nhận của bạn về sản phẩm
                            </label>
                            <Textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Hãy chia sẻ những điều bạn thích về sản phẩm này nhé..."
                                rows={4}
                                className="resize-none"
                                maxLength={1000}
                            />
                            <p className="text-xs text-gray-500 mt-1 text-right">{content.length}/1000</p>
                        </div>

                        {/* Images */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Thêm hình ảnh (tối đa 5 ảnh)
                            </label>

                            <div className="flex flex-wrap gap-3">
                                {images.map((image, imgIndex) => (
                                    <div key={imgIndex} className="relative">
                                        <img
                                            src={image || "/placeholder.svg"}
                                            alt={`Review ${imgIndex + 1}`}
                                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                        />
                                        <button
                                            onClick={() => removeImage(imgIndex)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {images.length < 5 && (
                                    <label className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-pink-400 transition-colors">
                                        <Upload className="w-6 h-6 text-gray-400" />
                                        <span className="text-xs text-gray-500 mt-1">Thêm ảnh</span>
                                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-3">
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

                {/* Progress indicator for multiple products */}
                {productsToReview.length > 1 && (
                    <div className="p-4 border-t border-gray-200 dark:border-zinc-700 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                            Đánh giá {currentProductIndex + 1} / {productsToReview.length}
                        </span>
                        <div className="flex gap-1">
                            {productsToReview.map((_, index) => (
                                <div
                                    key={index}
                                    className={`h-2 w-8 rounded-full ${index === currentProductIndex ? "bg-pink-500" : "bg-gray-200 dark:bg-gray-700"
                                        }`}
                                ></div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
