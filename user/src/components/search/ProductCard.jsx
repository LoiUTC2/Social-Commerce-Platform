"use client"

import { Eye, Star, CheckCircle } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import HashtagDisplay from "./HashtagDisplay"

const ProductCard = ({ product, onProductClick }) => {
    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price)
    }

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
        if (num >= 1000) return (num / 1000).toFixed(1) + "K"
        return num.toString()
    }

    const handleClick = () => {
        if (onProductClick) {
            onProductClick(product)
        }
    }

    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleClick}>
            <CardContent className="p-4">
                <div className="relative mb-3">
                    <img
                        src={product.images?.[0] || "/placeholder.svg?height=200&width=200"}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                            e.target.src = "/placeholder.svg?height=200&width=200&text=No+Image"
                        }}
                    />
                    {product.discount > 0 && <Badge className="absolute top-2 left-2 bg-red-500">-{product.discount}%</Badge>}
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        <Eye className="h-3 w-3 inline mr-1" />
                        {formatNumber(product.soldCount || 0)}
                    </div>
                </div>

                <h3 className="font-medium mb-2 line-clamp-2 text-sm" title={product.name}>
                    {product.name}
                </h3>

                <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-red-600">{formatPrice(product.price)}</span>
                    {product.discount > 0 && (
                        <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.price / (1 - product.discount / 100))}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{product.ratings?.avg || 0}</span>
                        <span>({formatNumber(product.ratings?.count || 0)})</span>
                    </div>
                    <span>Đã bán {formatNumber(product.soldCount || 0)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Avatar className="h-5 w-5">
                        <AvatarImage src={product.seller?.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{product.seller?.name?.[0] || "S"}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{product.seller?.name || "Shop"}</span>
                    {product.seller?.stats?.rating?.avg >= 4.5 && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>

                {product.hashtags && product.hashtags.length > 0 && (
                    <HashtagDisplay hashtags={product.hashtags} limit={3} size="xs" />
                )}
            </CardContent>
        </Card>
    )
}

export default ProductCard
