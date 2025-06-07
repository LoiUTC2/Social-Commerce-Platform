"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import {
    Package,
    ArrowLeft,
    Edit,
    CheckCircle,
    XCircle,
    Copy,
    Hash,
    Users,
    UserCheck,
    UserX,
    Tag,
    Calendar,
    ShoppingCart,
    Star,
    Eye,
} from "lucide-react"
import { toast } from "sonner"
import { getProductDetailForSeller } from "../../../services/productService"
import { getCategoryTree } from "../../../services/categoryService"

// Hàm hiển thị hashtag đẹp cho người dùng
const displayHashtag = (hashtag) => {
    return `#${hashtag}`
}

export default function ProductDetail() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const [product, setProduct] = useState(null)
    const [categoryPath, setCategoryPath] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Lấy danh mục từ API
    const fetchCategories = async () => {
        try {
            const response = await getCategoryTree()
            console.log("Categories fetched:", response.data.tree)
            return response.data.tree || []
        } catch (error) {
            toast.error("Lỗi", { description: "Không thể tải danh mục. Vui lòng thử lại." })
            console.error("Lỗi khi lấy danh mục:", error)
            throw error
        }
    }

    // Tìm đường dẫn danh mục dựa trên _id
    const findCategoryPath = (categoryId, categories) => {
        // Kiểm tra categories có phải là mảng
        if (!Array.isArray(categories)) {
            console.error("Categories is not an array:", categories)
            return "Không xác định"
        }

        for (const cat of categories) {
            // Kiểm tra danh mục cấp 1
            if (cat._id === categoryId) {
                return cat.name
            }

            // Kiểm tra children của cấp 1
            if (Array.isArray(cat.children)) {
                for (const child of cat.children) {
                    // Kiểm tra danh mục cấp 2
                    if (child._id === categoryId) {
                        return `${cat.name} > ${child.name}`
                    }

                    // Kiểm tra children của cấp 2
                    if (Array.isArray(child.children)) {
                        for (const grandchild of child.children) {
                            // Kiểm tra danh mục cấp 3
                            if (grandchild._id === categoryId) {
                                const path = `${cat.name} > ${child.name} > ${grandchild.name}`
                                console.log("Product PATH maincategory:", path)
                                return path
                            }
                        }
                    } else {
                        console.warn(`Child "${child.name}" has invalid children:`, child.children)
                    }
                }
            } else {
                console.warn(`Category "${cat.name}" has invalid children:`, cat.children)
            }
        }

        console.warn(`Category ID "${categoryId}" not found in categories`)
        return "Không xác định"
    }

    // Lấy dữ liệu sản phẩm và danh mục
    const fetchProductDetail = async () => {
        setLoading(true)
        setError(null)
        try {
            const categories = await fetchCategories()
            const response = await getProductDetailForSeller(slug)
            const productData = response.data.product
            const productDataStats = response.data.stats

            console.log("Product data:", productData)
            console.log("Product variants:", productData.variants)
            console.log("Product maincategoryID:", productData.mainCategory._id)
            console.log("Product maincategory:", productData.mainCategory)

            // Đảm bảo variants luôn là mảng
            setProduct({ ...productData, variants: productData.variants || [] })
            // Tìm đường dẫn danh mục dựa trên mainCategory
            if (productData.mainCategory && productData.mainCategory._id) {
                const path = findCategoryPath(productData.mainCategory._id, categories)
                setCategoryPath(path)
            }
        } catch (error) {
            setError("Không thể lấy thông tin sản phẩm hoặc danh mục.")
            toast.error("Lỗi", { description: "Không thể lấy thông tin sản phẩm. Vui lòng thử lại sau." })
            console.error("Lỗi khi lấy chi tiết sản phẩm:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProductDetail()
    }, [slug])

    const handleGoBack = () => {
        navigate("/seller/products")
    }

    const handleEdit = () => {
        navigate(`/seller/edit-product/${slug}`)
    }

    // Hàm copy text với toast thông báo
    const copyToClipboard = (text, message) => {
        navigator.clipboard.writeText(text || "N/A")
        toast.success(message)
    }

    if (loading) {
        return (
            <div className="container mx-auto py-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p>Đang tải...</p>
                </div>
            </div>
        )
    }

    if (error || !product) {
        return (
            <div className="container mx-auto py-6 text-center">
                <div className="text-red-500 mb-4">
                    <XCircle className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-lg">{error || "Không tìm thấy sản phẩm."}</p>
                </div>
                <Button onClick={handleGoBack} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại danh sách
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handleGoBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Package className="w-6 h-6" /> Chi tiết sản phẩm
                    </h1>
                </div>

                <Button onClick={handleEdit} className="bg-pink-500 hover:bg-pink-600">
                    <Edit className="h-4 w-4 mr-2" /> Chỉnh sửa sản phẩm
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Thông tin cơ bản */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Thông tin sản phẩm</CardTitle>
                        <CardDescription>Chi tiết về sản phẩm của bạn</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Tên sản phẩm và thương hiệu */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                    <Package className="h-4 w-4" />
                                    Tên sản phẩm
                                </p>
                                <div className="max-w-full break-words" title={product.name}>
                                    <p className="text-base font-medium">{product.name}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                    <Tag className="h-4 w-4" />
                                    Thương hiệu
                                </p>
                                <div className="max-w-full break-words">
                                    <p className="text-base">{product.brand || "Không có"}</p>
                                </div>
                            </div>
                        </div>

                        {/* SKU và số lượng đã bán */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                    <Copy className="h-4 w-4" />
                                    Mã SKU
                                </p>
                                <div className="flex items-center gap-2 max-w-full break-words">
                                    <p className="text-base font-mono bg-gray-100 px-2 py-1 rounded">{product.sku || "N/A"}</p>
                                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(product.sku, "Đã sao chép mã SKU!")}>
                                        <Copy className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                    <ShoppingCart className="h-4 w-4" />
                                    Số lượng đã bán
                                </p>
                                <p className="text-base font-semibold text-green-600">{product.soldCount || 0}</p>
                            </div>
                        </div>

                        {/* Mô tả sản phẩm */}
                        <div>
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                <Eye className="h-4 w-4" />
                                Mô tả sản phẩm
                            </p>
                            <div className="max-w-full break-words max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-md">
                                <p className="text-base whitespace-pre-wrap">{product.description}</p>
                            </div>
                        </div>

                        {/* Giá, giảm giá và tồn kho */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-2">Giá bán</p>
                                <p className="text-lg font-bold text-pink-600">
                                    {typeof product.price === "number"
                                        ? `${product.price.toLocaleString("vi-VN")} VNĐ`
                                        : "Không xác định"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-2">Giảm giá</p>
                                <p className="text-base">
                                    {typeof product.discount === "number" && product.discount > 0 ? (
                                        <Badge variant="destructive">{product.discount}%</Badge>
                                    ) : (
                                        "Không có"
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-2">Số lượng tồn kho</p>
                                <p className="text-base font-semibold">
                                    {typeof product.stock === "number" ? (
                                        <span className={product.stock > 0 ? "text-green-600" : "text-red-600"}>{product.stock}</span>
                                    ) : (
                                        "Không xác định"
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Danh mục, tình trạng và trạng thái */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-2">Danh mục</p>
                                <Badge variant="outline" className="text-xs">
                                    {categoryPath}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-2">Tình trạng</p>
                                <Badge variant={product.condition === "new" ? "default" : "secondary"}>
                                    {product.condition === "new" ? "Mới" : "Đã sử dụng"}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-2">Trạng thái</p>
                                {product.isActive ? (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                        <CheckCircle className="w-3 h-3 mr-1" /> Đang bán
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-gray-500">
                                        <XCircle className="w-3 h-3 mr-1" /> Ngừng bán
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Thêm hiển thị trường allowPosts */}
                        <div>
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4" />
                                Cho phép đăng bài viết kèm sản phẩm
                            </p>
                            <div className="flex items-center gap-2">
                                {product.allowPosts !== undefined ? (
                                    product.allowPosts ? (
                                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                            <UserCheck className="w-3 h-3 mr-1" /> Cho phép
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-gray-500">
                                            <UserX className="w-3 h-3 mr-1" /> Không cho phép
                                        </Badge>
                                    )
                                ) : (
                                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                        <UserCheck className="w-3 h-3 mr-1" /> Cho phép (mặc định)
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {product.allowPosts !== false
                                    ? "Người dùng khác có thể tạo bài viết và gắn thẻ sản phẩm này"
                                    : "Sản phẩm này không cho phép người dùng khác đăng bài viết kèm theo"}
                            </p>
                        </div>

                        {/* Cải thiện hiển thị hashtags */}
                        <div>
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                <Hash className="h-4 w-4" />
                                Thẻ (hashtags)
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {product.hashtags && product.hashtags.length > 0 ? (
                                    product.hashtags.map((tag, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                                            onClick={() => copyToClipboard(tag, `Đã sao chép hashtag: ${displayHashtag(tag)}`)}
                                        >
                                            {displayHashtag(tag)}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-base text-gray-500">Không có hashtag</p>
                                )}
                            </div>
                            {product.hashtags && product.hashtags.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">Nhấp vào hashtag để sao chép</p>
                            )}
                        </div>

                        {/* Slug */}
                        <div>
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                <Copy className="h-4 w-4" />
                                Slug
                            </p>
                            <div className="flex items-center gap-2 max-w-full break-words">
                                <p className="text-base font-mono bg-gray-100 px-2 py-1 rounded flex-1">{product.slug || "N/A"}</p>
                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(product.slug, "Đã sao chép slug!")}>
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>

                        {/* Ngày tạo và cập nhật */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                    <Calendar className="h-4 w-4" />
                                    Ngày tạo
                                </p>
                                <p className="text-base">
                                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString("vi-VN") : "Không xác định"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                    <Calendar className="h-4 w-4" />
                                    Ngày cập nhật
                                </p>
                                <p className="text-base">
                                    {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString("vi-VN") : "Không xác định"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Media và Biến thể */}
                <div className="col-span-1 space-y-6">
                    {/* Ảnh/Video sản phẩm */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hình ảnh/Video sản phẩm</CardTitle>
                            <CardDescription>Hình ảnh và video của sản phẩm</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {product.images?.length > 0 || product.videos?.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {product.images?.map((image, index) => (
                                        <div key={`image-${index}`} className="relative group">
                                            <img
                                                src={image || "/placeholder.svg"}
                                                alt={`Product image ${index}`}
                                                className="h-24 w-full object-cover rounded-md border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => window.open(image, "_blank")}
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-md flex items-center justify-center">
                                                <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5" />
                                            </div>
                                        </div>
                                    ))}
                                    {product.videos?.map((video, index) => (
                                        <div key={`video-${index}`} className="relative">
                                            <video
                                                src={video}
                                                controls
                                                className="h-24 w-full object-cover rounded-md border border-gray-200"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>Không có hình ảnh hoặc video.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Biến thể sản phẩm */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Biến thể sản phẩm</CardTitle>
                            <CardDescription>Các biến thể của sản phẩm</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {!Array.isArray(product.variants) || product.variants.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>Không có biến thể nào.</p>
                                </div>
                            ) : (
                                product.variants.map((variant, index) => (
                                    <div key={index} className="border rounded-md p-4 space-y-3 bg-gray-50">
                                        <p className="font-medium text-gray-800 flex items-center gap-2">
                                            <Tag className="h-4 w-4" />
                                            {variant.name || "Không xác định"}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {Array.isArray(variant.options) && variant.options.length > 0 ? (
                                                variant.options.map((option, optIndex) => (
                                                    <Badge key={optIndex} variant="outline" className="bg-white">
                                                        {option}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500">Không có tùy chọn</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
