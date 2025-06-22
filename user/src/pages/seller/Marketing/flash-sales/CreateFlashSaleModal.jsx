"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../components/ui/dialog"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Textarea } from "../../../../components/ui/textarea"
import { Label } from "../../../../components/ui/label"
import { Switch } from "../../../../components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Badge } from "../../../../components/ui/badge"
import { Separator } from "../../../../components/ui/separator"
import { ImageUpload } from "../../../../components/common/ImageUploadBanner"
import { Plus, X, Search, Package, DollarSign, Hash, Calendar, Zap, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { createFlashSale } from "../../../../services/flashSaleService"
import { getProductsByShopForSeller } from "../../../../services/productService"
import { useAuth } from "../../../../contexts/AuthContext"

export default function CreateFlashSaleModal({ isOpen, onClose, onSuccess }) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedProducts, setSelectedProducts] = useState([])

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        hashtags: [],
        startTime: "",
        endTime: "",
        banner: "",
        isFeatured: false,
    })

    const [hashtagInput, setHashtagInput] = useState("")
    const [errors, setErrors] = useState({})

    // Fetch products when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchProducts()
            resetForm()
        }
    }, [isOpen])

    const fetchProducts = async () => {
        try {
            const response = await getProductsByShopForSeller(user._id, 1, 100, "newest", "active")
            if (response.success) {
                setProducts(response.data.products || [])
            }
        } catch (error) {
            console.error("Error fetching products:", error)
            toast.error("Không thể tải danh sách sản phẩm")
        }
    }

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            hashtags: [],
            startTime: "",
            endTime: "",
            banner: "",
            isFeatured: false,
        })
        setSelectedProducts([])
        setHashtagInput("")
        setSearchQuery("")
        setErrors({})
    }

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }))
        }
    }

    const handleAddHashtag = () => {
        if (hashtagInput.trim() && !formData.hashtags.includes(hashtagInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                hashtags: [...prev.hashtags, hashtagInput.trim()],
            }))
            setHashtagInput("")
        }
    }

    const handleRemoveHashtag = (hashtag) => {
        setFormData((prev) => ({
            ...prev,
            hashtags: prev.hashtags.filter((h) => h !== hashtag),
        }))
    }

    const handleProductSelect = (product) => {
        const isSelected = selectedProducts.find((p) => p.product === product._id)
        if (isSelected) {
            setSelectedProducts((prev) => prev.filter((p) => p.product !== product._id))
        } else {
            setSelectedProducts((prev) => [
                ...prev,
                {
                    product: product._id,
                    productInfo: product,
                    salePrice: product.price * 0.8, // Default 20% discount
                    stockLimit: Math.min(product.stock, 100), // Default limit
                },
            ])
        }
    }

    const handleProductUpdate = (productId, field, value) => {
        setSelectedProducts((prev) => prev.map((p) => (p.product === productId ? { ...p, [field]: value } : p)))
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.name.trim()) newErrors.name = "Tên Flash Sale là bắt buộc"
        if (!formData.startTime) newErrors.startTime = "Thời gian bắt đầu là bắt buộc"
        if (!formData.endTime) newErrors.endTime = "Thời gian kết thúc là bắt buộc"
        if (selectedProducts.length === 0) newErrors.products = "Phải chọn ít nhất 1 sản phẩm"

        if (formData.startTime && formData.endTime) {
            const start = new Date(formData.startTime)
            const end = new Date(formData.endTime)
            const now = new Date()

            if (start <= now) newErrors.startTime = "Thời gian bắt đầu phải sau thời điểm hiện tại"
            if (end <= start) newErrors.endTime = "Thời gian kết thúc phải sau thời gian bắt đầu"
        }

        // Validate selected products
        selectedProducts.forEach((product, index) => {
            if (product.salePrice <= 0) {
                newErrors[`salePrice_${index}`] = "Giá sale phải lớn hơn 0"
            }
            if (product.salePrice >= product.productInfo.price) {
                newErrors[`salePrice_${index}`] = "Giá sale phải nhỏ hơn giá gốc"
            }
            if (product.stockLimit <= 0) {
                newErrors[`stockLimit_${index}`] = "Số lượng giới hạn phải lớn hơn 0"
            }
            if (product.stockLimit > product.productInfo.stock) {
                newErrors[`stockLimit_${index}`] = "Số lượng giới hạn không được vượt quá tồn kho"
            }
        })

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error("Vui lòng kiểm tra lại thông tin")
            return
        }

        setLoading(true)
        try {
            const submitData = {
                ...formData,
                products: selectedProducts.map((p) => ({
                    product: p.product,
                    salePrice: p.salePrice,
                    stockLimit: p.stockLimit,
                })),
            }

            const response = await createFlashSale(submitData)

            if (response.success) {
                toast.success("Tạo Flash Sale thành công!")
                onSuccess()
            } else {
                throw new Error(response.message || "Tạo Flash Sale thất bại")
            }
        } catch (error) {
            toast.error("Lỗi", { description: error.message || "Tạo Flash Sale thất bại" })
        } finally {
            setLoading(false)
        }
    }

    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) && product.isActive && product.stock > 0,
    )

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-pink-500" />
                        Tạo Flash Sale mới
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Tên Flash Sale *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                        placeholder="Nhập tên Flash Sale..."
                                        className={errors.name ? "border-red-500" : ""}
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Switch
                                            checked={formData.isFeatured}
                                            onCheckedChange={(checked) => handleInputChange("isFeatured", checked)}
                                        />
                                        Flash Sale nổi bật
                                    </Label>
                                    <p className="text-sm text-gray-500">Flash Sale nổi bật sẽ được ưu tiên hiển thị</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Mô tả</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                    placeholder="Mô tả về Flash Sale..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Banner Flash Sale</Label>
                                <ImageUpload
                                    value={formData.banner}
                                    onChange={(url) => handleInputChange("banner", url)}
                                    label="Tải banner lên"
                                    aspectRatio="landscape"
                                    previewSize="large"
                                    maxSize={5}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Hashtags</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={hashtagInput}
                                        onChange={(e) => setHashtagInput(e.target.value)}
                                        placeholder="Nhập hashtag..."
                                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddHashtag())}
                                    />
                                    <Button type="button" onClick={handleAddHashtag} variant="outline">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                {formData.hashtags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.hashtags.map((hashtag, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                                <Hash className="w-3 h-3" />
                                                {hashtag}
                                                <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveHashtag(hashtag)} />
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Time Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Thời gian diễn ra
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startTime">Thời gian bắt đầu *</Label>
                                    <Input
                                        id="startTime"
                                        type="datetime-local"
                                        value={formData.startTime}
                                        onChange={(e) => handleInputChange("startTime", e.target.value)}
                                        className={errors.startTime ? "border-red-500" : ""}
                                    />
                                    {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="endTime">Thời gian kết thúc *</Label>
                                    <Input
                                        id="endTime"
                                        type="datetime-local"
                                        value={formData.endTime}
                                        onChange={(e) => handleInputChange("endTime", e.target.value)}
                                        className={errors.endTime ? "border-red-500" : ""}
                                    />
                                    {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Product Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Chọn sản phẩm ({selectedProducts.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {errors.products && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                    <p className="text-sm text-red-600">{errors.products}</p>
                                </div>
                            )}

                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm kiếm sản phẩm..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto border rounded-lg">
                                {filteredProducts.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">Không tìm thấy sản phẩm phù hợp</div>
                                ) : (
                                    <div className="divide-y">
                                        {filteredProducts.map((product) => {
                                            const isSelected = selectedProducts.find((p) => p.product === product._id)
                                            return (
                                                <div
                                                    key={product._id}
                                                    className={`p-3 cursor-pointer hover:bg-gray-50 ${isSelected ? "bg-pink-50 border-l-4 border-pink-500" : ""}`}
                                                    onClick={() => handleProductSelect(product)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={product.images?.[0] || "/placeholder.svg?height=50&width=50"}
                                                            alt={product.name}
                                                            className="w-12 h-12 object-cover rounded"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="font-medium">{product.name}</div>
                                                            <div className="text-sm text-gray-500">
                                                                Giá: {formatCurrency(product.price)} | Tồn kho: {product.stock}
                                                            </div>
                                                        </div>
                                                        {isSelected && <CheckCircle className="w-5 h-5 text-pink-500" />}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selected Products Configuration */}
                    {selectedProducts.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <DollarSign className="w-5 h-5" />
                                    Cấu hình sản phẩm đã chọn
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {selectedProducts.map((selectedProduct, index) => (
                                    <div key={selectedProduct.product} className="border rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <img
                                                src={selectedProduct.productInfo.images?.[0] || "/placeholder.svg?height=40&width=40"}
                                                alt={selectedProduct.productInfo.name}
                                                className="w-10 h-10 object-cover rounded"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">{selectedProduct.productInfo.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    Giá gốc: {formatCurrency(selectedProduct.productInfo.price)}
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleProductSelect(selectedProduct.productInfo)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Giá Flash Sale *</Label>
                                                <Input
                                                    type="number"
                                                    value={selectedProduct.salePrice}
                                                    onChange={(e) =>
                                                        handleProductUpdate(
                                                            selectedProduct.product,
                                                            "salePrice",
                                                            Number.parseFloat(e.target.value) || 0,
                                                        )
                                                    }
                                                    placeholder="Nhập giá sale..."
                                                    className={errors[`salePrice_${index}`] ? "border-red-500" : ""}
                                                />
                                                {errors[`salePrice_${index}`] && (
                                                    <p className="text-sm text-red-500">{errors[`salePrice_${index}`]}</p>
                                                )}
                                                <div className="text-sm text-gray-500">
                                                    Giảm giá:{" "}
                                                    {(
                                                        ((selectedProduct.productInfo.price - selectedProduct.salePrice) /
                                                            selectedProduct.productInfo.price) *
                                                        100
                                                    ).toFixed(1)}
                                                    %
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Số lượng giới hạn *</Label>
                                                <Input
                                                    type="number"
                                                    value={selectedProduct.stockLimit}
                                                    onChange={(e) =>
                                                        handleProductUpdate(
                                                            selectedProduct.product,
                                                            "stockLimit",
                                                            Number.parseInt(e.target.value) || 0,
                                                        )
                                                    }
                                                    placeholder="Nhập số lượng..."
                                                    max={selectedProduct.productInfo.stock}
                                                    className={errors[`stockLimit_${index}`] ? "border-red-500" : ""}
                                                />
                                                {errors[`stockLimit_${index}`] && (
                                                    <p className="text-sm text-red-500">{errors[`stockLimit_${index}`]}</p>
                                                )}
                                                <div className="text-sm text-gray-500">
                                                    Tồn kho hiện tại: {selectedProduct.productInfo.stock}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    <Separator />

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button type="submit" className="bg-pink-500 hover:bg-pink-600" disabled={loading}>
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Đang tạo...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Tạo Flash Sale
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
