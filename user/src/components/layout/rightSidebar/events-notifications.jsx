"use client"

import { cn } from "../../../lib/utils"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Calendar, Bell, Gift, ArrowRight, Sparkles, Zap } from "lucide-react"
import { Skeleton } from "../../../components/ui/skeleton"

export default function EventsNotifications() {
    const [events, setEvents] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setEvents([
                {
                    id: 1,
                    title: "Flash Sale Valentine",
                    description: "Giảm giá đến 70% cho tất cả sản phẩm thời trang",
                    type: "sale",
                    time: "2 giờ nữa",
                    isActive: true,
                    color: "pink",
                },
                {
                    id: 2,
                    title: "Sự kiện mùa xuân",
                    description: "Nhận voucher 500K khi mua từ 2 triệu",
                    type: "event",
                    time: "5 ngày nữa",
                    isActive: false,
                    color: "rose",
                },
                {
                    id: 3,
                    title: "Livestream review sản phẩm",
                    description: "Cùng KOL review sản phẩm hot nhất",
                    type: "live",
                    time: "Hôm nay 20:00",
                    isActive: true,
                    color: "red",
                },
                {
                    id: 4,
                    title: "Khuyến mãi cuối tuần",
                    description: "Freeship toàn quốc cho đơn từ 200K",
                    type: "promotion",
                    time: "Đang diễn ra",
                    isActive: true,
                    color: "pink",
                },
            ])
            setIsLoading(false)
        }, 800)
    }, [])

    const getEventIcon = (type) => {
        switch (type) {
            case "sale":
                return <Gift className="w-4 h-4 text-pink-500" />
            case "event":
                return <Calendar className="w-4 h-4 text-rose-500" />
            case "live":
                return <Zap className="w-4 h-4 text-red-500" />
            case "promotion":
                return <Sparkles className="w-4 h-4 text-pink-600" />
            default:
                return <Bell className="w-4 h-4 text-gray-500" />
        }
    }

    const getEventBorderColor = (color, isActive) => {
        if (!isActive) return "border-l-gray-300"

        switch (color) {
            case "pink":
                return "border-l-pink-400"
            case "rose":
                return "border-l-rose-400"
            case "red":
                return "border-l-red-400"
            default:
                return "border-l-pink-400"
        }
    }

    if (isLoading) {
        return (
            <Card className="shadow-sm border-0 bg-white">
                <CardHeader className="pb-3 pt-4 px-4">
                    <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-pink-500" />
                        <h3 className="font-semibold text-gray-900 text-sm">Sự kiện & Thông báo</h3>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="w-4 h-4 rounded" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="shadow-sm border-0 bg-white overflow-hidden">
            <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-pink-500" />
                    <h3 className="font-semibold text-gray-900 text-sm">Sự kiện & Thông báo</h3>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="space-y-1">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className={cn(
                                "group px-4 py-3 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 transition-all duration-200 cursor-pointer border-l-2 border-transparent",
                                getEventBorderColor(event.color, event.isActive),
                                "hover:border-l-pink-500",
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 p-1 rounded-full bg-pink-50 group-hover:bg-pink-100 transition-colors">
                                    {getEventIcon(event.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-sm text-gray-900 truncate group-hover:text-pink-700 transition-colors">
                                            {event.title}
                                        </h4>
                                        {event.isActive && (
                                            <Badge
                                                variant="destructive"
                                                className="text-xs px-1.5 py-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white animate-pulse"
                                            >
                                                LIVE
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">{event.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-pink-600 font-medium">{event.time}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                                        >
                                            Xem chi tiết
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-3 border-t border-gray-100 bg-gradient-to-r from-pink-50/50 to-rose-50/50">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center gap-2 text-pink-600 hover:text-pink-700 hover:bg-pink-50 font-medium"
                    >
                        <span className="text-sm">Xem tất cả thông báo</span>
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
