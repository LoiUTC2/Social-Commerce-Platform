import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Star, Heart, ShoppingCart } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { formatCurrency } from "../../lib/utils"

export default function ProductCard({ product }) {
  const [isHovered, setIsHovered] = useState(false)

  // Tính giá sau khi giảm giá
  const discountedPrice = product?.price - product?.price * (product?.discount / 100)

  // Xử lý trường hợp không có dữ liệu sản phẩm
  if (!product) return null

  return (
    <Link to={`/marketplace/products/${product._id || product.id}`}>
      <Card
        className="overflow-hidden transition-all duration-300 hover:shadow-lg border-0 bg-white rounded-xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          {/* Ảnh sản phẩm */}
          <div className="relative h-48 overflow-hidden bg-gray-100">
            <img
              src={product.images?.[0] || "/placeholder-product.jpg"}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? "scale-110" : "scale-100"}`}
            />

            {/* Badge giảm giá */}
            {product.discount > 0 && (
              <Badge className="absolute top-2 left-2 bg-red-500 text-white border-0">-{product.discount}%</Badge>
            )}

            {/* Số lượng đã bán */}
            {product.soldCount > 0 && (
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                Đã bán {product.soldCount}
              </div>
            )}

            {/* Nút yêu thích */}
            <button
              className="absolute top-2 right-2 bg-white bg-opacity-80 p-1.5 rounded-full hover:bg-opacity-100 transition-all"
              onClick={(e) => {
                e.preventDefault()
                // Xử lý thêm vào yêu thích
              }}
            >
              <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
            </button>
          </div>

          {/* Thông tin sản phẩm */}
          <CardContent className="p-3">
            {/* Tên sản phẩm */}
            <h3 className="font-medium text-sm line-clamp-2 mb-1 h-10">{product.name}</h3>

            {/* Giá */}
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-red-600 font-bold">{formatCurrency(discountedPrice || product.price)}</span>

              {product.discount > 0 && (
                <span className="text-gray-400 text-xs line-through">{formatCurrency(product.price)}</span>
              )}
            </div>

            {/* Đánh giá */}
            <div className="flex items-center text-xs text-gray-500 mb-2">
              <div className="flex items-center text-yellow-400 mr-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    fill={i < Math.floor(product.ratings?.avg || 0) ? "currentColor" : "none"}
                    className="mr-0.5"
                  />
                ))}
              </div>
              <span>
                {product.ratings?.avg?.toFixed(1) || "0.0"} ({product.ratings?.count || 0})
              </span>
            </div>

            {/* Nút mua hàng (hiện khi hover) */}
            <div className={`transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}>
              <button
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium py-1.5 rounded-full flex items-center justify-center gap-1 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  // Xử lý thêm vào giỏ hàng
                }}
              >
                <ShoppingCart size={14} />
                Thêm vào giỏ
              </button>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  )
}
