"use client"

import { useState, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Card, CardContent } from "../../../components/ui/card"
import { Skeleton } from "../../../components/ui/skeleton"
import {
    getActiveFlashSales,
    getUpcomingFlashSales,
    getEndedFlashSales,
    searchFlashSales,
} from "../../../services/flashSaleService"
import { Search, Filter, Clock, FlameIcon as Fire, CheckCircle } from "lucide-react"

const FlashSalesPage = () => {
    const [activeTab, setActiveTab] = useState("active")
    const [searchQuery, setSearchQuery] = useState("")
    const [flashSales, setFlashSales] = useState({
        active: [],
        upcoming: [],
        ended: [],
    })
    const [loading, setLoading] = useState({
        active: true,
        upcoming: true,
        ended: true,
    })
    const [pagination, setPagination] = useState({
        active: { page: 1, totalPages: 1 },
        upcoming: { page: 1, totalPages: 1 },
        ended: { page: 1, totalPages: 1 },
    })

    useEffect(() => {
        fetchFlashSales()
    }, [])

    const fetchFlashSales = async () => {
        try {
            const [activeRes, upcomingRes, endedRes] = await Promise.all([
                getActiveFlashSales(1, 12),
                getUpcomingFlashSales(1, 12),
                getEndedFlashSales(1, 12),
            ])

            setFlashSales({
                active: activeRes.data?.items || [],
                upcoming: upcomingRes.data?.items || [],
                ended: endedRes.data?.items || [],
            })

            setPagination({
                active: {
                    page: activeRes.data?.pagination?.page || 1,
                    totalPages: activeRes.data?.pagination?.totalPages || 1,
                },
                upcoming: {
                    page: upcomingRes.data?.pagination?.page || 1,
                    totalPages: upcomingRes.data?.pagination?.totalPages || 1,
                },
                ended: {
                    page: endedRes.data?.pagination?.page || 1,
                    totalPages: endedRes.data?.pagination?.totalPages || 1,
                },
            })
        } catch (err) {
            console.error("Error fetching flash sales:", err)
        } finally {
            setLoading({
                active: false,
                upcoming: false,
                ended: false,
            })
        }
    }

    const handleSearch = async () => {
        if (!searchQuery.trim()) return

        try {
            const response = await searchFlashSales(searchQuery)
            // Handle search results
            console.log("Search results:", response.data)
        } catch (err) {
            console.error("Error searching flash sales:", err)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4">
                    Tất cả Flash Sale
                </h1>
                <p className="text-gray-600 mb-6">Khám phá các chương trình Flash Sale hấp dẫn với giá sốc mỗi ngày</p>

                {/* Search Bar */}
                <div className="flex gap-4 max-w-2xl">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            placeholder="Tìm kiếm Flash Sale..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        />
                    </div>
                    <Button onClick={handleSearch} className="bg-pink-500 hover:bg-pink-600">
                        Tìm kiếm
                    </Button>
                    <Button variant="outline" className="border-pink-200 text-pink-600">
                        <Filter className="w-4 h-4 mr-2" />
                        Bộ lọc
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
                    <TabsTrigger value="active" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                        <Fire className="w-4 h-4 mr-2" />
                        Đang diễn ra
                    </TabsTrigger>
                    <TabsTrigger value="upcoming" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                        <Clock className="w-4 h-4 mr-2" />
                        Sắp diễn ra
                    </TabsTrigger>
                    <TabsTrigger value="ended" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Đã kết thúc
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-6">
                    <FlashSaleGrid flashSales={flashSales.active} loading={loading.active} type="active" />
                </TabsContent>

                <TabsContent value="upcoming" className="mt-6">
                    <FlashSaleGrid flashSales={flashSales.upcoming} loading={loading.upcoming} type="upcoming" />
                </TabsContent>

                <TabsContent value="ended" className="mt-6">
                    <FlashSaleGrid flashSales={flashSales.ended} loading={loading.ended} type="ended" />
                </TabsContent>
            </Tabs>
        </div>
    )
}

const FlashSaleGrid = ({ flashSales, loading, type }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardContent className="p-0">
                            <Skeleton className="h-32 w-full" />
                            <div className="p-4 space-y-3">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <div className="grid grid-cols-3 gap-2">
                                    {[...Array(3)].map((_, j) => (
                                        <Skeleton key={j} className="h-12 w-full" />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (flashSales.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                    <Fire className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Không có Flash Sale nào</h3>
                <p className="text-gray-500">
                    {type === "active" && "Hiện tại không có Flash Sale nào đang diễn ra"}
                    {type === "upcoming" && "Hiện tại không có Flash Sale nào sắp diễn ra"}
                    {type === "ended" && "Chưa có Flash Sale nào kết thúc"}
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {flashSales.map((flashSale) => (
                <FlashSaleCard key={flashSale._id} flashSale={flashSale} type={type} />
            ))}
        </div>
    )
}

const FlashSaleCard = ({ flashSale, type }) => {
    // Reuse the FlashSaleCard component from the main FlashSale component
    // This would be the same component we created above
    return (
        <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 bg-white">
            <CardContent className="p-0">
                {/* Implementation would be similar to the FlashSaleCard above */}
                <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{flashSale.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{flashSale.description}</p>

                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        <div className="bg-pink-50 rounded-lg p-2">
                            <div className="text-pink-600 font-bold text-sm">{flashSale.enrichedProducts?.length || 0}</div>
                            <div className="text-gray-500 text-xs">Sản phẩm</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2">
                            <div className="text-green-600 font-bold text-sm">{flashSale.summary?.totalSold || 0}</div>
                            <div className="text-gray-500 text-xs">Đã bán</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2">
                            <div className="text-red-600 font-bold text-sm">{flashSale.summary?.avgDiscountPercent || 0}%</div>
                            <div className="text-gray-500 text-xs">Giảm giá</div>
                        </div>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white">
                        Xem chi tiết
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default FlashSalesPage
