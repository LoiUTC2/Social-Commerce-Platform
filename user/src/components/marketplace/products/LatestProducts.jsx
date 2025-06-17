"use client"

import { Button } from "../../../components/ui/button"
import { ArrowRight, Clock, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import ProductCard from "../ProductCard"
import { useLatestProducts } from "../../../hooks/useProducts"

const LatestProducts = ({ timeRange = "all", limit = 12 }) => {
    const { products, loading, error, pagination } = useLatestProducts(limit, timeRange)

    const handleViewAll = () => {
        // Navigate to latest products page
        window.location.href = "/marketplace/latest-products"
    }

    const getTimeRangeText = (range) => {
        switch (range) {
            case "24h":
                return "trong 24h qua"
            case "7d":
                return "trong 7 ngày qua"
            case "30d":
                return "trong 30 ngày qua"
            case "90d":
                return "trong 90 ngày qua"
            default:
                return "mới nhất"
        }
    }

    if (error) {
        return (
            <section className="w-full py-8 bg-gradient-to-br from-gray-50 to-pink-50">
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
        <section className="w-full py-8 bg-gradient-to-br from-gray-50 to-pink-50">
            <div className="container mx-auto px-4">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">🆕 Sản phẩm mới nhất</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {loading ? "Đang tải..." : `Cập nhật những sản phẩm ${getTimeRangeText(timeRange)}`}
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="group border-green-200 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-300"
                        onClick={handleViewAll}
                        disabled={loading}
                    >
                        Xem tất cả
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-3 text-green-600">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-lg font-medium">Đang tải sản phẩm mới nhất...</span>
                        </div>
                    </div>
                )}

                {/* Products Grid */}
                {!loading && products.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} showNewBadge={true} />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && products.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <Clock className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Chưa có sản phẩm mới {getTimeRangeText(timeRange)}
                        </h3>
                        <p className="text-gray-600">Hãy quay lại sau để xem các sản phẩm mới nhất!</p>
                    </div>
                )}

                {/* View More Button */}
                {!loading && products.length > 0 && (
                    <div className="flex justify-center mt-8">
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            onClick={handleViewAll}
                        >
                            Xem thêm sản phẩm mới
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                )}

                {/* Pagination Info */}
                {pagination && pagination.total > 0 && (
                    <div className="text-center mt-4 text-sm text-gray-500">
                        Hiển thị {products.length} trong tổng số {pagination.total} sản phẩm
                    </div>
                )}
            </div>
        </section>
    )
}

export default LatestProducts
