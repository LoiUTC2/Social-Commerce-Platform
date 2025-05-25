"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Plus, Play, ShoppingCart, Eye } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function MediaGallery({ media = [], postId, hasProducts = false, compact = false }) {
    const navigate = useNavigate()
    const [currentIndex, setCurrentIndex] = useState(0)

    const totalMediaCount = media.length
    const displayedMedia = media.slice(0, compact ? 3 : 4)
    const remainingMedia = totalMediaCount > (compact ? 3 : 4) ? totalMediaCount - (compact ? 3 : 4) : 0

    const getLayoutClass = () => {
        const count = displayedMedia.length

        if (compact) {
            if (count === 1) return "grid grid-cols-1 h-48 w-full"
            if (count === 2) return "grid grid-cols-2 gap-1 h-48 w-full"
            return "grid grid-cols-3 gap-1 h-48 w-full"
        }

        // Layout cho feed chính
        if (count === 1) return "grid grid-cols-1 h-96 w-full"
        if (count === 2) return "grid grid-cols-2 gap-2 h-80 w-full"
        if (count === 3) return "grid grid-cols-3 gap-2 h-80 w-full"
        return "grid grid-cols-2 gap-2 h-80 w-full" // 4+ items: 2x2 grid
    }

    const getItemClass = (index, totalCount) => {
        if (totalCount === 1) {
            return "col-span-1 row-span-1 flex justify-center items-center"
        }
        if (totalCount === 3) {
            // Layout đặc biệt cho 3 items: 1 lớn bên trái, 2 nhỏ bên phải
            if (index === 0) return "col-span-2 row-span-2 flex justify-center items-center"
            return "col-span-1 row-span-1 flex justify-center items-center"
        }
        return "col-span-1 row-span-1 flex justify-center items-center"
    }

    const isVideo = (mediaItem) => {
        return mediaItem.type === "video" || mediaItem.url.match(/\.(mp4|mov|avi|webm)$/i)
    }

    const navigateToPostDetail = () => {
        navigate(`/feed/post/${postId}`)
    }

    const getProductFromMedia = (mediaItem) => {
        return mediaItem.source === "product"
            ? {
                id: mediaItem.productId,
                name: mediaItem.productName,
            }
            : null
    }

    return (
        <div className="relative w-full">
            <div className={getLayoutClass()}>
                {displayedMedia.map((mediaItem, idx) => {
                    const isLastItemWithOverlay = idx === (compact ? 2 : 3) && remainingMedia > 0
                    const product = getProductFromMedia(mediaItem)
                    const itemClass = getItemClass(idx, displayedMedia.length)

                    return (
                        <div
                            key={idx}
                            className={`${itemClass} relative group overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer`}
                            onClick={navigateToPostDetail}
                        >
                            {/* Background pattern cho aesthetic */}
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/50" />

                            {isVideo(mediaItem) ? (
                                <div className="relative w-full h-full flex justify-center items-center">
                                    <video
                                        src={mediaItem.url}
                                        className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                                        muted
                                        loop
                                        playsInline
                                        autoPlay={true}
                                        controls={true}
                                        // onMouseEnter={(e) => e.target.play()}
                                        // onMouseLeave={(e) => e.target.pause()}
                                    />

                                    {/* Video overlay */}
                                    {/* <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center rounded-lg">
                                        <div className="bg-black/70 backdrop-blur-sm rounded-full p-4 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                            <Play className="w-8 h-8 text-white fill-white" />
                                        </div>
                                    </div> */}

                                    {/* Video badge */}
                                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                        <Play className="w-3 h-3 fill-white" />
                                        Video
                                    </div>
                                </div>
                            ) : (
                                <div className="relative w-full h-full flex justify-center items-center">
                                    <img
                                        src={mediaItem.url || "/placeholder.svg"}
                                        alt={`Media ${idx + 1}`}
                                        className="max-w-full max-h-full object-contain rounded-lg shadow-sm transition-all duration-300 group-hover:scale-105"
                                    />

                                    {/* Image overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                                </div>
                            )}

                            {/* Product badge */}
                            {product && (
                                <div className="absolute top-3 right-3 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                                    <ShoppingCart className="w-3 h-3" />
                                    Sản phẩm
                                </div>
                            )}

                            {/* Source indicator */}
                            {mediaItem.source === "product" && (
                                <div className="absolute bottom-3 left-3 bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                                    Từ shop
                                </div>
                            )}

                            {/* Overlay "+X" for remaining media */}
                            {isLastItemWithOverlay && (
                                <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
                                    <div className="text-white text-3xl font-bold flex items-center gap-3 transform group-hover:scale-110 transition-transform duration-300">
                                        <Plus className="w-8 h-8" />
                                        <span>{remainingMedia}</span>
                                    </div>
                                </div>
                            )}

                            {/* Subtle border */}
                            <div className="absolute inset-0 border border-white/20 rounded-lg pointer-events-none" />
                        </div>
                    )
                })}
            </div>

            {/* Product action buttons - chỉ hiển thị khi có sản phẩm */}
            {hasProducts && !compact && (
                <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                    <Button
                        size="sm"
                        variant="outline"
                        className="backdrop-blur-md bg-white/95 hover:bg-white border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={(e) => {
                            e.stopPropagation()
                            // Navigate to first product detail
                            const firstProduct = media.find((m) => m.source === "product")
                            if (firstProduct) {
                                navigate(`/marketplace/products/${firstProduct.productSlug}`)
                            }
                        }}
                    >
                        <Eye className="w-4 h-4 mr-1" />
                        Xem chi tiết
                    </Button>
                    <Button
                        size="sm"
                        className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/marketplace/checkout`)
                        }}
                    >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Mua ngay
                    </Button>
                </div>
            )}
        </div>
    )
}
