"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
    FiArrowLeft,
    FiEdit3,
    FiTrash2,
    FiPower,
    FiExternalLink,
    FiStar,
    FiPackage,
    FiCalendar,
    FiTag,
    FiImage,
    FiVideo,
} from "react-icons/fi"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import { Progress } from "../../../components/ui/progress"
import { Dialog, DialogContent, DialogTrigger } from "../../../components/ui/dialog"
import { toast } from "sonner"
import { cn } from "../../../lib/utils"
import { getProductDetails, deactivateProduct, deleteProduct } from "../../../services/productService"

const ProductDetail = () => {
    const { productId } = useParams()
    const navigate = useNavigate()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState(0)

    // Fetch product details
    const fetchProductDetails = async () => {
        try {
            setLoading(true)
            const response = await getProductDetails(productId)

            if (response.success) {
                setProduct(response.data)
            }
        } catch (error) {
            toast.error("Lỗi khi tải chi tiết sản phẩm")
            console.error("Error fetching product details:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (productId) {
            fetchProductDetails()
        }
    }, [productId])

    // Handle product actions
    const handleProductAction = async (action) => {
        try {
            let response
            switch (action) {
                case "deactivate":
                    response = await deactivateProduct(productId)
                    break
                case "delete":
                    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
                        response = await deleteProduct(productId)
                        navigate("/admin/products")
                        return
                    }
                    break
                default:
                    return
            }

            if (response?.success) {
                toast.success(response.message)
                fetchProductDetails()
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra")
        }
    }

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount)
    }

    // Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    // Get stock status
    const getStockStatus = (stock) => {
        if (stock === 0) return { label: "Hết hàng", color: "destructive" }
        if (stock < 10) return { label: "Sắp hết", color: "warning" }
        return { label: "Còn hàng", color: "success" }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-64"></div>
                    <div className="flex gap-2">
                        <div className="h-10 bg-gray-200 rounded animate-pulse w-24"></div>
                        <div className="h-10 bg-gray-200 rounded animate-pulse w-24"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-6">
                        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <FiPackage className="w-16 h-16 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy sản phẩm</h2>
                <p className="text-gray-600 mb-4">Sản phẩm có thể đã bị xóa hoặc không tồn tại</p>
                <Button onClick={() => navigate("/admin/products")}>
                    <FiArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại danh sách
                </Button>
            </div>
        )
    }

    const stockStatus = getStockStatus(product.stock)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={() => navigate("/admin/products")}>
                        <FiArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                        <p className="text-gray-600">SKU: {product.sku}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigate(`/admin/products/${productId}/edit`)}>
                        <FiEdit3 className="w-4 h-4 mr-2" />
                        Chỉnh sửa
                    </Button>
                    <Button variant="outline" onClick={() => handleProductAction("deactivate")}>
                        <FiPower className="w-4 h-4 mr-2" />
                        {product.isActive ? "Ngừng bán" : "Kích hoạt"}
                    </Button>
                    <Button variant="destructive" onClick={() => handleProductAction("delete")}>
                        <FiTrash2 className="w-4 h-4 mr-2" />
                        Xóa
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Product Images */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {/* Main Image */}
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                    {product.images && product.images.length > 0 ? (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <img
                                                    src={product.images[selectedImage] || "/placeholder.svg"}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                />
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl">
                                                <img
                                                    src={product.images[selectedImage] || "/placeholder.svg"}
                                                    alt={product.name}
                                                    className="w-full h-auto"
                                                />
                                            </DialogContent>
                                        </Dialog>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FiImage className="w-16 h-16 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Thumbnail Images */}
                                {product.images && product.images.length > 1 && (
                                    <div className="flex space-x-2 overflow-x-auto">
                                        {product.images.map((image, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedImage(index)}
                                                className={cn(
                                                    "flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors",
                                                    selectedImage === index ? "border-pink-500" : "border-gray-200",
                                                )}
                                            >
                                                <img
                                                    src={image || "/placeholder.svg"}
                                                    alt={`${product.name} ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Videos */}
                                {product.videos && product.videos.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium flex items-center">
                                            <FiVideo className="w-4 h-4 mr-2" />
                                            Video sản phẩm
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {product.videos.map((video, index) => (
                                                <video
                                                    key={index}
                                                    controls
                                                    className="w-full rounded-lg"
                                                    poster="/placeholder.svg?height=200&width=300"
                                                >
                                                    <source src={video} type="video/mp4" />
                                                    Trình duyệt không hỗ trợ video
                                                </video>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Product Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin chi tiết</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">Mô tả sản phẩm</h4>
                                <div className="text-gray-700 whitespace-pre-wrap">{product.description}</div>
                            </div>

                            {product.variants && product.variants.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-2">Biến thể</h4>
                                    <div className="space-y-2">
                                        {product.variants.map((variant, index) => (
                                            <div key={index} className="flex items-center space-x-4">
                                                <span className="font-medium">{variant.name}:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {variant.options.map((option, optionIndex) => (
                                                        <Badge key={optionIndex} variant="outline">
                                                            {option}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {product.hashtags && product.hashtags.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-2">Hashtags</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {product.hashtags.map((tag, index) => (
                                            <Badge key={index} variant="secondary">
                                                <FiTag className="w-3 h-3 mr-1" />
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin cơ bản</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Trạng thái:</span>
                                <Badge variant={product.isActive ? "success" : "secondary"}>
                                    {product.isActive ? "Đang bán" : "Ngừng bán"}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Giá bán:</span>
                                <div className="text-right">
                                    <div className="font-bold text-lg">{formatCurrency(product.price)}</div>
                                    {product.discount > 0 && <div className="text-sm text-green-600">Giảm {product.discount}%</div>}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Tồn kho:</span>
                                <div className="text-right">
                                    <div className="font-medium">{product.stock}</div>
                                    <Badge variant={stockStatus.color} className="text-xs">
                                        {stockStatus.label}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Đã bán:</span>
                                <span className="font-medium">{product.soldCount || 0}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Thương hiệu:</span>
                                <span className="font-medium">{product.brand || "Không có"}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Tình trạng:</span>
                                <Badge variant="outline">{product.condition === "new" ? "Mới" : "Đã sử dụng"}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shop Info */}
                    {product.seller && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Thông tin Shop</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={product.seller.avatar || "/placeholder.svg"} />
                                        <AvatarFallback>{product.seller.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{product.seller.name}</div>
                                        <div className="text-sm text-gray-600">{product.seller.email}</div>
                                    </div>
                                </div>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link to={`/admin/shops/${product.seller._id}`}>
                                        <FiExternalLink className="w-4 h-4 mr-2" />
                                        Xem shop
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Rating Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Đánh giá & Nhận xét</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold">{product.ratings?.avg?.toFixed(1) || "0.0"}</div>
                                <div className="flex items-center justify-center space-x-1 mt-1">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <FiStar
                                            key={index}
                                            className={cn(
                                                "w-4 h-4",
                                                index < Math.floor(product.ratings?.avg || 0)
                                                    ? "text-yellow-400 fill-current"
                                                    : "text-gray-300",
                                            )}
                                        />
                                    ))}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">{product.ratings?.count || 0} đánh giá</div>
                            </div>

                            {product.reviewStats && (
                                <div className="space-y-2">
                                    {Object.entries(product.reviewStats.ratingDistribution || {}).map(([star, count]) => (
                                        <div key={star} className="flex items-center space-x-2">
                                            <span className="text-sm w-8">
                                                {star === "five"
                                                    ? "5"
                                                    : star === "four"
                                                        ? "4"
                                                        : star === "three"
                                                            ? "3"
                                                            : star === "two"
                                                                ? "2"
                                                                : "1"}
                                                ★
                                            </span>
                                            <Progress
                                                value={
                                                    product.reviewStats.totalReviews > 0 ? (count / product.reviewStats.totalReviews) * 100 : 0
                                                }
                                                className="flex-1 h-2"
                                            />
                                            <span className="text-sm text-gray-600 w-8">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timestamps */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thời gian</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <FiCalendar className="w-4 h-4 text-gray-500" />
                                <div>
                                    <div className="text-sm font-medium">Ngày tạo</div>
                                    <div className="text-sm text-gray-600">{formatDate(product.createdAt)}</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <FiCalendar className="w-4 h-4 text-gray-500" />
                                <div>
                                    <div className="text-sm font-medium">Cập nhật cuối</div>
                                    <div className="text-sm text-gray-600">{formatDate(product.updatedAt)}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default ProductDetail
