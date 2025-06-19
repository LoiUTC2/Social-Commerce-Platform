"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
    FiArrowLeft,
    FiCalendar,
    FiClock,
    FiImage,
    FiPlus,
    FiTrash2,
    FiSave,
    FiEdit3,
    FiVideo,
    FiShoppingBag,
} from "react-icons/fi"
import { createFlashSale, getFlashSaleDetails, updateFlashSale } from "../../../services/flashSaleService"
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary"
import ProductSelectionModal from "../../../components/modals/products/ProductSelectionModal"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import { Label } from "../../../components/ui/label"
import { Checkbox } from "../../../components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Badge } from "../../../components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../../components/ui/dialog"
import { Calendar } from "../../../components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "../../../lib/utils"

const FlashSaleForm = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const isEditMode = !!id
    const fileInputRef = useRef(null)
    const videoInputRef = useRef(null)

    const [loading, setLoading] = useState(isEditMode)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [showProductModal, setShowProductModal] = useState(false)
    const [showMediaEditor, setShowMediaEditor] = useState(false)
    const [selectedMedia, setSelectedMedia] = useState(null)
    const [mediaType, setMediaType] = useState("image") // "image" or "video"

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)),
        endTime: new Date(new Date().setHours(new Date().getHours() + 25)),
        banner: "",
        bannerType: "image", // "image" or "video"
        isFeatured: false,
        products: [],
    })

    useEffect(() => {
        if (isEditMode) {
            fetchFlashSaleDetails()
        }
    }, [id])

    const fetchFlashSaleDetails = async () => {
        try {
            const response = await getFlashSaleDetails(id)

            if (response.success) {
                const flashSale = response.data

                setFormData({
                    name: flashSale.name,
                    description: flashSale.description || "",
                    startTime: new Date(flashSale.startTime),
                    endTime: new Date(flashSale.endTime),
                    banner: flashSale.banner || "",
                    bannerType: flashSale.bannerType || "image",
                    isFeatured: flashSale.isFeatured || false,
                    products:
                        flashSale.saleProducts?.map((product) => ({
                            product: {
                                _id: product._id,
                                name: product.name,
                                price: product.price,
                                images: product.images,
                                stock: product.stock,
                                soldCount: product.soldCount,
                            },
                            salePrice: product.flashSale.salePrice,
                            stockLimit: product.flashSale.stockLimit,
                        })) || [],
                })
                toast.success("Đã tải thông tin Flash Sale")
            } else {
                toast.error("Không thể tải thông tin Flash Sale")
                navigate("/admin/flash-sales")
            }
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết Flash Sale:", error)
            toast.error("Có lỗi xảy ra khi tải dữ liệu")
            navigate("/admin/flash-sales")
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        })
    }

    const handleDateChange = (date, field) => {
        setFormData({
            ...formData,
            [field]: date,
        })
    }

    const handleFileUpload = async (file, type = "image") => {
        if (!file) return

        // Validate file type
        const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        const validVideoTypes = ["video/mp4", "video/webm", "video/ogg"]

        if (type === "image" && !validImageTypes.includes(file.type)) {
            toast.error("Chỉ hỗ trợ file ảnh: JPEG, PNG, GIF, WebP")
            return
        }

        if (type === "video" && !validVideoTypes.includes(file.type)) {
            toast.error("Chỉ hỗ trợ file video: MP4, WebM, OGG")
            return
        }

        // Validate file size (10MB for images, 50MB for videos)
        const maxSize = type === "image" ? 10 * 1024 * 1024 : 50 * 1024 * 1024
        if (file.size > maxSize) {
            toast.error(`File quá lớn. Tối đa ${type === "image" ? "10MB" : "50MB"}`)
            return
        }

        setUploading(true)
        try {
            console.log(`Starting upload of ${type}:`, file.name)

            const result = await uploadToCloudinary(file, {
                onProgress: (progress) => {
                    console.log(`Upload progress: ${progress}%`)
                },
            })

            console.log("Upload result:", result)

            if (result.success && result.secure_url) {
                setFormData({
                    ...formData,
                    banner: result.secure_url,
                    bannerType: type,
                })
                toast.success(`Upload ${type === "image" ? "ảnh" : "video"} thành công!`)
                console.log(`Successfully uploaded ${type}:`, result.secure_url)
            } else {
                throw new Error("Upload failed - no secure_url received")
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast.error(`Upload ${type === "image" ? "ảnh" : "video"} thất bại. Vui lòng thử lại.`)
        } finally {
            setUploading(false)
        }
    }

    const handleSelectProducts = (selectedProducts) => {
        const newProducts = selectedProducts.map((product) => ({
            product,
            salePrice: Math.round(product.price * 0.9),
            stockLimit: Math.min(50, product.stock),
        }))

        setFormData({
            ...formData,
            products: [...formData.products, ...newProducts],
        })
    }

    const handleRemoveProduct = (productId) => {
        setFormData({
            ...formData,
            products: formData.products.filter((p) => p.product._id !== productId),
        })
        toast.success("Đã xóa sản phẩm khỏi Flash Sale")
    }

    const handleProductFieldChange = (productId, field, value) => {
        setFormData({
            ...formData,
            products: formData.products.map((p) => (p.product._id === productId ? { ...p, [field]: Number(value) } : p)),
        })
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount)
    }

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast.error("Vui lòng nhập tên Flash Sale")
            return false
        }

        if (formData.startTime >= formData.endTime) {
            toast.error("Thời gian kết thúc phải sau thời gian bắt đầu")
            return false
        }

        if (formData.products.length === 0) {
            toast.error("Vui lòng thêm ít nhất một sản phẩm")
            return false
        }

        for (const item of formData.products) {
            if (item.salePrice <= 0 || item.salePrice >= item.product.price) {
                toast.error(`Giá khuyến mãi của "${item.product.name}" không hợp lệ`)
                return false
            }
            if (item.stockLimit <= 0) {
                toast.error(`Giới hạn số lượng của "${item.product.name}" phải lớn hơn 0`)
                return false
            }
        }

        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setSaving(true)

        try {
            const submitData = {
                ...formData,
                products: formData.products.map((p) => ({
                    product: p.product._id,
                    salePrice: p.salePrice,
                    stockLimit: p.stockLimit,
                })),
            }

            let response
            if (isEditMode) {
                response = await updateFlashSale(id, submitData)
                toast.success("Cập nhật Flash Sale thành công!")
            } else {
                response = await createFlashSale(submitData)
                toast.success("Tạo Flash Sale thành công!")
            }

            if (response.success) {
                navigate("/admin/flash-sales")
            } else {
                toast.error(response.message || "Có lỗi xảy ra")
            }
        } catch (error) {
            console.error("Lỗi khi lưu Flash Sale:", error)
            toast.error("Có lỗi xảy ra khi lưu Flash Sale")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
                <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
        )
    }

    const selectedProductIds = formData.products.map((p) => p.product._id)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button onClick={() => navigate("/admin/flash-sales")} variant="outline">
                        <FiArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isEditMode ? "Chỉnh sửa Flash Sale" : "Tạo Flash Sale mới"}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {isEditMode ? "Cập nhật thông tin Flash Sale" : "Tạo chương trình Flash Sale mới"}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Thông tin cơ bản</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Tên Flash Sale *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Nhập tên Flash Sale"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Mô tả</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Nhập mô tả cho Flash Sale"
                                        rows={4}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Thời gian bắt đầu *</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !formData.startTime && "text-muted-foreground",
                                                    )}
                                                >
                                                    <FiCalendar className="mr-2 h-4 w-4" />
                                                    {formData.startTime
                                                        ? format(formData.startTime, "dd/MM/yyyy HH:mm", { locale: vi })
                                                        : "Chọn ngày"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={formData.startTime}
                                                    onSelect={(date) => handleDateChange(date, "startTime")}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Thời gian kết thúc *</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !formData.endTime && "text-muted-foreground",
                                                    )}
                                                >
                                                    <FiClock className="mr-2 h-4 w-4" />
                                                    {formData.endTime
                                                        ? format(formData.endTime, "dd/MM/yyyy HH:mm", { locale: vi })
                                                        : "Chọn ngày"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={formData.endTime}
                                                    onSelect={(date) => handleDateChange(date, "endTime")}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="isFeatured"
                                        checked={formData.isFeatured}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                                    />
                                    <Label htmlFor="isFeatured">Đánh dấu là Flash Sale nổi bật</Label>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Media Upload */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FiImage className="w-5 h-5 text-pink-600" />
                                    Banner Flash Sale
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="flex-1"
                                    >
                                        <FiImage className="w-4 h-4 mr-2" />
                                        {uploading ? "Đang upload..." : "Upload Ảnh"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => videoInputRef.current?.click()}
                                        disabled={uploading}
                                        className="flex-1"
                                    >
                                        <FiVideo className="w-4 h-4 mr-2" />
                                        {uploading ? "Đang upload..." : "Upload Video"}
                                    </Button>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e.target.files[0], "image")}
                                    className="hidden"
                                />
                                <input
                                    ref={videoInputRef}
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => handleFileUpload(e.target.files[0], "video")}
                                    className="hidden"
                                />

                                {formData.banner && (
                                    <div className="relative">
                                        {formData.bannerType === "video" ? (
                                            <video src={formData.banner} className="w-full h-48 object-cover rounded-lg" controls muted />
                                        ) : (
                                            <img
                                                src={formData.banner || "/placeholder.svg"}
                                                alt="Banner preview"
                                                className="w-full h-48 object-cover rounded-lg"
                                            />
                                        )}
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="secondary">
                                                        <FiEdit3 className="w-4 h-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-4xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Chỉnh sửa {formData.bannerType === "video" ? "Video" : "Ảnh"}</DialogTitle>
                                                        <DialogDescription>
                                                            Xem trước và chỉnh sửa {formData.bannerType === "video" ? "video" : "ảnh"} banner
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        {formData.bannerType === "video" ? (
                                                            <video
                                                                src={formData.banner}
                                                                className="w-full max-h-96 object-contain rounded-lg"
                                                                controls
                                                            />
                                                        ) : (
                                                            <img
                                                                src={formData.banner || "/placeholder.svg"}
                                                                alt="Banner"
                                                                className="w-full max-h-96 object-contain rounded-lg"
                                                            />
                                                        )}
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => fileInputRef.current?.click()}
                                                                variant="outline"
                                                                className="flex-1"
                                                            >
                                                                <FiImage className="w-4 h-4 mr-2" />
                                                                Thay ảnh khác
                                                            </Button>
                                                            <Button
                                                                onClick={() => videoInputRef.current?.click()}
                                                                variant="outline"
                                                                className="flex-1"
                                                            >
                                                                <FiVideo className="w-4 h-4 mr-2" />
                                                                Thay video khác
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => setFormData({ ...formData, banner: "", bannerType: "image" })}
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <Badge className="absolute bottom-2 left-2 bg-black/50 text-white">
                                            {formData.bannerType === "video" ? "Video" : "Ảnh"}
                                        </Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Products */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Sản phẩm ({formData.products.length})</CardTitle>
                                    <Button
                                        type="button"
                                        onClick={() => setShowProductModal(true)}
                                        className="bg-pink-600 hover:bg-pink-700"
                                    >
                                        <FiPlus className="w-4 h-4 mr-2" />
                                        Thêm sản phẩm
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {formData.products.length === 0 ? (
                                    <div className="text-center py-8">
                                        <FiShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600 mb-4">Chưa có sản phẩm nào trong Flash Sale này.</p>
                                        <Button
                                            type="button"
                                            onClick={() => setShowProductModal(true)}
                                            className="bg-pink-600 hover:bg-pink-700"
                                        >
                                            <FiPlus className="w-4 h-4 mr-2" />
                                            Thêm sản phẩm
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Sản phẩm</TableHead>
                                                    <TableHead>Giá gốc</TableHead>
                                                    <TableHead>Giá Flash Sale</TableHead>
                                                    <TableHead>Giới hạn SL</TableHead>
                                                    <TableHead>Thao tác</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {formData.products.map((item) => (
                                                    <TableRow key={item.product._id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                {item.product.images && item.product.images[0] && (
                                                                    <img
                                                                        src={item.product.images[0] || "/placeholder.svg"}
                                                                        alt={item.product.name}
                                                                        className="w-12 h-12 rounded-lg object-cover"
                                                                    />
                                                                )}
                                                                <div>
                                                                    <p className="font-medium text-gray-900 line-clamp-1">{item.product.name}</p>
                                                                    <p className="text-sm text-gray-600">Kho: {item.product.stock}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-gray-600">{formatCurrency(item.product.price)}</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                value={item.salePrice}
                                                                onChange={(e) =>
                                                                    handleProductFieldChange(item.product._id, "salePrice", e.target.value)
                                                                }
                                                                min={1}
                                                                max={item.product.price - 1}
                                                                required
                                                                className="w-24"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                value={item.stockLimit}
                                                                onChange={(e) =>
                                                                    handleProductFieldChange(item.product._id, "stockLimit", e.target.value)
                                                                }
                                                                min={1}
                                                                max={item.product.stock}
                                                                required
                                                                className="w-20"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleRemoveProduct(item.product._id)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <FiTrash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Preview */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Xem trước</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="aspect-video bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
                                        {formData.banner ? (
                                            formData.bannerType === "video" ? (
                                                <video src={formData.banner} className="w-full h-full object-cover rounded-lg" muted />
                                            ) : (
                                                <img
                                                    src={formData.banner || "/placeholder.svg"}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            )
                                        ) : (
                                            <span>Banner Preview</span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-gray-900">{formData.name || "Tên Flash Sale"}</h3>
                                    <p className="text-sm text-gray-600">{formData.description || "Mô tả Flash Sale"}</p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{formData.products.length} sản phẩm</Badge>
                                        {formData.isFeatured && <Badge className="bg-pink-100 text-pink-800">Nổi bật</Badge>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Thao tác</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    type="submit"
                                    disabled={saving || formData.products.length === 0}
                                    className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                                >
                                    {saving ? (
                                        "Đang lưu..."
                                    ) : (
                                        <>
                                            <FiSave className="w-4 h-4 mr-2" />
                                            {isEditMode ? "Cập nhật" : "Tạo"} Flash Sale
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/admin/flash-sales")}
                                    className="w-full"
                                >
                                    Hủy
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>

            <ProductSelectionModal
                isOpen={showProductModal}
                onClose={() => setShowProductModal(false)}
                onSelectProducts={handleSelectProducts}
                selectedProductIds={selectedProductIds}
            />
        </div>
    )
}

export default FlashSaleForm