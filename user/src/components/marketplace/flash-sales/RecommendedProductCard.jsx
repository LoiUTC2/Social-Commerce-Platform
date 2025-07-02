"use client"

import { useState } from "react"
import { Card, CardContent } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Heart, ShoppingCart, Eye, Sparkles, Zap } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { useCart } from "../../../contexts/CartContext"
import { toast } from "sonner"

const RecommendedProductCard = ({ product }) => {
    const navigate = useNavigate()
    const { addItemToCart, loading: cartLoading } = useCart()
    const [isHovered, setIsHovered] = useState(false)
    const [isLiked, setIsLiked] = useState(false)

    if (!product) return null

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount)
    }

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
        if (num >= 1000) return (num / 1000).toFixed(1) + "K"
        return num.toString()
    }

    // Handle flash sale pricing
    const salePrice = product.salePrice || product.price
    const originalPrice = product.price
    const discountPercent = product.discountPercent || 0
    const soldCount = product.soldCount || 0

    const handleProductClick = () => {
        navigate(`/marketplace/products/${product.slug}`)
    }

    // Hàm xử lý thêm vào giỏ hàng
    const handleAddToCart = async (e) => {
        e.stopPropagation()

        if (cartLoading) return // Tránh click nhiều lần

        try {
            await addItemToCart(product._id, 1, {})
        } catch (error) {
            console.error("Lỗi khi thêm vào giỏ hàng:", error)
            toast.error(error.message || "Không thể thêm sản phẩm vào giỏ hàng")
        }
    }

    return (
        <Card
            className="group overflow-hidden transition-all duration-300 hover:shadow-xl border-0 bg-white rounded-2xl cursor-pointer transform hover:-translate-y-1 relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleProductClick}
        >
            {/* AI Recommendation Badge */}
            <div className="absolute top-2 left-2 z-10">
                <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI
                </Badge>
            </div>

            <div className="relative">
                {/* Product Image */}
                <div className="relative h-32 sm:h-36 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl">
                    <img
                        src={product.images?.[0] || "/placeholder.svg?height=200&width=200"}
                        alt={product.name}
                        className={`w-full h-full object-cover transition-all duration-500 ${isHovered ? "scale-110" : "scale-100"
                            }`}
                    />

                    {/* Hover Overlay */}
                    <div
                        className={`absolute inset-0 bg-black bg-opacity-20 transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"
                            }`}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Button
                                size="sm"
                                className="bg-white text-gray-800 hover:bg-gray-100 rounded-full px-3 py-1 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 text-xs"
                            >
                                <Eye className="w-3 h-3 mr-1" />
                                Xem
                            </Button>
                        </div>
                    </div>

                    {/* Discount Badge */}
                    {discountPercent > 0 && (
                        <div className="absolute top-2 right-2">
                            <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 rounded-full px-2 py-1 text-xs font-bold shadow-lg">
                                -{discountPercent}%
                            </Badge>
                        </div>
                    )}

                    {/* Flash Sale Badge */}
                    {product.flashSaleId && (
                        <div className="absolute bottom-2 left-2">
                            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 rounded-full px-2 py-1 text-xs font-bold">
                                <Zap className="w-3 h-3 mr-1" />
                                Flash Sale
                            </Badge>
                        </div>
                    )}

                    {/* Sold Count */}
                    {soldCount > 0 && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                            {formatNumber(soldCount)} đã bán
                        </div>
                    )}

                    {/* Like Button */}
                    <button
                        className={`absolute top-8 right-2 p-1.5 rounded-full transition-all duration-300 shadow-lg ${isLiked
                            ? "bg-pink-500 text-white"
                            : "bg-white bg-opacity-90 text-gray-600 hover:bg-pink-500 hover:text-white"
                            }`}
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsLiked(!isLiked)
                        }}
                    >
                        <Heart className={`w-3 h-3 ${isLiked ? "fill-current" : ""}`} />
                    </button>
                </div>

                {/* Product Info */}
                <CardContent className="p-3 space-y-2">
                    {/* Product Name */}
                    <h3 className="font-semibold text-xs line-clamp-2 text-gray-800 leading-tight h-8">{product.name}</h3>

                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                        <span className="text-pink-600 font-bold text-sm">{formatCurrency(salePrice)}</span>
                        {discountPercent > 0 && (
                            <span className="text-gray-400 text-xs line-through">{formatCurrency(originalPrice)}</span>
                        )}
                    </div>

                    {/* Rating */}
                    {product.ratings?.avg > 0 && (
                        <div className="flex items-center gap-1">
                            <div className="flex text-yellow-400 text-xs">{"★".repeat(Math.floor(product.ratings.avg))}</div>
                            <span className="text-xs text-gray-500">({formatNumber(product.ratings.count || 0)})</span>
                        </div>
                    )}

                    {/* Add to Cart Button */}
                    <div
                        className={`transition-all duration-300 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                            }`}
                    >
                        <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-xs font-medium py-1.5 rounded-full flex items-center justify-center gap-1 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleAddToCart}
                            disabled={cartLoading}
                        >
                            <ShoppingCart className="w-3 h-3" />
                            {cartLoading ? "Đang thêm..." : "Thêm vào giỏ"}
                        </Button>
                    </div>
                </CardContent>
            </div>
        </Card>
    )
}

export default RecommendedProductCard
