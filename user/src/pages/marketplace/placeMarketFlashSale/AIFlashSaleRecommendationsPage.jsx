"use client"

import { useState, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Card, CardContent } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Skeleton } from "../../../components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import {
    Search,
    Sparkles,
    Zap,
    TrendingUp,
    Clock,
    Star,
    ShoppingBag,
    ArrowRight,
    Flame,
    Bot,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import RecommendedProductCard from "../../../components/marketplace/flash-sales/RecommendedProductCard"
import {
    getRecommendedFlashSales,
    getBulkFlashSalesRecommendations,
    calculateTimeRemaining,
    calculateDiscountPercent,
} from "../../../services/recommendationService"
import { getFlashSaleForUser } from "../../../services/flashSaleService"

import FlashSaleDetailModal from "../../../components/marketplace/flash-sales/FlashSaleDetailModal"


const AIFlashSaleRecommendationsPage = () => {
    const [activeTab, setActiveTab] = useState("recommended")
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState("recommended")
    const [sortOrder, setSortOrder] = useState("desc")
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [searchLoading, setSearchLoading] = useState(false)

    const [selectedFlashSale, setSelectedFlashSale] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [modalLoading, setModalLoading] = useState(false)

    const [data, setData] = useState({
        flashSales: [],
        products: [],
        pagination: null,
        hasData: false,
        metadata: {},
    })

    const [bulkData, setBulkData] = useState({
        hot: { flashSales: [], products: [], hasData: false },
        endingSoon: { flashSales: [], products: [], hasData: false },
        newest: { flashSales: [], products: [], hasData: false },
    })

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        if (activeTab === "recommended") {
            fetchRecommendedData()
        }
    }, [currentPage, sortBy, sortOrder])

    const fetchInitialData = async () => {
        try {
            setLoading(true)
            const [recommendedData, bulkRecommendations] = await Promise.all([
                getRecommendedFlashSales(1, 12),
                getBulkFlashSalesRecommendations(),
            ])

            setData({
                flashSales: recommendedData.data.flashSales.map((fs) => ({
                    ...fs,
                    timeRemaining: calculateTimeRemaining(fs.endTime),
                    isActive: new Date(fs.endTime) > new Date(),
                    productCount: fs.products?.length || 0,
                })),
                products: recommendedData.data.products.map((p) => ({
                    ...p,
                    discountPercent: calculateDiscountPercent(p.price, p.salePrice),
                    isOnSale: p.salePrice && p.salePrice < p.price,
                })),
                pagination: {
                    flashSales: {
                        currentPage: recommendedData.data.pagination.flashSales?.currentPage || 1,
                        totalPages: recommendedData.data.pagination.flashSales?.totalPages || 0,
                        totalCount: recommendedData.data.pagination.flashSales?.totalCount || 0,
                        limit: recommendedData.data.pagination.flashSales?.limit || 10,
                        hasNext: recommendedData.data.pagination.flashSales?.hasNext || false,
                        hasPrev: recommendedData.data.pagination.flashSales?.hasPrev || false,
                        nextPage: recommendedData.data.pagination.flashSales?.nextPage || null,
                        prevPage: recommendedData.data.pagination.flashSales?.prevPage || null,
                    },
                    products: {
                        currentPage: recommendedData.data.pagination.products?.currentPage || 1,
                        totalPages: recommendedData.data.pagination.products?.totalPages || 0,
                        totalCount: recommendedData.data.pagination.products?.totalCount || 0,
                        limit: recommendedData.data.pagination.products?.limit || 10,
                        hasNext: recommendedData.data.pagination.products?.hasNext || false,
                        hasPrev: recommendedData.data.pagination.products?.hasPrev || false,
                        nextPage: recommendedData.data.pagination.products?.nextPage || null,
                        prevPage: recommendedData.data.pagination.products?.prevPage || null,
                    },
                },
                hasData: recommendedData.data.flashSales.length > 0 || recommendedData.data.products.length > 0,
                metadata: recommendedData.data.metadata || {},
            })

            setBulkData({
                hot: {
                    flashSales: bulkRecommendations.hot.flashSales.map((fs) => ({
                        ...fs,
                        timeRemaining: calculateTimeRemaining(fs.endTime),
                        isActive: new Date(fs.endTime) > new Date(),
                        productCount: fs.products?.length || 0,
                    })),
                    products: bulkRecommendations.hot.products.map((p) => ({
                        ...p,
                        discountPercent: calculateDiscountPercent(p.price, p.salePrice),
                        isOnSale: p.salePrice && p.salePrice < p.price,
                    })),
                    hasData: bulkRecommendations.hot.flashSales.length > 0 || bulkRecommendations.hot.products.length > 0,
                },
                endingSoon: {
                    flashSales: bulkRecommendations.endingSoon.flashSales.map((fs) => ({
                        ...fs,
                        timeRemaining: calculateTimeRemaining(fs.endTime),
                        isActive: new Date(fs.endTime) > new Date(),
                        productCount: fs.products?.length || 0,
                    })),
                    products: bulkRecommendations.endingSoon.products.map((p) => ({
                        ...p,
                        discountPercent: calculateDiscountPercent(p.price, p.salePrice),
                        isOnSale: p.salePrice && p.salePrice < p.price,
                    })),
                    hasData:
                        bulkRecommendations.endingSoon.flashSales.length > 0 || bulkRecommendations.endingSoon.products.length > 0,
                },
                newest: {
                    flashSales: bulkRecommendations.newest.flashSales.map((fs) => ({
                        ...fs,
                        timeRemaining: calculateTimeRemaining(fs.endTime),
                        isActive: new Date(fs.endTime) > new Date(),
                        productCount: fs.products?.length || 0,
                    })),
                    products: bulkRecommendations.newest.products.map((p) => ({
                        ...p,
                        discountPercent: calculateDiscountPercent(p.price, p.salePrice),
                        isOnSale: p.salePrice && p.salePrice < p.price,
                    })),
                    hasData: bulkRecommendations.newest.flashSales.length > 0 || bulkRecommendations.newest.products.length > 0,
                },
            })
        } catch (error) {
            console.error("Error fetching initial data:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchRecommendedData = async () => {
        try {
            setLoading(true)
            const filters = { sortBy, sortOrder, search: searchQuery }
            const response = await getRecommendedFlashSales(currentPage, 12, filters)
            setData({
                flashSales: response.data.flashSales.map((fs) => ({
                    ...fs,
                    timeRemaining: calculateTimeRemaining(fs.endTime),
                    isActive: new Date(fs.endTime) > new Date(),
                    productCount: fs.products?.length || 0,
                })),
                products: response.data.products.map((p) => ({
                    ...p,
                    discountPercent: calculateDiscountPercent(p.price, p.salePrice),
                    isOnSale: p.salePrice && p.salePrice < p.price,
                })),
                pagination: {
                    flashSales: {
                        currentPage: response.data.pagination.flashSales?.currentPage || 1,
                        totalPages: response.data.pagination.flashSales?.totalPages || 0,
                        totalCount: response.data.pagination.flashSales?.totalCount || 0,
                        limit: response.data.pagination.flashSales?.limit || 10,
                        hasNext: response.data.pagination.flashSales?.hasNext || false,
                        hasPrev: response.data.pagination.flashSales?.hasPrev || false,
                        nextPage: response.data.pagination.flashSales?.nextPage || null,
                        prevPage: response.data.pagination.flashSales?.prevPage || null,
                    },
                    products: {
                        currentPage: response.data.pagination.products?.currentPage || 1,
                        totalPages: response.data.pagination.products?.totalPages || 0,
                        totalCount: response.data.pagination.products?.totalCount || 0,
                        limit: response.data.pagination.products?.limit || 10,
                        hasNext: response.data.pagination.products?.hasNext || false,
                        hasPrev: response.data.pagination.products?.hasPrev || false,
                        nextPage: response.data.pagination.products?.nextPage || null,
                        prevPage: response.data.pagination.products?.prevPage || null,
                    },
                },
                hasData: response.data.flashSales.length > 0 || response.data.products.length > 0,
                metadata: response.data.metadata || {},
            })
        } catch (error) {
            console.error("Error fetching recommended data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async () => {
        if (!searchQuery.trim() && activeTab === "recommended") {
            fetchRecommendedData()
            return
        }

        try {
            setSearchLoading(true)
            setCurrentPage(1)
            const filters = { sortBy, sortOrder, search: searchQuery }
            const response = await getRecommendedFlashSales(1, 12, filters)
            setData({
                flashSales: response.data.flashSales.map((fs) => ({
                    ...fs,
                    timeRemaining: calculateTimeRemaining(fs.endTime),
                    isActive: new Date(fs.endTime) > new Date(),
                    productCount: fs.products?.length || 0,
                })),
                products: response.data.products.map((p) => ({
                    ...p,
                    discountPercent: calculateDiscountPercent(p.price, p.salePrice),
                    isOnSale: p.salePrice && p.salePrice < p.price,
                })),
                pagination: {
                    flashSales: {
                        currentPage: response.data.pagination.flashSales?.currentPage || 1,
                        totalPages: response.data.pagination.flashSales?.totalPages || 0,
                        totalCount: response.data.pagination.flashSales?.totalCount || 0,
                        limit: response.data.pagination.flashSales?.limit || 10,
                        hasNext: response.data.pagination.flashSales?.hasNext || false,
                        hasPrev: response.data.pagination.flashSales?.hasPrev || false,
                        nextPage: response.data.pagination.flashSales?.nextPage || null,
                        prevPage: response.data.pagination.flashSales?.prevPage || null,
                    },
                    products: {
                        currentPage: response.data.pagination.products?.currentPage || 1,
                        totalPages: response.data.pagination.products?.totalPages || 0,
                        totalCount: response.data.pagination.products?.totalCount || 0,
                        limit: response.data.pagination.products?.limit || 10,
                        hasNext: response.data.pagination.products?.hasNext || false,
                        hasPrev: response.data.pagination.products?.hasPrev || false,
                        nextPage: response.data.pagination.products?.nextPage || null,
                        prevPage: response.data.pagination.products?.prevPage || null,
                    },
                },
                hasData: response.data.flashSales.length > 0 || response.data.products.length > 0,
                metadata: response.data.metadata || {},
            })
        } catch (error) {
            console.error("Error searching:", error)
        } finally {
            setSearchLoading(false)
        }
    }

    const handleFlashSaleClick = async (flashSaleId) => {
        try {
            setModalLoading(true)
            setModalOpen(true)
            const response = await getFlashSaleForUser(flashSaleId)
            setSelectedFlashSale(response.data)
        } catch (err) {
            console.error("Error fetching flash sale details:", err)
        } finally {
            setModalLoading(false)
        }
    }

    const handleTabChange = (value) => {
        setActiveTab(value)
        setCurrentPage(1)
        setSearchQuery("")
    }

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 text-white">
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="relative container mx-auto px-4 py-16">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="flex items-center justify-center mb-6">
                            <div className="bg-white bg-opacity-20 rounded-full p-4 backdrop-blur-sm">
                                <Bot className="w-12 h-12" />
                            </div>
                        </div>
                        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                            AI Flash Sale Recommendations
                        </h1>
                        <p className="text-xl text-purple-100 mb-8 leading-relaxed">
                            Khám phá những Flash Sale được AI cá nhân hóa dành riêng cho bạn. Công nghệ thông minh giúp tìm ra những
                            deal tốt nhất phù hợp với sở thích của bạn.
                        </p>

                        {/* Search Bar */}
                        <div className="flex gap-4 max-w-2xl mx-auto">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <Input
                                    placeholder="Tìm kiếm Flash Sale được AI gợi ý..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 h-12 bg-white bg-opacity-90 border-0 rounded-full text-gray-800 placeholder-gray-500"
                                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                                />
                            </div>
                            <Button
                                onClick={handleSearch}
                                disabled={searchLoading}
                                className="h-12 px-8 bg-white text-purple-600 hover:bg-purple-50 rounded-full font-semibold"
                            >
                                {searchLoading ? (
                                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        Tìm kiếm AI
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* AI Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 -mt-16 relative z-10">
                    <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
                        <CardContent className="p-6 text-center">
                            <div className="bg-gradient-to-r from-purple-500 to-blue-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 mb-2">AI Personalized</h3>
                            <p className="text-gray-600 text-sm">Gợi ý được cá nhân hóa dựa trên hành vi mua sắm</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
                        <CardContent className="p-6 text-center">
                            <div className="bg-gradient-to-r from-pink-500 to-red-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 mb-2">Smart Analytics</h3>
                            <p className="text-gray-600 text-sm">Phân tích thông minh để tìm deal tốt nhất</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
                        <CardContent className="p-6 text-center">
                            <div className="bg-gradient-to-r from-green-500 to-teal-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 mb-2">Real-time Updates</h3>
                            <p className="text-gray-600 text-sm">Cập nhật theo thời gian thực</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg rounded-2xl p-2 mb-8">
                        <TabsTrigger
                            value="recommended"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-xl font-semibold"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            AI Gợi ý
                        </TabsTrigger>
                        <TabsTrigger
                            value="hot"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-xl font-semibold"
                        >
                            <Flame className="w-4 h-4 mr-2" />
                            Đang Hot
                        </TabsTrigger>
                        <TabsTrigger
                            value="ending-soon"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-xl font-semibold"
                        >
                            <Clock className="w-4 h-4 mr-2" />
                            Sắp kết thúc
                        </TabsTrigger>
                        <TabsTrigger
                            value="newest"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-xl font-semibold"
                        >
                            <Star className="w-4 h-4 mr-2" />
                            Mới nhất
                        </TabsTrigger>
                    </TabsList>

                    {/* AI Recommended Tab */}
                    <TabsContent value="recommended" className="space-y-8">
                        <AIRecommendedSection
                            data={data}
                            loading={loading}
                            currentPage={currentPage}
                            onPageChange={handlePageChange}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            onFlashSaleClick={handleFlashSaleClick}
                        />
                    </TabsContent>

                    {/* Hot Flash Sales Tab */}
                    <TabsContent value="hot" className="space-y-8">
                        <BulkSection
                            title="🔥 Flash Sales Đang Hot"
                            description="Những Flash Sale được mua nhiều nhất hiện tại"
                            data={bulkData.hot}
                            loading={loading}
                            gradientFrom="from-red-500"
                            gradientTo="to-pink-500"
                            onFlashSaleClick={handleFlashSaleClick}
                        />
                    </TabsContent>

                    {/* Ending Soon Tab */}
                    <TabsContent value="ending-soon" className="space-y-8">
                        <BulkSection
                            title="⏰ Flash Sales Sắp Kết Thúc"
                            description="Nhanh tay kẻo lỡ những deal cuối cùng"
                            data={bulkData.endingSoon}
                            loading={loading}
                            gradientFrom="from-orange-500"
                            gradientTo="to-red-500"
                            onFlashSaleClick={handleFlashSaleClick}
                        />
                    </TabsContent>

                    {/* Newest Tab */}
                    <TabsContent value="newest" className="space-y-8">
                        <BulkSection
                            title="✨ Flash Sales Mới Nhất"
                            description="Những Flash Sale vừa được ra mắt"
                            data={bulkData.newest}
                            loading={loading}
                            gradientFrom="from-green-500"
                            gradientTo="to-teal-500"
                            onFlashSaleClick={handleFlashSaleClick}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Flash Sale Detail Modal */}
            <FlashSaleDetailModal
                flashSale={selectedFlashSale}
                open={modalOpen}
                onOpenChange={setModalOpen}
                loading={modalLoading}
            />
        </div>
    )
}

// AI Recommended Section Component
const AIRecommendedSection = ({
    data,
    loading,
    currentPage,
    onPageChange,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    onFlashSaleClick,
}) => {
    if (loading) {
        return <LoadingSkeleton />
    }

    if (!data.hasData) {
        return <EmptyState />
    }

    return (
        <div className="space-y-8">
            {/* Sort Controls */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-lg">
                <div className="flex items-center gap-4">
                    <span className="text-gray-700 font-medium">Sắp xếp theo:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="recommended">AI Gợi ý</option>
                        <option value="totalPurchases">Lượt mua</option>
                        <option value="endTime">Thời gian kết thúc</option>
                        <option value="newest">Mới nhất</option>
                    </select>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="desc">Giảm dần</option>
                        <option value="asc">Tăng dần</option>
                    </select>
                </div>

                {data.metadata?.isRecommendationBased && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                        <Bot className="w-3 h-3 mr-1" />
                        AI Powered
                    </Badge>
                )}
            </div>

            {/* Flash Sales Grid */}
            {data.flashSales.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <Zap className="w-6 h-6 mr-2 text-purple-600" />
                        Flash Sales Được Gợi Ý
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {data.flashSales.map((flashSale) => (
                            <AIFlashSaleCard key={flashSale._id} flashSale={flashSale} onFlashSaleClick={onFlashSaleClick} />
                        ))}
                    </div>
                </div>
            )}

            {/* Products Grid */}
            {data.products.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <ShoppingBag className="w-6 h-6 mr-2 text-pink-600" />
                        Sản Phẩm Được Gợi Ý
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {data.products.map((product) => (
                            <RecommendedProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            )}

            {/* Pagination */}
            {data.pagination?.flashSales && data.pagination.flashSales.totalPages > 1 && (
                <Pagination pagination={data.pagination.flashSales} onPageChange={onPageChange} />
            )}
        </div>
    )
}

// Bulk Section Component
const BulkSection = ({ title, description, data, loading, gradientFrom, gradientTo, onFlashSaleClick }) => {
    if (loading) {
        return <LoadingSkeleton />
    }

    if (!data.hasData) {
        return <EmptyState />
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2
                    className={`text-3xl font-bold bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent mb-4`}
                >
                    {title}
                </h2>
                <p className="text-gray-600 text-lg">{description}</p>
            </div>

            {/* Flash Sales */}
            {data.flashSales.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.flashSales.map((flashSale) => (
                        <AIFlashSaleCard key={flashSale._id} flashSale={flashSale} onFlashSaleClick={onFlashSaleClick} />
                    ))}
                </div>
            )}

            {/* Products */}
            {data.products.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Sản phẩm nổi bật</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {data.products.slice(0, 12).map((product) => (
                            <RecommendedProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// AI Flash Sale Card Component
const AIFlashSaleCard = ({ flashSale, onFlashSaleClick }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount)
    }

    const formatTimeRemaining = (timeRemaining) => {
        if (!timeRemaining || timeRemaining.expired) return "Đã kết thúc"

        const { days, hours, minutes } = timeRemaining
        if (days > 0) return `${days} ngày ${hours} giờ`
        if (hours > 0) return `${hours} giờ ${minutes} phút`
        return `${minutes} phút`
    }

    return (
        <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 bg-white rounded-2xl">
            <div className="relative">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-white bg-opacity-20 text-white border-0">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI Gợi ý
                        </Badge>
                        {flashSale.timeRemaining && !flashSale.timeRemaining.expired && (
                            <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {formatTimeRemaining(flashSale.timeRemaining)}
                            </div>
                        )}
                    </div>
                    <h3 className="font-bold text-lg line-clamp-2">{flashSale.name}</h3>
                    <p className="text-purple-100 text-sm line-clamp-2 mt-2">{flashSale.description}</p>
                </div>

                {/* Content */}
                <CardContent className="p-4 space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="text-center bg-purple-50 rounded-lg p-3">
                            <div className="text-purple-600 font-bold text-lg">{flashSale.productCount || 0}</div>
                            <div className="text-gray-500 text-xs">Sản phẩm</div>
                        </div>
                        <div className="text-center bg-green-50 rounded-lg p-3">
                            <div className="text-green-600 font-bold text-lg">{flashSale.stats?.totalPurchases || 0}</div>
                            <div className="text-gray-500 text-xs">Đã bán</div>
                        </div>
                        <div className="text-center bg-red-50 rounded-lg p-3">
                            <div className="text-red-600 font-bold text-lg">{flashSale.stats?.avgDiscountPercent || 0}%</div>
                            <div className="text-gray-500 text-xs">Giảm giá</div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <Button
                        onClick={() => onFlashSaleClick && onFlashSaleClick(flashSale._id)}
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-semibold py-3 group-hover:shadow-lg transition-all duration-300"
                    >
                        Khám phá ngay
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </CardContent>
            </div>
        </Card>
    )
}

// Pagination Component
const Pagination = ({ pagination, onPageChange }) => {
    if (!pagination) return null

    const { currentPage = 1, totalPages = 0, hasNext = false, hasPrev = false } = pagination

    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <Button
                variant="outline"
                disabled={!hasPrev}
                onClick={() => onPageChange(currentPage - 1)}
                className="rounded-full"
            >
                <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                        <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            onClick={() => onPageChange(page)}
                            className={`w-10 h-10 rounded-full ${currentPage === page ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white" : ""
                                }`}
                        >
                            {page}
                        </Button>
                    )
                })}
            </div>

            <Button
                variant="outline"
                disabled={!hasNext}
                onClick={() => onPageChange(currentPage + 1)}
                className="rounded-full"
            >
                <ChevronRight className="w-4 h-4" />
            </Button>
        </div>
    )
}

// Loading Skeleton Component
const LoadingSkeleton = () => {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="overflow-hidden rounded-2xl">
                        <Skeleton className="h-32 w-full" />
                        <CardContent className="p-4 space-y-3">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <div className="grid grid-cols-3 gap-2">
                                {[...Array(3)].map((_, j) => (
                                    <Skeleton key={j} className="h-12 w-full rounded-lg" />
                                ))}
                            </div>
                            <Skeleton className="h-10 w-full rounded-xl" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

// Empty State Component
const EmptyState = () => {
    return (
        <div className="text-center py-16">
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Chưa có gợi ý nào</h3>
            <p className="text-gray-600 max-w-md mx-auto">
                AI đang học hỏi từ hành vi của bạn để đưa ra những gợi ý tốt nhất. Hãy khám phá thêm các sản phẩm để nhận được
                gợi ý cá nhân hóa!
            </p>
        </div>
    )
}

export default AIFlashSaleRecommendationsPage