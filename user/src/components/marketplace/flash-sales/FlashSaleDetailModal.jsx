"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Skeleton } from "../../ui/skeleton"
import { ShoppingCart } from "lucide-react"
import { useNavigate } from "react-router-dom"
import ProductCard from "../ProductCard"

const FlashSaleDetailModal = ({ flashSale, open, onOpenChange, loading }) => {
    const navigate = useNavigate()

    const handleProductClick = (productSlug) => {
        navigate(`/marketplace/products/${productSlug}`)
        onOpenChange(false)
    }

    if (!flashSale && !loading) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                        {loading ? "Đang tải..." : flashSale?.name}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <FlashSaleDetailSkeleton />
                ) : (
                    <div className="space-y-6">
                        {/* Flash Sale Info */}
                        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-pink-600">{flashSale.enrichedProducts?.length || 0}</div>
                                    <div className="text-gray-600">Sản phẩm</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{flashSale.summary?.totalSold || 0}</div>
                                    <div className="text-gray-600">Đã bán</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">{flashSale.summary?.avgDiscountPercent || 0}%</div>
                                    <div className="text-gray-600">Giảm giá TB</div>
                                </div>
                            </div>

                            {flashSale.description && <p className="text-gray-700 mt-4 text-center">{flashSale.description}</p>}
                        </div>

                        {/* Products Grid */}
                        <div>
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-pink-600" />
                                Sản phẩm Flash Sale
                            </h3>

                            {flashSale.enrichedProducts && flashSale.enrichedProducts.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {flashSale.enrichedProducts.map((product) => (
                                        <div key={product._id} onClick={() => handleProductClick(product.slug)}>
                                            <ProductCard product={product} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 mb-2">
                                        <ShoppingCart className="w-12 h-12 mx-auto" />
                                    </div>
                                    <p className="text-gray-500">Không có sản phẩm nào trong Flash Sale này</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

// Loading skeleton for modal content
const FlashSaleDetailSkeleton = () => (
    <div className="space-y-4">
        {/* Info skeleton */}
        <div className="bg-gray-50 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="text-center">
                        <Skeleton className="h-8 w-16 mx-auto mb-2" />
                        <Skeleton className="h-4 w-20 mx-auto" />
                    </div>
                ))}
            </div>
            <Skeleton className="h-4 w-3/4 mx-auto mt-4" />
        </div>

        {/* Products grid skeleton */}
        <div>
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-6 w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    </div>
)

export default FlashSaleDetailModal
