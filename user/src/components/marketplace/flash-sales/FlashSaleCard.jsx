"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Eye } from "lucide-react"

const FlashSaleCard = ({ flashSale, onClick }) => {
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

    const getStatusInfo = () => {
        switch (status) {
            case "active":
                return {
                    badge: <Badge className="bg-green-500 hover:bg-green-600 text-white">Đang diễn ra</Badge>,
                    timeLabel: "Kết thúc sau:",
                    bgGradient: "from-green-500 to-emerald-500",
                }
            case "upcoming":
                return {
                    badge: <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Sắp diễn ra</Badge>,
                    timeLabel: "Bắt đầu sau:",
                    bgGradient: "from-blue-500 to-indigo-500",
                }
            default:
                return {
                    badge: <Badge className="bg-gray-500 hover:bg-gray-600 text-white">Đã kết thúc</Badge>,
                    timeLabel: "",
                    bgGradient: "from-gray-500 to-gray-600",
                }
        }
    }

    const statusInfo = getStatusInfo()
    const totalProducts = flashSale.enrichedProducts?.length || 0
    const totalSold = flashSale.summary?.totalSold || 0
    const avgDiscount = flashSale.summary?.avgDiscountPercent || 0

    return (
        <Card
            className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 bg-white"
            onClick={onClick}
        >
            <CardContent className="p-0">
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${statusInfo.bgGradient} p-4 text-white relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg line-clamp-1">{flashSale.name}</h3>
                                <p className="text-white/80 text-sm line-clamp-1">{flashSale.description}</p>
                            </div>
                            {statusInfo.badge}
                        </div>

                        {/* Countdown Timer */}
                        {timeLeft && status !== "ended" && (
                            <div className="bg-black/20 rounded-lg p-2 backdrop-blur-sm">
                                <div className="text-xs text-white/80 mb-1">{statusInfo.timeLabel}</div>
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
                            </div>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-pink-50 rounded-lg p-2">
                            <div className="text-pink-600 font-bold text-sm">{totalProducts}</div>
                            <div className="text-gray-500 text-xs">Sản phẩm</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2">
                            <div className="text-green-600 font-bold text-sm">{totalSold}</div>
                            <div className="text-gray-500 text-xs">Đã bán</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2">
                            <div className="text-red-600 font-bold text-sm">{avgDiscount}%</div>
                            <div className="text-gray-500 text-xs">Giảm giá</div>
                        </div>
                    </div>

                    {/* View Details Button */}
                    <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full transition-all duration-300"
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Xem chi tiết
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default FlashSaleCard
