"use client"

import { useState } from "react"
import { Minus, Plus, Trash2, Star, MapPin } from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { useCart } from "../../contexts/CartContext"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

const CartItem = ({ item }) => {
    const navigate = useNavigate();
    const { updateItemQuantity, removeItem } = useCart()
    const [isUpdating, setIsUpdating] = useState(false)

    const product = item.product
    const currentPrice = product?.discount > 0 ? product.price * (1 - product.discount / 100) : product?.price || 0

    const handleQuantityChange = async (newQuantity) => {
        if (newQuantity < 1) return

        try {
            setIsUpdating(true)
            await updateItemQuantity(product._id, item.selectedVariant, newQuantity)
            toast.success("Đã cập nhật số lượng sản phẩm")
        } catch (error) {
            console.error("Lỗi cập nhật số lượng:", error)
            toast.error(error.message || "Không thể cập nhật số lượng sản phẩm")
        } finally {
            setIsUpdating(false)
        }
    }

    const handleRemove = async () => {
        try {
            setIsUpdating(true)
            await removeItem(product._id, item.selectedVariant)
            toast.success("Đã xóa sản phẩm khỏi giỏ hàng")
        } catch (error) {
            console.error("Lỗi xóa sản phẩm:", error)
            toast.error(error.message || "Không thể xóa sản phẩm")
        } finally {
            setIsUpdating(false)
        }
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price)
    }

    const getVariantText = () => {
        if (!item.selectedVariant || Object.keys(item.selectedVariant).length === 0) {
            return ""
        }
        return Object.entries(item.selectedVariant)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
    }

    if (!product) return null

    return (
        <div className="flex items-center gap-3 p-3 hover:bg-pink-50 dark:hover:bg-zinc-800 transition-colors">
            {/* Hình ảnh sản phẩm */}
            <div className="flex-shrink-0 relative cursor-pointer" onClick={()=> navigate(`/marketplace/products/${product.slug}`)}>
                <img
                    src={product.images?.[0] || "/placeholder.svg?height=60&width=60"}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-lg border border-pink-100"
                />
                {product.discount > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5">
                        -{product.discount}%
                    </Badge>
                )}
            </div>

            {/* Thông tin sản phẩm */}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={()=> navigate(`/marketplace/products/${product.slug}`)}>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">{product.name}</h4>

                {/* Shop info */}
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <MapPin className="w-3 h-3" />
                    <span>{product.seller?.name || "HULO Store"}</span>
                </div>

                {/* Variant */}
                {getVariantText() && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{getVariantText()}</p>}

                {/* Rating và sold count */}
                {(product.ratings?.average > 0 || product.soldCount > 0) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        {product.ratings?.average > 0 && (
                            <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span>{product.ratings.average.toFixed(1)}</span>
                            </div>
                        )}
                        {product.soldCount > 0 && <span>Đã bán {product.soldCount}</span>}
                    </div>
                )}

                <div className="flex items-center justify-between mt-2">
                    {/* Giá */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-pink-600">{formatPrice(currentPrice)}</span>
                        {product.discount > 0 && (
                            <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
                        )}
                    </div>

                    {/* Điều khiển số lượng */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0 border-pink-200 hover:bg-pink-50"
                            onClick={() => handleQuantityChange(item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1}
                        >
                            <Minus className="h-3 w-3" />
                        </Button>

                        <span className="text-sm font-medium min-w-[24px] text-center">{isUpdating ? "..." : item.quantity}</span>

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0 border-pink-200 hover:bg-pink-50"
                            onClick={() => handleQuantityChange(item.quantity + 1)}
                            disabled={isUpdating || item.quantity >= (product.stock || 999)}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Stock warning */}
                {product.stock <= 5 && product.stock > 0 && (
                    <p className="text-xs text-orange-500 mt-1">Chỉ còn {product.stock} sản phẩm</p>
                )}
            </div>

            {/* Nút xóa */}
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                onClick={handleRemove}
                disabled={isUpdating}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    )
}

export default CartItem
