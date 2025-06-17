"use client"

import { Button } from "../../components/ui/button"
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, RefreshCw, Filter, Grid, List } from "lucide-react"
import { Alert, AlertDescription } from "../../components/ui/alert"
import ProductCard from "./ProductCard"
import { useProductList } from "../../hooks/useProductList"
import { useState } from "react"

const ProductListPage = ({ type, title, description, icon: Icon, gradient }) => {
    const {
        products,
        loading,
        loadingMore,
        error,
        pagination,
        metadata,
        hasMore,
        isExpanded,
        loadMore,
        collapse,
        retry,
    } = useProductList(type, 18)
    const [viewMode, setViewMode] = useState("grid") // 'grid' or 'list'

    const handleGoBack = () => {
        window.history.back()
    }

    const getTypeText = () => {
        switch (type) {
            case "featured":
                return "nổi bật"
            case "suggested":
                return "gợi ý"
            case "latest":
                return "mới nhất"
            default:
                return ""
        }
    }

    if (error && products.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="outline" size="sm" onClick={handleGoBack} className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-10 h-10 ${gradient} rounded-full`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                                <p className="text-sm text-gray-600">{description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Error State */}
                    <Alert className="border-red-200 bg-red-50 mb-6">
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>

                    <div className="text-center py-12">
                        <Button
                            onClick={retry}
                            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full flex items-center gap-2 mx-auto"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Thử lại
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={handleGoBack} className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-10 h-10 ${gradient} rounded-full`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                                <p className="text-sm text-gray-600">
                                    {loading ? "Đang tải..." : `${products.length} sản phẩm ${getTypeText()}`}
                                </p>
                                {metadata?.method && (
                                    <p className="text-xs text-purple-600 mt-1">
                                        Phương pháp: {metadata.method} • AI: {metadata.aiRecommendationsCount || 0} gợi ý
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* View Controls */}
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Lọc
                        </Button>
                        <div className="flex border rounded-lg overflow-hidden">
                            <Button
                                variant={viewMode === "grid" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("grid")}
                                className="rounded-none"
                            >
                                <Grid className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("list")}
                                className="rounded-none"
                            >
                                <List className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && products.length === 0 && (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex items-center gap-3 text-pink-600">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-lg font-medium">Đang tải sản phẩm {getTypeText()}...</span>
                        </div>
                    </div>
                )}

                {/* Products Grid */}
                {products.length > 0 && (
                    <>
                        <div
                            className={`grid gap-4 mb-8 ${viewMode === "grid"
                                    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
                                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                                }`}
                        >
                            {products.map((product, index) => (
                                <ProductCard
                                    key={`${product._id}-${index}`}
                                    product={product}
                                    showAIScore={type === "suggested" && metadata?.method !== "fallback"}
                                    showNewBadge={type === "latest"}
                                    viewMode={viewMode}
                                />
                            ))}
                        </div>

                        {/* Load More / Collapse Controls */}
                        <div className="flex flex-col items-center gap-4">
                            {/* Progress Indicator */}
                            {pagination && pagination.total > 0 && (
                                <div className="text-center">
                                    <div className="text-sm text-gray-600 mb-2">
                                        Hiển thị {products.length} trong tổng số {pagination.total} sản phẩm
                                    </div>
                                    <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${gradient.replace("bg-gradient-to-r", "bg-gradient-to-r")}`}
                                            style={{ width: `${Math.min((products.length / pagination.total) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                                {hasMore && !isExpanded && (
                                    <Button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        size="lg"
                                        className={`${gradient} text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                                    >
                                        {loadingMore ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Đang tải...
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-5 h-5 mr-2" />
                                                Xem thêm 6 sản phẩm
                                            </>
                                        )}
                                    </Button>
                                )}

                                {hasMore && isExpanded && (
                                    <Button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        variant="outline"
                                        size="lg"
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-full"
                                    >
                                        {loadingMore ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Đang tải...
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-5 h-5 mr-2" />
                                                Xem thêm
                                            </>
                                        )}
                                    </Button>
                                )}

                                {isExpanded && products.length > 18 && (
                                    <Button
                                        onClick={collapse}
                                        variant="outline"
                                        size="lg"
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-full"
                                    >
                                        <ChevronUp className="w-5 h-5 mr-2" />
                                        Thu gọn
                                    </Button>
                                )}
                            </div>

                            {/* End of Results */}
                            {!hasMore && products.length > 0 && (
                                <div className="text-center py-6">
                                    <div className="text-gray-500 mb-2">🎉 Bạn đã xem hết tất cả sản phẩm!</div>
                                    {isExpanded && products.length > 18 && (
                                        <Button
                                            onClick={collapse}
                                            variant="outline"
                                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                        >
                                            <ChevronUp className="w-4 h-4 mr-2" />
                                            Thu gọn về đầu trang
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Empty State */}
                {!loading && products.length === 0 && (
                    <div className="text-center py-20">
                        <div className={`w-16 h-16 mx-auto mb-4 ${gradient} rounded-full flex items-center justify-center`}>
                            <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có sản phẩm {getTypeText()}</h3>
                        <p className="text-gray-600 mb-4">Hãy quay lại sau để xem các sản phẩm mới nhất!</p>
                        <Button onClick={retry} className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Tải lại
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProductListPage
