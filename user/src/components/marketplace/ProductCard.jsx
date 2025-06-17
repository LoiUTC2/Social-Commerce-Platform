"use client"

import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Star, Heart, ShoppingCart, Eye, Brain } from "lucide-react"
import { useState } from "react"
import {
  formatCurrency,
  formatRating,
  formatNumber,
  isNewProduct,
  calculateDiscountedPrice,
} from "../../utils/productFormatters"

export default function ProductCard({ product, showAIScore = false, showNewBadge = false }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  // Handle product click
  const handleProductClick = () => {
    if (product?.slug) {
      window.location.href = `/marketplace/products/${product.slug}`
    }
  }

  // Handle quick view
  const handleQuickView = (e) => {
    e.stopPropagation()
    console.log("Quick view:", product)
  }

  // Handle add to cart
  const handleAddToCart = (e) => {
    e.stopPropagation()
    console.log("Add to cart:", product)
  }

  // Handle like toggle
  const handleLikeToggle = (e) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
    console.log("Toggle like:", product)
  }

  // Xử lý trường hợp không có dữ liệu sản phẩm
  if (!product) return null

  // Safe data extraction
  const productName = product.name || "Sản phẩm không có tên"
  const productPrice = typeof product.price === "number" ? product.price : 0
  const productDiscount = typeof product.discount === "number" ? product.discount : 0
  const productImages = Array.isArray(product.images) ? product.images : []
  const productRating = product.ratings?.avg
  const productRatingCount = product.ratings?.count || 0
  const productSoldCount = typeof product.soldCount === "number" ? product.soldCount : 0
  const sellerName = product.seller?.name || ""

  // Calculate discounted price
  const discountedPrice = calculateDiscountedPrice(productPrice, productDiscount)

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-xl border-0 bg-white rounded-2xl cursor-pointer transform hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleProductClick}
    >
      <div className="relative">
        {/* Ảnh sản phẩm */}
        <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl">
          <img
            src={productImages[0] || "/placeholder.svg?height=300&width=300"}
            alt={productName}
            className={`w-full h-full object-cover transition-all duration-500 ${isHovered ? "scale-110" : "scale-100"
              }`}
          />

          {/* Overlay khi hover */}
          <div
            className={`absolute inset-0 bg-black bg-opacity-20 transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"
              }`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="sm"
                className="bg-white text-gray-800 hover:bg-gray-100 rounded-full px-4 py-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
                onClick={handleQuickView}
              >
                <Eye className="w-4 h-4 mr-2" />
                Xem nhanh
              </Button>
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {/* Badge giảm giá */}
            {productDiscount > 0 && (
              <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 rounded-full px-2 py-1 text-xs font-bold shadow-lg">
                -{formatNumber(productDiscount)}%
              </Badge>
            )}

            {/* Badge NEW cho sản phẩm mới */}
            {showNewBadge && isNewProduct(product.createdAt) && (
              <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white border-0 rounded-full px-2 py-1 text-xs font-bold shadow-lg">
                NEW
              </Badge>
            )}

            {/* AI Score Badge */}
            {showAIScore && typeof product.hybridScore === "number" && (
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 rounded-full px-2 py-1 text-xs font-bold shadow-lg flex items-center gap-1">
                <Brain className="w-3 h-3" />
                {Math.round(product.hybridScore * 100)}%
              </Badge>
            )}
          </div>

          {/* Số lượng đã bán */}
          {productSoldCount > 0 && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              Đã bán {formatNumber(productSoldCount)}
            </div>
          )}

          {/* Nút yêu thích */}
          <button
            className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-300 shadow-lg ${isLiked
                ? "bg-pink-500 text-white"
                : "bg-white bg-opacity-90 text-gray-600 hover:bg-pink-500 hover:text-white"
              }`}
            onClick={handleLikeToggle}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Thông tin sản phẩm */}
        <CardContent className="p-3 space-y-2">
          {/* Tên sản phẩm */}
          <h3 className="font-semibold text-sm line-clamp-2 text-gray-800 leading-tight h-10">{productName}</h3>

          {/* Giá */}
          <div className="flex items-baseline gap-2">
            <span className="text-pink-600 font-bold text-base">{formatCurrency(discountedPrice)}</span>
            {productDiscount > 0 && (
              <span className="text-gray-400 text-xs line-through">{formatCurrency(productPrice)}</span>
            )}
          </div>

          {/* Đánh giá và thông tin shop */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center text-yellow-400">
              <Star className="w-3 h-3 fill-current mr-1" />
              <span className="text-gray-600">
                {formatRating(productRating)} ({formatNumber(productRatingCount)})
              </span>
            </div>
            {sellerName && <span className="text-gray-500 truncate max-w-20">{sellerName}</span>}
          </div>

          {/* Nút mua hàng */}
          <div
            className={`transition-all duration-300 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
          >
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white text-xs font-medium py-2 rounded-full flex items-center justify-center gap-2 shadow-lg transition-all duration-300"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4" />
              Thêm vào giỏ
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
