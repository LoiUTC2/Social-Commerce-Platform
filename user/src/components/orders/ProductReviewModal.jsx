"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Input } from "../ui/input"
import { Star, X, Upload, Video, Image as ImageIcon } from "lucide-react"
import { createReview } from "../../services/productReviewService"
import { uploadToCloudinary } from "../../utils/uploadToCloudinary"
import { toast } from "sonner"

export default function ProductReviewModal({ order, product, onClose, onSuccess }) {
    const [rating, setRating] = useState(5)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [media, setMedia] = useState([]) // Changed from images to media to support both images and videos
    const [loading, setLoading] = useState(false)
    const [uploadingMedia, setUploadingMedia] = useState(false)
    const [currentProductIndex, setCurrentProductIndex] = useState(0)

    // If no specific product is selected, show all products
    const productsToReview = product ? [product] : order?.items || []
    const currentProduct = productsToReview[currentProductIndex]

    const handleMediaUpload = async (e) => {
        const files = Array.from(e.target.files)

        // Check total media limit (5 files max)
        if (files.length + media.length > 5) {
            toast.error("Chỉ được tải lên tối đa 5 file (ảnh/video)")
            return
        }

        // Check file size (max 10MB for images, 50MB for videos)
        const invalidFiles = files.filter(file => {
            if (file.type.startsWith('image/')) {
                return file.size > 10 * 1024 * 1024 // 10MB for images
            } else if (file.type.startsWith('video/')) {
                return file.size > 50 * 1024 * 1024 // 50MB for videos
            }
            return true // Invalid file type
        })

        if (invalidFiles.length > 0) {
            toast.error("File quá lớn! Ảnh tối đa 10MB, video tối đa 50MB")
            return
        }

        try {
            setUploadingMedia(true)
            toast.info("Đang tải lên file...")

            const uploadPromises = files.map(async (file) => {
                try {
                    const cloudinaryUrl = await uploadToCloudinary(file)
                    return {
                        url: cloudinaryUrl,
                        type: file.type.startsWith('image/') ? 'image' : 'video',
                        name: file.name,
                        size: file.size
                    }
                } catch (error) {
                    console.error(`Lỗi upload file ${file.name}:`, error)
                    toast.error(`Không thể tải lên ${file.name}`)
                    return null
                }
            })

            const uploadResults = await Promise.all(uploadPromises)
            const successfulUploads = uploadResults.filter(result => result !== null)

            if (successfulUploads.length > 0) {
                setMedia(prev => [...prev, ...successfulUploads])
                toast.success(`Đã tải lên ${successfulUploads.length} file thành công!`)
            }

        } catch (error) {
            console.error("Lỗi khi tải lên file:", error)
            toast.error("Không thể tải lên file")
        } finally {
            setUploadingMedia(false)
        }
    }

    const removeMedia = (index) => {
        setMedia(prev => prev.filter((_, i) => i !== index))
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
                images: media.filter(item => item.type === 'image').map(item => item.url), // Only image URLs
                videos: media.filter(item => item.type === 'video').map(item => item.url), // Only video URLs
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
                    setMedia([])
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

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

                        {/* Media Upload */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Thêm ảnh/video (tối đa 5 file)
                            </label>
                            <p className="text-xs text-gray-500 mb-3">
                                Ảnh tối đa 10MB, video tối đa 50MB. Hỗ trợ JPG, PNG, MP4, MOV
                            </p>

                            <div className="flex flex-wrap gap-3">
                                {media.map((item, index) => (
                                    <div key={index} className="relative">
                                        {item.type === 'image' ? (
                                            <img
                                                src={item.url}
                                                alt={`Review ${index + 1}`}
                                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 flex flex-col items-center justify-center">
                                                <Video className="w-6 h-6 text-gray-500" />
                                                <span className="text-xs text-gray-500 mt-1 text-center px-1">
                                                    {formatFileSize(item.size)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Media type indicator */}
                                        <div className="absolute top-1 left-1 bg-black/70 text-white rounded px-1 text-xs">
                                            {item.type === 'image' ? (
                                                <ImageIcon className="w-3 h-3" />
                                            ) : (
                                                <Video className="w-3 h-3" />
                                            )}
                                        </div>

                                        {/* Remove button */}
                                        <button
                                            onClick={() => removeMedia(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {media.length < 5 && (
                                    <label className={`w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-pink-400 transition-colors ${uploadingMedia ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        {uploadingMedia ? (
                                            <>
                                                <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-xs text-gray-500 mt-1">Đang tải...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 text-gray-400" />
                                                <span className="text-xs text-gray-500 mt-1">Thêm file</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*,video/*"
                                            onChange={handleMediaUpload}
                                            className="hidden"
                                            disabled={uploadingMedia}
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Media summary */}
                            {media.length > 0 && (
                                <div className="mt-3 text-xs text-gray-500">
                                    {media.filter(item => item.type === 'image').length} ảnh, {' '}
                                    {media.filter(item => item.type === 'video').length} video
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading || uploadingMedia}>
                                Hủy
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || uploadingMedia || !content.trim()}
                                className="flex-1 bg-pink-600 hover:bg-pink-700"
                            >
                                {loading ? "Đang gửi..." : uploadingMedia ? "Đang tải file..." : "Gửi đánh giá"}
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