import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Star, ShoppingCart, Eye, MapPin } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { toast } from "sonner"
import { useCart } from "../../contexts/CartContext"

export default function ProductCard({ product }) {
    const navigate = useNavigate()
    const { buyNow, loading: cartLoading } = useCart()

    const {
        _id,
        name,
        price,
        discount = 0,
        images = [],
        slug,
        stock,
        soldCount = 0,
        seller,
        ratings = { avg: 0, count: 0 },
    } = product

    const discountedPrice = discount > 0 ? price - (price * discount) / 100 : price
    const hasDiscount = discount > 0

    const [isBuyingNow, setIsBuyingNow] = useState(false)

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price)
    }

    const handleViewProduct = (e) => {
        e.stopPropagation()
        navigate(`/marketplace/products/${slug || _id}`)
    }

    const handleBuyNow = async (e) => {
        e.stopPropagation()

        try {
            setIsBuyingNow(true)
            // Use buyNow function to add to cart and mark as "buy now"
            await buyNow(_id, 1, {}) // ProductCard doesn't have variant selection, use default
            // Navigate to cart page instead of checkout
            navigate("/marketplace/cart")
        } catch (error) {
            console.error("Error buying now:", error)
        } finally {
            setIsBuyingNow(false)
        }
    }

    // Check loading state from CartContext or local state
    const isLoading = cartLoading || isBuyingNow

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 border border-gray-200">
            <CardContent className="p-0">
                <div className="flex gap-3 p-3">
                    {/* Product Image */}
                    <div className="relative flex-shrink-0">
                        <img
                            src={images[0] || "/placeholder.svg?height=80&width=80"}
                            alt={name}
                            className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={handleViewProduct}
                        />
                        {hasDiscount && (
                            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0">-{discount}%</Badge>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                                <h4
                                    className="font-medium text-gray-900 text-sm line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={handleViewProduct}
                                >
                                    {name}
                                </h4>

                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1">
                                        {hasDiscount && <span className="text-xs text-gray-500 line-through">{formatPrice(price)}</span>}
                                        <span className="font-semibold text-red-600 text-sm">{formatPrice(discountedPrice)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                    {ratings.count > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            <span>{ratings.avg.toFixed(1)}</span>
                                            <span>({ratings.count})</span>
                                        </div>
                                    )}
                                    {soldCount > 0 && <span>Đã bán {soldCount}</span>}
                                </div>

                                {seller && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                                        <MapPin className="w-3 h-3" />
                                        <span className="truncate">{seller.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-1 flex-shrink-0">
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={handleViewProduct}>
                                    <Eye className="w-3 h-3 mr-1" />
                                    Xem
                                </Button>

                                <Button
                                    size="sm"
                                    className="h-7 px-2 text-xs bg-pink-500 hover:bg-pink-600"
                                    onClick={handleBuyNow}
                                    disabled={stock === 0 || isLoading}
                                >
                                    <ShoppingCart className="w-3 h-3 mr-1" />
                                    {isLoading ? "Đang xử lý..." : stock === 0 ? "Hết hàng" : "Mua ngay"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}