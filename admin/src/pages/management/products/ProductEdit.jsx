"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { FiArrowLeft, FiSave, FiX, FiUpload, FiTrash2, FiPlus, FiMinus, FiEye, FiEyeOff } from "react-icons/fi"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Switch } from "../../../components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Dialog, DialogContent, DialogTrigger } from "../../../components/ui/dialog"
import { Progress } from "../../../components/ui/progress"
import { toast } from "sonner"
import { cn } from "../../../lib/utils"
import { getProductDetails, updateProduct } from "../../../services/productService"
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary"
import FormDataDebug from "../../../components/debug/FormDataDebug"

const ProductEdit = () => {
    const { productId } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadProgress, setUploadProgress] = useState({})

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        discount: "",
        stock: "",
        brand: "",
        condition: "new",
        isActive: true,
        allowPosts: true,
        images: [],
        videos: [],
        variants: [],
        hashtags: [],
    })

    // Form validation errors
    const [errors, setErrors] = useState({})

    // UI states
    const [previewMode, setPreviewMode] = useState(false)
    const [newVariant, setNewVariant] = useState({ name: "", options: [""] })
    const [newHashtag, setNewHashtag] = useState("")

    // Fetch product details
    const fetchProductDetails = async () => {
        try {
            setLoading(true)
            const response = await getProductDetails(productId)

            if (response.success) {
                const product = response.data
                setFormData({
                    name: product.name || "",
                    description: product.description || "",
                    price: product.price?.toString() || "",
                    discount: product.discount?.toString() || "",
                    stock: product.stock?.toString() || "",
                    brand: product.brand || "",
                    condition: product.condition || "new",
                    isActive: product.isActive ?? true,
                    allowPosts: product.allowPosts ?? true,
                    images: product.images || [],
                    videos: product.videos || [],
                    variants: product.variants || [],
                    hashtags: product.hashtags || [],
                })
            }
        } catch (error) {
            toast.error("Lỗi khi tải thông tin sản phẩm")
            console.error("Error fetching product:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (productId) {
            fetchProductDetails()
        }
    }, [productId])

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: "",
            }))
        }
    }

    // Validate form
    const validateForm = () => {
        const newErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = "Tên sản phẩm là bắt buộc"
        }

        if (!formData.description.trim()) {
            newErrors.description = "Mô tả sản phẩm là bắt buộc"
        }

        if (!formData.price || Number.parseFloat(formData.price) <= 0) {
            newErrors.price = "Giá sản phẩm phải lớn hơn 0"
        }

        if (!formData.stock || Number.parseInt(formData.stock) < 0) {
            newErrors.stock = "Số lượng tồn kho không được âm"
        }

        if (formData.discount && (Number.parseFloat(formData.discount) < 0 || Number.parseFloat(formData.discount) > 100)) {
            newErrors.discount = "Giảm giá phải từ 0-100%"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Handle file upload
    const handleFileUpload = async (files, type = "image") => {
        if (!files || files.length === 0) return

        const fileArray = Array.from(files)
        console.log(`Starting upload of ${fileArray.length} ${type}(s)`)

        const uploadPromises = fileArray.map(async (file, index) => {
            const uploadKey = `${type}_${Date.now()}_${index}`

            try {
                // Set initial progress
                setUploadProgress((prev) => ({
                    ...prev,
                    [uploadKey]: 0,
                }))

                console.log(`Uploading ${type}:`, file.name)

                const result = await uploadToCloudinary(file, {
                    onProgress: (progress) => {
                        setUploadProgress((prev) => ({
                            ...prev,
                            [uploadKey]: progress,
                        }))
                    },
                })

                console.log(`Upload result for ${file.name}:`, result)

                // Remove progress indicator
                setUploadProgress((prev) => {
                    const newProgress = { ...prev }
                    delete newProgress[uploadKey]
                    return newProgress
                })

                if (result.success && result.secure_url) {
                    return result.secure_url
                } else {
                    throw new Error("Upload failed - no secure_url returned")
                }
            } catch (error) {
                console.error(`Error uploading ${type} ${file.name}:`, error)

                // Remove progress indicator on error
                setUploadProgress((prev) => {
                    const newProgress = { ...prev }
                    delete newProgress[uploadKey]
                    return newProgress
                })

                toast.error(`Lỗi khi tải lên ${file.name}: ${error.message}`)
                return null
            }
        })

        try {
            const uploadedUrls = await Promise.all(uploadPromises)
            const validUrls = uploadedUrls.filter((url) => url !== null && url !== undefined)

            console.log(`Successfully uploaded ${validUrls.length}/${fileArray.length} ${type}(s):`, validUrls)

            if (validUrls.length > 0) {
                const fieldName = type === "image" ? "images" : "videos"

                setFormData((prev) => {
                    const newData = {
                        ...prev,
                        [fieldName]: [...prev[fieldName], ...validUrls],
                    }
                    console.log(`Updated ${fieldName}:`, newData[fieldName])
                    return newData
                })

                toast.success(`Đã tải lên thành công ${validUrls.length} ${type === "image" ? "hình ảnh" : "video"}`)
            }

            if (validUrls.length < fileArray.length) {
                const failedCount = fileArray.length - validUrls.length
                toast.error(`${failedCount} file không thể tải lên`)
            }
        } catch (error) {
            console.error("Error in handleFileUpload:", error)
            toast.error("Có lỗi xảy ra khi tải lên file")
        }
    }

    // Remove media
    const removeMedia = (index, type) => {
        setFormData((prev) => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index),
        }))
    }

    // Handle variants
    const addVariant = () => {
        if (newVariant.name.trim() && newVariant.options.some((opt) => opt.trim())) {
            setFormData((prev) => ({
                ...prev,
                variants: [
                    ...prev.variants,
                    {
                        name: newVariant.name.trim(),
                        options: newVariant.options.filter((opt) => opt.trim()),
                    },
                ],
            }))
            setNewVariant({ name: "", options: [""] })
        }
    }

    const removeVariant = (index) => {
        setFormData((prev) => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index),
        }))
    }

    const updateVariantOption = (index, value) => {
        setNewVariant((prev) => ({
            ...prev,
            options: prev.options.map((opt, i) => (i === index ? value : opt)),
        }))
    }

    const addVariantOption = () => {
        setNewVariant((prev) => ({
            ...prev,
            options: [...prev.options, ""],
        }))
    }

    const removeVariantOption = (index) => {
        setNewVariant((prev) => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index),
        }))
    }

    // Handle hashtags
    const addHashtag = () => {
        if (newHashtag.trim() && !formData.hashtags.includes(newHashtag.trim())) {
            setFormData((prev) => ({
                ...prev,
                hashtags: [...prev.hashtags, newHashtag.trim()],
            }))
            setNewHashtag("")
        }
    }

    const removeHashtag = (index) => {
        setFormData((prev) => ({
            ...prev,
            hashtags: prev.hashtags.filter((_, i) => i !== index),
        }))
    }

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error("Vui lòng kiểm tra lại thông tin")
            return
        }

        try {
            setSaving(true)

            // Prepare update data
            const updateData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                price: Number.parseFloat(formData.price),
                discount: formData.discount ? Number.parseFloat(formData.discount) : 0,
                stock: Number.parseInt(formData.stock),
                brand: formData.brand.trim(),
                condition: formData.condition,
                isActive: formData.isActive,
                allowPosts: formData.allowPosts,
                images: formData.images, // Đảm bảo gửi mảng images
                videos: formData.videos, // Đảm bảo gửi mảng videos
                variants: formData.variants,
                hashtags: formData.hashtags,
            }

            console.log("Sending update data:", updateData) // Debug log

            const response = await updateProduct(productId, updateData)

            if (response.success) {
                toast.success("Cập nhật sản phẩm thành công!")
                navigate(`/admin/products/${productId}`)
            } else {
                throw new Error(response.message || "Update failed")
            }
        } catch (error) {
            console.error("Error updating product:", error)
            toast.error(error.message || "Lỗi khi cập nhật sản phẩm")
        } finally {
            setSaving(false)
        }
    }

    // Format currency for preview
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount)
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={() => navigate(`/admin/products/${productId}`)}>
                        <FiArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
                        <p className="text-gray-600">{formData.name || "Đang tải..."}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setPreviewMode(!previewMode)}
                        className={cn(previewMode && "bg-pink-100 text-pink-700")}
                    >
                        {previewMode ? <FiEyeOff className="w-4 h-4 mr-2" /> : <FiEye className="w-4 h-4 mr-2" />}
                        {previewMode ? "Thoát xem trước" : "Xem trước"}
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        <FiSave className="w-4 h-4 mr-2" />
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </div>
            </div>

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="space-y-2">
                            {Object.entries(uploadProgress).map(([key, progress]) => (
                                <div key={key} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>Đang tải lên {key.includes("image") ? "hình ảnh" : "video"}...</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin cơ bản</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Tên sản phẩm <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    placeholder="Nhập tên sản phẩm..."
                                    className={cn(errors.name && "border-red-500")}
                                />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">
                                    Mô tả sản phẩm <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                    placeholder="Nhập mô tả chi tiết về sản phẩm..."
                                    rows={6}
                                    className={cn(errors.description && "border-red-500")}
                                />
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">
                                        Giá bán (VND) <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => handleInputChange("price", e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        step="1000"
                                        className={cn(errors.price && "border-red-500")}
                                    />
                                    {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="discount">Giảm giá (%)</Label>
                                    <Input
                                        id="discount"
                                        type="number"
                                        value={formData.discount}
                                        onChange={(e) => handleInputChange("discount", e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        max="100"
                                        className={cn(errors.discount && "border-red-500")}
                                    />
                                    {errors.discount && <p className="text-sm text-red-500">{errors.discount}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="stock">
                                        Số lượng tồn kho <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="stock"
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => handleInputChange("stock", e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        className={cn(errors.stock && "border-red-500")}
                                    />
                                    {errors.stock && <p className="text-sm text-red-500">{errors.stock}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="brand">Thương hiệu</Label>
                                    <Input
                                        id="brand"
                                        value={formData.brand}
                                        onChange={(e) => handleInputChange("brand", e.target.value)}
                                        placeholder="Nhập tên thương hiệu..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="condition">Tình trạng sản phẩm</Label>
                                <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">Mới</SelectItem>
                                        <SelectItem value="used">Đã sử dụng</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Media Upload */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hình ảnh & Video</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Images */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Hình ảnh sản phẩm</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => document.getElementById("image-upload").click()}
                                    >
                                        <FiUpload className="w-4 h-4 mr-2" />
                                        Tải lên hình ảnh
                                    </Button>
                                    <input
                                        id="image-upload"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e.target.files, "image")}
                                    />
                                </div>

                                {formData.images.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {formData.images.map((image, index) => (
                                            <div key={index} className="relative group">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <img
                                                            src={image || "/placeholder.svg"}
                                                            alt={`Product ${index + 1}`}
                                                            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                        />
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-4xl">
                                                        <img
                                                            src={image || "/placeholder.svg"}
                                                            alt={`Product ${index + 1}`}
                                                            className="w-full h-auto"
                                                        />
                                                    </DialogContent>
                                                </Dialog>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeMedia(index, "images")}
                                                >
                                                    <FiTrash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Videos */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Video sản phẩm</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => document.getElementById("video-upload").click()}
                                    >
                                        <FiUpload className="w-4 h-4 mr-2" />
                                        Tải lên video
                                    </Button>
                                    <input
                                        id="video-upload"
                                        type="file"
                                        multiple
                                        accept="video/*"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e.target.files, "video")}
                                    />
                                </div>

                                {formData.videos.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {formData.videos.map((video, index) => (
                                            <div key={index} className="relative group">
                                                <video
                                                    controls
                                                    className="w-full h-48 rounded-lg"
                                                    poster="/placeholder.svg?height=200&width=300"
                                                >
                                                    <source src={video} type="video/mp4" />
                                                    Trình duyệt không hỗ trợ video
                                                </video>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeMedia(index, "videos")}
                                                >
                                                    <FiTrash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Variants */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Biến thể sản phẩm</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Existing variants */}
                            {formData.variants.length > 0 && (
                                <div className="space-y-3">
                                    {formData.variants.map((variant, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <div className="font-medium">{variant.name}</div>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {variant.options.map((option, optionIndex) => (
                                                        <Badge key={optionIndex} variant="outline">
                                                            {option}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button type="button" variant="destructive" size="sm" onClick={() => removeVariant(index)}>
                                                <FiTrash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add new variant */}
                            <div className="space-y-3 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                                <div className="space-y-2">
                                    <Label>Tên biến thể</Label>
                                    <Input
                                        value={newVariant.name}
                                        onChange={(e) => setNewVariant((prev) => ({ ...prev, name: e.target.value }))}
                                        placeholder="VD: Màu sắc, Kích thước..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tùy chọn</Label>
                                    <div className="space-y-2">
                                        {newVariant.options.map((option, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Input
                                                    value={option}
                                                    onChange={(e) => updateVariantOption(index, e.target.value)}
                                                    placeholder="VD: Đỏ, Xanh, Vàng..."
                                                />
                                                {newVariant.options.length > 1 && (
                                                    <Button type="button" variant="outline" size="sm" onClick={() => removeVariantOption(index)}>
                                                        <FiMinus className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={addVariantOption}>
                                        <FiPlus className="w-4 h-4 mr-2" />
                                        Thêm tùy chọn
                                    </Button>
                                </div>

                                <Button type="button" onClick={addVariant} className="w-full">
                                    <FiPlus className="w-4 h-4 mr-2" />
                                    Thêm biến thể
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hashtags */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hashtags</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Existing hashtags */}
                            {formData.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.hashtags.map((tag, index) => (
                                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                            #{tag}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-auto p-0 hover:bg-transparent"
                                                onClick={() => removeHashtag(index)}
                                            >
                                                <FiX className="w-3 h-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Add new hashtag */}
                            <div className="flex gap-2">
                                <Input
                                    value={newHashtag}
                                    onChange={(e) => setNewHashtag(e.target.value)}
                                    placeholder="Nhập hashtag..."
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            addHashtag()
                                        }
                                    }}
                                />
                                <Button type="button" onClick={addHashtag}>
                                    <FiPlus className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Cài đặt</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Trạng thái bán hàng</Label>
                                    <p className="text-sm text-gray-600">Cho phép khách hàng mua sản phẩm</p>
                                </div>
                                <Switch
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Cho phép đăng bài</Label>
                                    <p className="text-sm text-gray-600">Cho phép đăng bài viết kèm sản phẩm</p>
                                </div>
                                <Switch
                                    checked={formData.allowPosts}
                                    onCheckedChange={(checked) => handleInputChange("allowPosts", checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    {previewMode && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Xem trước</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {formData.images.length > 0 && (
                                    <img
                                        src={formData.images[0] || "/placeholder.svg"}
                                        alt="Preview"
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                )}

                                <div>
                                    <h3 className="font-bold text-lg">{formData.name || "Tên sản phẩm"}</h3>
                                    <p className="text-gray-600 text-sm mt-1 line-clamp-3">{formData.description || "Mô tả sản phẩm"}</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Giá:</span>
                                        <div className="text-right">
                                            <div className="font-bold text-lg">
                                                {formData.price ? formatCurrency(Number.parseFloat(formData.price)) : "0 ₫"}
                                            </div>
                                            {formData.discount > 0 && <div className="text-sm text-green-600">Giảm {formData.discount}%</div>}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Tồn kho:</span>
                                        <span className="font-medium">{formData.stock || 0}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Trạng thái:</span>
                                        <Badge variant={formData.isActive ? "success" : "secondary"}>
                                            {formData.isActive ? "Đang bán" : "Ngừng bán"}
                                        </Badge>
                                    </div>
                                </div>

                                {formData.hashtags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {formData.hashtags.slice(0, 3).map((tag, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                #{tag}
                                            </Badge>
                                        ))}
                                        {formData.hashtags.length > 3 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{formData.hashtags.length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                <Button type="submit" className="w-full" disabled={saving}>
                                    <FiSave className="w-4 h-4 mr-2" />
                                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => navigate(`/admin/products/${productId}`)}
                                >
                                    <FiX className="w-4 h-4 mr-2" />
                                    Hủy bỏ
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Debug Panel - chỉ hiển thị trong development */}
                    <FormDataDebug formData={formData} title="Product Form Data" />
                </div>
            </form>
        </div>
    )
}

export default ProductEdit
