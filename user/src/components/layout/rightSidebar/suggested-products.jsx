"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Skeleton } from "../../../components/ui/skeleton"
import { Heart, Star, ShoppingCart, ArrowRight, Sparkles } from "lucide-react"
import { getSuggestedProducts } from "../../../services/productService"
import { useNavigate } from "react-router-dom"

export default function SuggestedProducts() {
    const [products, setProducts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        fetchSuggestedProducts()
    }, [])

    const fetchSuggestedProducts = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await getSuggestedProducts(1, 5) // Lấy 5 sản phẩm đầu tiên

            if (response.success && response.data.products) {
                setProducts(response.data.products)
            } else {
                setError("Không thể tải sản phẩm gợi ý")
            }
        } catch (err) {
            console.error("Lỗi khi tải sản phẩm gợi ý:", err)
            setError("Có lỗi xảy ra khi tải sản phẩm")
        } finally {
            setIsLoading(false)
        }
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price)
    }

    const handleProductClick = (productId, productSlug) => {
        navigate(`/marketplace/products/${productSlug || productId}`)
    }

    const handleViewMore = () => {
        navigate("/marketplace/suggested-products")
    }

    const handleAddToCart = (e, product) => {
        e.stopPropagation()
        // TODO: Implement add to cart functionality
        console.log("Thêm vào giỏ hàng:", product.name)
    }

    const handleToggleFavorite = (e, product) => {
        e.stopPropagation()
        // TODO: Implement favorite functionality
        console.log("Thêm vào yêu thích:", product.name)
    }

    if (error) {
        return (
            <Card className="shadow-sm border-0 bg-white">
                <CardContent className="p-4">
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-2">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchSuggestedProducts}
                            className="text-xs border-pink-200 text-pink-600 hover:bg-pink-50"
                        >
                            Thử lại
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="shadow-sm border-0 bg-white overflow-hidden">
            <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-500" />
                        <h3 className="font-semibold text-gray-900 text-sm">Gợi ý cho bạn</h3>
                    </div>
                    <Badge
                        variant="secondary"
                        className="text-xs px-2 py-1 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border-pink-200"
                    >
                        Mới
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {isLoading ? (
                    <div className="space-y-3 px-4 pb-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="w-12 h-12 rounded-lg bg-gradient-to-r from-pink-200 to-rose-200" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-3 w-full bg-gradient-to-r from-pink-100 to-rose-100" />
                                    <Skeleton className="h-3 w-16 bg-gradient-to-r from-pink-100 to-rose-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="space-y-1">
                            {products.map((product, index) => (
                                <div
                                    key={product._id}
                                    className="group relative p-3 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 transition-all duration-200 cursor-pointer border-b border-gray-50 last:border-b-0"
                                    onClick={() => handleProductClick(product._id, product.slug)}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Product Image */}
                                        <div className="relative">
                                            <img
                                                src={product.images?.[0] || `/placeholder.svg?height=48&width=48`}
                                                alt={product.name}
                                                className="w-12 h-12 rounded-lg object-cover bg-gray-100 border-2 border-pink-100 group-hover:border-pink-200 transition-colors"
                                            />
                                            {product.discount > 0 && (
                                                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-1 py-0.5 rounded-full">
                                                    -{product.discount}%
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight mb-1 group-hover:text-pink-700 transition-colors">
                                                {product.name}
                                            </h4>

                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-sm text-pink-600">{formatPrice(product.price)}</span>
                                                {product.discount > 0 && (
                                                    <span className="text-xs text-gray-400 line-through">
                                                        {formatPrice(product.price / (1 - product.discount / 100))}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {product.ratings?.avg > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                            <span className="text-xs text-gray-600">{product.ratings.avg.toFixed(1)}</span>
                                                        </div>
                                                    )}
                                                    {product.soldCount > 0 && (
                                                        <span className="text-xs text-gray-500">Đã bán {product.soldCount}</span>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500"
                                                        onClick={(e) => handleToggleFavorite(e, product)}
                                                    >
                                                        <Heart className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 hover:bg-pink-50 hover:text-pink-500"
                                                        onClick={(e) => handleAddToCart(e, product)}
                                                    >
                                                        <ShoppingCart className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shop Info */}
                                    {/* {product.seller && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <img
                                                src={product.seller.avatar || `/placeholder.svg?height=16&width=16`}
                                                alt={product.seller.name || product.seller.username}
                                                className="w-4 h-4 rounded-full object-cover border border-pink-100"
                                            />
                                            <span className="text-xs text-gray-500 truncate">
                                                {product.seller.name || product.seller.username}
                                            </span>
                                        </div>
                                    )} */}
                                </div>
                            ))}
                        </div>

                        {/* View More Button */}
                        <div className="p-3 border-t border-gray-100 bg-gradient-to-r from-pink-50/50 to-rose-50/50">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-center gap-2 text-pink-600 hover:text-pink-700 hover:bg-pink-50 font-medium"
                                onClick={handleViewMore}
                            >
                                <span className="text-sm">Xem thêm sản phẩm</span>
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
