"use client"

import { Users, Package, Star, MapPin } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import HashtagDisplay from "./HashtagDisplay"

const ShopCard = ({ shop, onShopClick }) => {
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
        if (num >= 1000) return (num / 1000).toFixed(1) + "K"
        return num.toString()
    }

    const handleClick = () => {
        if (onShopClick) {
            onShopClick(shop)
        }
    }

    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleClick}>
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={shop.avatar || shop.logo} />
                        <AvatarFallback>{shop.name?.[0] || "S"}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg" title={shop.name}>
                                {shop.name}
                            </h3>
                            {shop.status?.featureLevel === "premium" && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    Premium
                                </Badge>
                            )}
                            {shop.status?.featureLevel === "vip" && <Badge className="bg-purple-500">VIP</Badge>}
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2" title={shop.description}>
                            {shop.description || "Chưa có mô tả"}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span>{formatNumber(shop.stats?.followers?.length || 0)} theo dõi</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                <span>{formatNumber(shop.stats?.orderCount || 0)} sản phẩm</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>
                                    {shop.stats?.rating?.avg || 0} ({formatNumber(shop.stats?.rating?.count || 0)})
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{shop.contact?.businessAddress?.city || "Việt Nam"}</span>
                            </div>
                        </div>

                        {shop.hashtags && shop.hashtags.length > 0 && (
                            <HashtagDisplay hashtags={shop.hashtags} limit={3} size="xs" />
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default ShopCard
