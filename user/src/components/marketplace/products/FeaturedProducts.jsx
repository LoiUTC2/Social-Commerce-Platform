import { Button } from "../../../components/ui/button"
import { ArrowRight, Star, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { useFeaturedProducts } from "../../../hooks/useProducts"
import ProductCard from "../ProductCard"

const FeaturedProducts = ({ category = null, limit = 12 }) => {
    const { products, loading, error, pagination } = useFeaturedProducts(limit, category)

    const handleViewAll = () => {
        // Navigate to featured products page
        window.location.href = "/marketplace/featured-products"
    }

    if (error) {
        return (
            <section className="w-full py-8 bg-gradient-to-br from-pink-50 to-white">
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
        <section className="w-full py-8 bg-gradient-to-br from-pink-50 to-white">
            <div className="container mx-auto px-4">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full">
                            <Star className="w-5 h-5 text-white fill-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">🌟 Sản phẩm nổi bật</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {loading ? "Đang tải..." : `${products.length} sản phẩm được yêu thích nhất`}
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="group border-pink-200 text-pink-600 hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-all duration-300"
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
                        <div className="flex items-center gap-3 text-pink-600">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-lg font-medium">Đang tải sản phẩm nổi bật...</span>
                        </div>
                    </div>
                )}

                {/* Products Grid */}
                {!loading && products.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && products.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <Star className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có sản phẩm nổi bật</h3>
                        <p className="text-gray-600">Hãy quay lại sau để xem các sản phẩm mới nhất!</p>
                    </div>
                )}

                {/* View More Button */}
                {!loading && products.length > 0 && (
                    <div className="flex justify-center mt-8">
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            onClick={handleViewAll}
                        >
                            Xem thêm sản phẩm nổi bật
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

export default FeaturedProducts
