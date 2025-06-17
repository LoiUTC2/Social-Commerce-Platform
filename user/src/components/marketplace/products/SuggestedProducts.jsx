"use client"

import { Button } from "../../../components/ui/button"
import { ArrowRight, Sparkles, AlertCircle, Loader2, Brain, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import ProductCard from "../ProductCard"
import { useSuggestedProducts } from "../../../hooks/useProducts"
import { useState } from "react"

const SuggestedProducts = ({ method = "hybrid", limit = 12 }) => {
    const { products, loading, error, pagination, metadata, retry } = useSuggestedProducts(limit, method)
    const [retryCount, setRetryCount] = useState(0)

    const handleViewAll = () => {
        // Navigate to suggested products page
        window.location.href = "/marketplace/suggested-products"
    }

    const handleRetry = () => {
        setRetryCount((prev) => prev + 1)
        retry()
    }

    if (error) {
        return (
            <section className="w-full py-8 bg-white">
                <div className="container mx-auto px-4">
                    <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                </div>
            </section>
        )
    }

    return (
        <section className="w-full py-8 bg-white">
            <div className="container mx-auto px-4">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">💡 Gợi ý cho bạn</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {loading
                                    ? "Đang phân tích sở thích..."
                                    : metadata?.method === "fallback"
                                        ? "Sản phẩm phổ biến dành cho bạn"
                                        : `Dành riêng cho sở thích của bạn (${metadata?.method || "AI"})`}
                            </p>
                            {metadata?.aiRecommendationsCount > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                    <Brain className="w-3 h-3 text-purple-500" />
                                    <span className="text-xs text-purple-600">
                                        AI đã phân tích {metadata.aiRecommendationsCount} gợi ý
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="group border-purple-200 text-purple-600 hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all duration-300"
                        onClick={handleViewAll}
                        disabled={loading}
                    >
                        Xem tất cả
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>

                {/* Loading State với option cancel/retry */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="flex items-center gap-3 text-purple-600 mb-4">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-lg font-medium">AI đang phân tích sở thích của bạn...</span>
                        </div>

                        {/* Hiển thị nút retry nếu loading quá lâu */}
                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-3">Quá trình này có thể mất vài giây...</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRetry}
                                className="border-purple-200 text-purple-600 hover:bg-purple-50"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Tải lại nếu quá lâu
                            </Button>
                        </div>
                    </div>
                )}

                {/* Products Grid */}
                {!loading && products.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} showAIScore={metadata?.method !== "fallback"} />
                        ))}
                    </div>
                )}

                {/* Empty State với nút retry */}
                {!loading && products.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {error ? "Không thể tải gợi ý" : "Chưa có gợi ý phù hợp"}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {error
                                ? "Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại."
                                : "Hãy tương tác với các sản phẩm để nhận được gợi ý tốt hơn!"}
                        </p>

                        {/* Nút retry */}
                        <div className="flex justify-center gap-3">
                            <Button
                                onClick={handleRetry}
                                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-full flex items-center gap-2 transition-all duration-300"
                                disabled={loading}
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                                {loading ? "Đang tải..." : "Tải lại"}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => (window.location.href = "/marketplace/products")}
                                className="border-purple-200 text-purple-600 hover:bg-purple-50 px-6 py-2 rounded-full"
                            >
                                Xem tất cả sản phẩm
                            </Button>
                        </div>

                        {retryCount > 0 && <p className="text-xs text-gray-500 mt-2">Đã thử lại {retryCount} lần</p>}
                    </div>
                )}

                {/* View More Button */}
                {!loading && products.length > 0 && (
                    <div className="flex justify-center mt-8">
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            onClick={handleViewAll}
                        >
                            Khám phá thêm gợi ý
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                )}

                {/* Pagination Info */}
                {pagination && pagination.total > 0 && (
                    <div className="text-center mt-4 text-sm text-gray-500">
                        Hiển thị {products.length} trong tổng số {pagination.total} gợi ý
                    </div>
                )}
            </div>
        </section>
    )
}

export default SuggestedProducts
