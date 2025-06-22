"use client"

import { useState, useEffect } from "react"
import { Button } from "../../ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs"
import { Badge } from "../../ui/badge"
import { useNavigate } from "react-router-dom"
import {
    getRecommendedFlashSales,
    getBulkFlashSalesRecommendations,
    formatFlashSaleData,
} from "../../../services/recommendationService"
import { getFlashSaleForUser } from "../../../services/flashSaleService"
import {
    Sparkles,
    TrendingUp,
    Clock,
    Zap,
    ArrowRight,
    RefreshCw,
    Brain,
    Target,
    ChevronDown,
    ChevronUp,
} from "lucide-react"
import FlashSaleCard from "./FlashSaleCard"
import RecommendedProductCard from "./RecommendedProductCard"
import FlashSaleDetailModal from "./FlashSaleDetailModal"
import AIRecommendationsSkeleton from "./AIRecommendationsSkeleton"

const AIRecommendedFlashSales = () => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState("recommended")
    const [recommendations, setRecommendations] = useState({
        recommended: { flashSales: [], products: [], hasData: false, metadata: {} },
        hot: { flashSales: [], products: [], hasData: false },
        endingSoon: { flashSales: [], products: [], hasData: false },
        newest: { flashSales: [], products: [], hasData: false },
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const [expandedSections, setExpandedSections] = useState({
        flashSales: true,
        products: false,
    })

    // Modal state
    const [selectedFlashSale, setSelectedFlashSale] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [modalLoading, setModalLoading] = useState(false)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)

    useEffect(() => {
        fetchRecommendations()
    }, [])

    const fetchRecommendations = async (refresh = false) => {
        try {
            if (refresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            // Fetch main AI recommendations
            const [mainRecommendations, bulkRecommendations] = await Promise.all([
                getRecommendedFlashSales(1, 8, { sortBy: "recommended" }),
                getBulkFlashSalesRecommendations(),
            ])

            const formattedMain = formatFlashSaleData(mainRecommendations)

            setRecommendations({
                recommended: formattedMain,
                hot: bulkRecommendations.hot,
                endingSoon: bulkRecommendations.endingSoon,
                newest: bulkRecommendations.newest,
            })

            setHasMore(formattedMain.pagination?.hasNext || false)
            setError(null)
        } catch (err) {
            console.error("Error fetching AI recommendations:", err)
            setError("Không thể tải gợi ý AI")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleLoadMore = async () => {
        try {
            setLoading(true)
            const nextPage = currentPage + 1
            const response = await getRecommendedFlashSales(nextPage, 8, { sortBy: "recommended" })
            const formatted = formatFlashSaleData(response)

            setRecommendations((prev) => ({
                ...prev,
                recommended: {
                    ...prev.recommended,
                    flashSales: [...prev.recommended.flashSales, ...formatted.flashSales],
                    products: [...prev.recommended.products, ...formatted.products],
                    hasData: true,
                },
            }))

            setCurrentPage(nextPage)
            setHasMore(formatted.pagination?.hasNext || false)
        } catch (err) {
            console.error("Error loading more recommendations:", err)
        } finally {
            setLoading(false)
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

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }))
    }

    const getTabData = () => {
        switch (activeTab) {
            case "hot":
                return recommendations.hot
            case "endingSoon":
                return recommendations.endingSoon
            case "newest":
                return recommendations.newest
            default:
                return recommendations.recommended
        }
    }

    const currentData = getTabData()

    if (loading && !refreshing) {
        return <AIRecommendationsSkeleton />
    }

    if (error && !currentData.hasData) {
        return (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-lg p-6 mb-8">
                <div className="text-center py-8">
                    <div className="text-red-500 mb-4">
                        <Brain className="w-12 h-12 mx-auto mb-2" />
                        <p>{error}</p>
                    </div>
                    <Button onClick={() => fetchRecommendations()} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Thử lại
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-lg p-6 mb-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-full">
                            <Brain className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    Gợi ý dành cho bạn
                                </h2>
                                <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    AI
                                </Badge>
                            </div>
                            <p className="text-gray-600 text-sm flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                Được cá nhân hóa dựa trên sở thích của bạn
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => fetchRecommendations(true)}
                            disabled={refreshing}
                            variant="outline"
                            className="border-purple-200 text-purple-600 hover:bg-purple-50"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                            {refreshing ? "Đang làm mới..." : "Làm mới"}
                        </Button>
                        <Button
                            variant="outline"
                            className="border-purple-200 text-purple-600 hover:bg-purple-50"
                            onClick={() => navigate("/marketplace/flash-sales-recommendation")}
                        >
                            Xem tất cả
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>

                {/* AI Metadata Info */}
                {currentData.metadata && (
                    <div className="bg-white/50 rounded-lg p-3 mb-6 border border-purple-100">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <Brain className="w-4 h-4 text-purple-600" />
                                    <span className="text-gray-600">
                                        {currentData.metadata.isRecommendationBased ? "AI Recommendations" : "Fallback Results"}
                                    </span>
                                </span>
                                {currentData.metadata.reason && <span className="text-gray-500">• {currentData.metadata.reason}</span>}
                            </div>
                            <span className="text-gray-500">
                                Cập nhật: {new Date(currentData.metadata.timestamp).toLocaleTimeString("vi-VN")}
                            </span>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
                        <TabsTrigger
                            value="recommended"
                            className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Dành cho bạn
                        </TabsTrigger>
                        <TabsTrigger value="hot" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Đang hot
                        </TabsTrigger>
                        <TabsTrigger
                            value="endingSoon"
                            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                        >
                            <Clock className="w-4 h-4 mr-2" />
                            Sắp kết thúc
                        </TabsTrigger>
                        <TabsTrigger value="newest" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                            <Zap className="w-4 h-4 mr-2" />
                            Mới nhất
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="recommended" className="mt-6">
                        <RecommendationContent
                            data={recommendations.recommended}
                            onFlashSaleClick={handleFlashSaleClick}
                            expandedSections={expandedSections}
                            onToggleSection={toggleSection}
                            onLoadMore={handleLoadMore}
                            hasMore={hasMore}
                            loading={loading}
                        />
                    </TabsContent>

                    <TabsContent value="hot" className="mt-6">
                        <RecommendationContent
                            data={recommendations.hot}
                            onFlashSaleClick={handleFlashSaleClick}
                            expandedSections={expandedSections}
                            onToggleSection={toggleSection}
                        />
                    </TabsContent>

                    <TabsContent value="endingSoon" className="mt-6">
                        <RecommendationContent
                            data={recommendations.endingSoon}
                            onFlashSaleClick={handleFlashSaleClick}
                            expandedSections={expandedSections}
                            onToggleSection={toggleSection}
                        />
                    </TabsContent>

                    <TabsContent value="newest" className="mt-6">
                        <RecommendationContent
                            data={recommendations.newest}
                            onFlashSaleClick={handleFlashSaleClick}
                            expandedSections={expandedSections}
                            onToggleSection={toggleSection}
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
        </>
    )
}

// Component con để hiển thị nội dung recommendations
const RecommendationContent = ({
    data,
    onFlashSaleClick,
    expandedSections,
    onToggleSection,
    onLoadMore,
    hasMore,
    loading,
}) => {
    if (!data.hasData) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                    <Brain className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Chưa có gợi ý</h3>
                <p className="text-gray-500">AI đang học hỏi sở thích của bạn để đưa ra gợi ý tốt hơn</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Flash Sales Section */}
            {data.flashSales.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold text-gray-800">Flash Sale gợi ý</h3>
                            <Badge variant="outline" className="border-purple-200 text-purple-600">
                                {data.flashSales.length} chương trình
                            </Badge>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleSection("flashSales")}
                            className="text-purple-600 hover:text-purple-700"
                        >
                            {expandedSections.flashSales ? (
                                <>
                                    Thu gọn <ChevronUp className="w-4 h-4 ml-1" />
                                </>
                            ) : (
                                <>
                                    Mở rộng <ChevronDown className="w-4 h-4 ml-1" />
                                </>
                            )}
                        </Button>
                    </div>

                    {expandedSections.flashSales && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                                {data.flashSales.map((flashSale) => (
                                    <FlashSaleCard
                                        key={flashSale._id}
                                        flashSale={flashSale}
                                        onClick={() => onFlashSaleClick(flashSale._id)}
                                    />
                                ))}
                            </div>

                            {/* Load More Button */}
                            {hasMore && onLoadMore && (
                                <div className="flex justify-center">
                                    <Button
                                        onClick={onLoadMore}
                                        disabled={loading}
                                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-2 rounded-full"
                                    >
                                        {loading ? "Đang tải..." : "Xem thêm Flash Sale"}
                                        <ChevronDown className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Products Section */}
            {data.products.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold text-gray-800">Sản phẩm gợi ý</h3>
                            <Badge variant="outline" className="border-blue-200 text-blue-600">
                                {data.products.length} sản phẩm
                            </Badge>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleSection("products")}
                            className="text-blue-600 hover:text-blue-700"
                        >
                            {expandedSections.products ? (
                                <>
                                    Thu gọn <ChevronUp className="w-4 h-4 ml-1" />
                                </>
                            ) : (
                                <>
                                    Mở rộng <ChevronDown className="w-4 h-4 ml-1" />
                                </>
                            )}
                        </Button>
                    </div>

                    {expandedSections.products && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {data.products.map((product) => (
                                <RecommendedProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default AIRecommendedFlashSales