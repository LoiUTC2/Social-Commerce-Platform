"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { FlameIcon as Fire, TrendingUp, Users, ShoppingBag, Clock, Zap } from "lucide-react"

const HotFlashSaleCard = ({ flashSale, rank, onClick }) => {
    const [timeLeft, setTimeLeft] = useState(null)
    const [status, setStatus] = useState("upcoming")

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date().getTime()
            const startTime = new Date(flashSale.startTime).getTime()
            const endTime = new Date(flashSale.endTime).getTime()

            let targetTime, currentStatus

            if (now < startTime) {
                targetTime = startTime
                currentStatus = "upcoming"
            } else if (now >= startTime && now <= endTime) {
                targetTime = endTime
                currentStatus = "active"
            } else {
                currentStatus = "ended"
            }

            setStatus(currentStatus)

            if (currentStatus !== "ended") {
                const difference = targetTime - now
                if (difference > 0) {
                    const hours = Math.floor(difference / (1000 * 60 * 60))
                    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
                    const seconds = Math.floor((difference % (1000 * 60)) / 1000)
                    setTimeLeft({ hours, minutes, seconds })
                }
            }
        }

        updateCountdown()
        const interval = setInterval(updateCountdown, 1000)
        return () => clearInterval(interval)
    }, [flashSale.startTime, flashSale.endTime])

    const getRankColor = () => {
        switch (rank) {
            case 1:
                return "from-yellow-400 to-orange-500" // Gold
            case 2:
                return "from-gray-300 to-gray-500" // Silver
            case 3:
                return "from-orange-400 to-red-500" // Bronze
            default:
                return "from-pink-500 to-rose-500"
        }
    }

    const getRankIcon = () => {
        switch (rank) {
            case 1:
                return "🥇"
            case 2:
                return "🥈"
            case 3:
                return "🥉"
            default:
                return "🔥"
        }
    }

    const totalProducts = flashSale.enrichedProducts?.length || 0
    const totalSold = flashSale.summary?.totalSold || 0
    const avgDiscount = flashSale.summary?.avgDiscountPercent || 0
    const totalPurchases = flashSale.stats?.totalPurchases || 0
    const totalRevenue = flashSale.stats?.totalRevenue || 0

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(amount)
    }

    return (
        <Card
            className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 bg-white relative"
            onClick={onClick}
        >
            {/* Rank Badge */}
            <div className="absolute -top-2 -left-2 z-10">
                <div
                    className={`bg-gradient-to-r ${getRankColor()} text-white w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg`}
                >
                    {getRankIcon()}
                </div>
            </div>

            {/* Hot Badge */}
            <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 animate-pulse">
                    <Fire className="w-3 h-3 mr-1" />
                    HOT #{rank}
                </Badge>
            </div>

            <CardContent className="p-0">
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${getRankColor()} p-4 text-white relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10 pt-2">
                        <h3 className="font-bold text-lg line-clamp-1 mb-1">{flashSale.name}</h3>
                        <p className="text-white/80 text-sm line-clamp-1 mb-3">{flashSale.description}</p>

                        {/* Hot Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                                <div className="flex items-center gap-1 mb-1">
                                    <Users className="w-3 h-3" />
                                    <span>Lượt mua</span>
                                </div>
                                <div className="font-bold">{totalPurchases.toLocaleString()}</div>
                            </div>
                            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                                <div className="flex items-center gap-1 mb-1">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>Doanh thu</span>
                                </div>
                                <div className="font-bold">{formatCurrency(totalRevenue)}</div>
                            </div>
                        </div>

                        {/* Countdown Timer */}
                        {timeLeft && status !== "ended" && (
                            <div className="bg-black/30 rounded-lg p-2 backdrop-blur-sm mt-3">
                                <div className="text-xs text-white/80 mb-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {status === "upcoming" ? "Bắt đầu sau:" : "Kết thúc sau:"}
                                </div>
                                <div className="flex gap-1 text-sm font-mono">
                                    <span className="bg-white/20 px-2 py-1 rounded text-center min-w-[32px]">
                                        {String(timeLeft.hours).padStart(2, "0")}
                                    </span>
                                    <span className="text-white/60">:</span>
                                    <span className="bg-white/20 px-2 py-1 rounded text-center min-w-[32px]">
                                        {String(timeLeft.minutes).padStart(2, "0")}
                                    </span>
                                    <span className="text-white/60">:</span>
                                    <span className="bg-white/20 px-2 py-1 rounded text-center min-w-[32px]">
                                        {String(timeLeft.seconds).padStart(2, "0")}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    {/* Product Preview */}
                    <div className="grid grid-cols-3 gap-2">
                        {flashSale.enrichedProducts?.slice(0, 3).map((product, index) => (
                            <div key={product._id} className="relative">
                                <img
                                    src={product.images?.[0] || "/placeholder.svg?height=60&width=60"}
                                    alt={product.name}
                                    className="w-full h-16 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                                />
                                {product.flashSale?.discountPercent > 0 && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">
                                        -{product.flashSale.discountPercent}%
                                    </div>
                                )}
                                {index === 0 && (
                                    <div className="absolute top-1 left-1 bg-yellow-400 text-black text-xs px-1 py-0.5 rounded-full font-bold">
                                        #1
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Enhanced Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg p-2 border border-pink-100">
                            <div className="text-pink-600 font-bold text-sm flex items-center justify-center gap-1">
                                <ShoppingBag className="w-3 h-3" />
                                {totalProducts}
                            </div>
                            <div className="text-gray-500 text-xs">Sản phẩm</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2 border border-green-100">
                            <div className="text-green-600 font-bold text-sm">{totalSold}</div>
                            <div className="text-gray-500 text-xs">Đã bán</div>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-2 border border-red-100">
                            <div className="text-red-600 font-bold text-sm">{avgDiscount}%</div>
                            <div className="text-gray-500 text-xs">Giảm giá</div>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                        size="sm"
                        className={`w-full bg-gradient-to-r ${getRankColor()} hover:shadow-lg text-white rounded-full transition-all duration-300 transform group-hover:scale-105`}
                    >
                        <Zap className="w-4 h-4 mr-2" />
                        Mua ngay - Flash Sale #{rank}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default HotFlashSaleCard
