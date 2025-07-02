"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Textarea } from "../../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Card, CardContent } from "../../ui/card"
import { Label } from "../../ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { Save, Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateShopBasicInfo, updateShopFeatureLevel } from "../../../services/shopService"
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary"

export default function ShopEditModal({ shop, open, onOpenChange, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [uploadingStates, setUploadingStates] = useState({
        avatar: false,
        logo: false,
        coverImage: false,
    })
    const [dragOver, setDragOver] = useState(null) //tính năng copy-paste

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        avatar: "",
        logo: "",
        coverImage: "",
        contact: {
            phone: "",
            email: "",
        },
        featureLevel: "normal",
    })

    useEffect(() => {
        if (shop) {
            setFormData({
                name: shop.name || "",
                description: shop.description || "",
                avatar: shop.avatar || "",
                logo: shop.logo || "",
                coverImage: shop.coverImage || "",
                contact: {
                    phone: shop.contact?.phone || "",
                    email: shop.contact?.email || "",
                },
                featureLevel: shop.status?.featureLevel || "normal",
            })
        }
    }, [shop])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!shop) return

        try {
            setLoading(true)

            // Update basic info
            const basicInfoResponse = await updateShopBasicInfo(shop._id, {
                name: formData.name,
                description: formData.description,
                avatar: formData.avatar,
                logo: formData.logo,
                coverImage: formData.coverImage,
                contact: formData.contact,
            })

            // Update feature level if changed
            if (formData.featureLevel !== shop.status?.featureLevel) {
                await updateShopFeatureLevel(shop._id, formData.featureLevel)
            }

            if (basicInfoResponse.success) {
                toast.success("Cập nhật shop thành công")
                onSuccess?.()
            }
        } catch (error) {
            toast.error("Lỗi khi cập nhật shop")
            console.error("Error updating shop:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (key, value) => {
        if (key.includes(".")) {
            const [parent, child] = key.split(".")
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value,
                },
            }))
        } else {
            setFormData((prev) => ({ ...prev, [key]: value }))
        }
    }

    const handleImageUpload = async (event, imageType) => {
        const file = event.target.files[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Vui lòng chọn file hình ảnh")
            return
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Kích thước file không được vượt quá 5MB")
            return
        }

        try {
            setUploadingStates((prev) => ({ ...prev, [imageType]: true }))

            const result = await uploadToCloudinary(file, {
                onProgress: (progress) => {
                    // You can add progress indicator here if needed
                    console.log(`Upload ${imageType} progress: ${progress}%`)
                },
            })

            if (result.success) {
                handleChange(imageType, result.secure_url)
                toast.success(`Tải ${getImageTypeLabel(imageType)} lên thành công`)
            }
        } catch (error) {
            toast.error(`Lỗi khi tải ${getImageTypeLabel(imageType)} lên`)
            console.error(`Error uploading ${imageType}:`, error)
        } finally {
            setUploadingStates((prev) => ({ ...prev, [imageType]: false }))
        }
    }

    const handleRemoveImage = (imageType) => {
        handleChange(imageType, "")
        // Reset file input
        const fileInput = document.getElementById(`${imageType}-upload`)
        if (fileInput) {
            fileInput.value = ""
        }
    }

    const handlePaste = async (event, imageType) => {
        const items = event.clipboardData?.items
        if (!items) return

        for (let item of items) {
            if (item.type.startsWith('image/')) {
                event.preventDefault()
                const file = item.getAsFile()
                if (file) {
                    await handleImageUpload({ target: { files: [file] } }, imageType)
                }
                break
            }
        }
    }

    const handleDrop = async (event, imageType) => {
        event.preventDefault()
        setDragOver(null)

        const files = event.dataTransfer?.files
        if (files && files[0] && files[0].type.startsWith('image/')) {
            await handleImageUpload({ target: { files: [files[0]] } }, imageType)
        }
    }

    const handleDragOver = (event, imageType) => {
        event.preventDefault()
        setDragOver(imageType)
    }

    const handleDragLeave = (event) => {
        event.preventDefault()
        setDragOver(null)
    }

    const getImageTypeLabel = (imageType) => {
        const labels = {
            avatar: "avatar",
            logo: "logo",
            coverImage: "ảnh bìa",
        }
        return labels[imageType] || imageType
    }

    const renderImageUpload = (imageType, label, currentImage, className = "w-20 h-20") => {
        const isUploading = uploadingStates[imageType]

        return (
            <div className="space-y-3">
                <Label className="text-sm font-medium">{label}</Label>

                {/* Paste Area */}
                <div
                    className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${dragOver === imageType
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-300 hover:border-pink-400'
                        }`}
                    onPaste={(e) => handlePaste(e, imageType)}
                    onDrop={(e) => handleDrop(e, imageType)}
                    onDragOver={(e) => handleDragOver(e, imageType)}
                    onDragLeave={handleDragLeave}
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            document.getElementById(`${imageType}-upload`)?.click()
                        }
                    }}
                >
                    {/* Image Preview */}
                    <div className="flex flex-col items-center gap-3">
                        {currentImage ? (
                            <div className="relative group">
                                {imageType === "avatar" ? (
                                    <Avatar className={className}>
                                        <AvatarImage src={currentImage || "/placeholder.svg"} />
                                        <AvatarFallback className="bg-pink-100 text-pink-600">{formData.name?.[0] || "S"}</AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <img
                                        src={currentImage || "/placeholder.svg"}
                                        alt={label}
                                        className={`${className} rounded-lg object-cover border-2 border-gray-200`}
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(imageType)}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    disabled={isUploading}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <div className={`${className} flex items-center justify-center bg-gray-50 rounded-lg`}>
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                        )}

                        {/* Upload Instructions */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-2">
                                <strong>Ctrl+V</strong> để dán ảnh hoặc <strong>kéo thả</strong> ảnh vào đây
                            </p>

                            {/* Upload Button */}
                            <div className="w-full">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, imageType)}
                                    className="hidden"
                                    id={`${imageType}-upload`}
                                    disabled={isUploading}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-pink-200 hover:border-pink-400 hover:bg-pink-50"
                                    disabled={isUploading}
                                    onClick={() => {
                                        const fileInput = document.getElementById(`${imageType}-upload`)
                                        if (fileInput) {
                                            fileInput.click()
                                        }
                                    }}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Đang tải lên...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            {currentImage ? "Thay đổi" : "Chọn ảnh"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* File Info */}
                        <p className="text-xs text-gray-500 text-center">
                            JPG, PNG, GIF (tối đa 5MB)
                            <br />
                            {imageType === "avatar" && "Khuyến nghị: 400x400px"}
                            {imageType === "logo" && "Khuyến nghị: 200x200px"}
                            {imageType === "coverImage" && "Khuyến nghị: 1200x400px"}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (!shop) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Save className="w-5 h-5 text-pink-600" />
                        Chỉnh sửa Shop
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Shop Avatar & Basic Info */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar className="w-16 h-16">
                                    <AvatarImage src={formData.avatar || "/placeholder.svg"} />
                                    <AvatarFallback className="bg-pink-100 text-pink-600 text-lg">
                                        {formData.name?.[0] || "S"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-semibold">@{shop.slug}</h4>
                                    <p className="text-sm text-gray-500">ID: {shop._id}</p>
                                    <p className="text-sm text-gray-500">Tạo: {new Date(shop.createdAt).toLocaleDateString("vi-VN")}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Basic Information */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tên shop *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                placeholder="Nhập tên shop..."
                                required
                                className="border-pink-200 focus:border-pink-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleChange("description", e.target.value)}
                                placeholder="Nhập mô tả shop..."
                                rows={3}
                                className="border-pink-200 focus:border-pink-400"
                            />
                        </div>
                    </div>

                    {/* Image Uploads */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-4">Hình ảnh shop</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Avatar Upload */}
                                {renderImageUpload("avatar", "Avatar Shop", formData.avatar, "w-24 h-24")}

                                {/* Logo Upload */}
                                {renderImageUpload("logo", "Logo Shop", formData.logo, "w-20 h-20")}

                                {/* Cover Image Upload */}
                                {renderImageUpload("coverImage", "Ảnh bìa", formData.coverImage, "w-32 h-20")}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Thông tin liên hệ</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Số điện thoại</Label>
                                    <Input
                                        id="phone"
                                        value={formData.contact.phone}
                                        onChange={(e) => handleChange("contact.phone", e.target.value)}
                                        placeholder="Nhập số điện thoại..."
                                        className="border-pink-200 focus:border-pink-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.contact.email}
                                        onChange={(e) => handleChange("contact.email", e.target.value)}
                                        placeholder="Nhập email..."
                                        className="border-pink-200 focus:border-pink-400"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Feature Level */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Gói dịch vụ</h4>
                            <div className="space-y-2">
                                <Label>Cấp độ đặc quyền</Label>
                                <Select value={formData.featureLevel} onValueChange={(value) => handleChange("featureLevel", value)}>
                                    <SelectTrigger className="border-pink-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="normal">Normal - Gói cơ bản</SelectItem>
                                        <SelectItem value="premium">Premium - Gói nâng cao</SelectItem>
                                        <SelectItem value="vip">VIP - Gói cao cấp</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500">
                                    Thay đổi gói dịch vụ sẽ ảnh hưởng đến các tính năng và hiển thị của shop
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Owner Information (Read-only) */}
                    <Card className="border-purple-200 bg-purple-50">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-purple-800 mb-2">Thông tin chủ shop</h4>
                            <div className="text-sm text-purple-700">
                                <p>
                                    Chủ shop: <strong>{shop.owner?.fullName || "Unknown"}</strong>
                                </p>
                                <p>
                                    Email: <strong>{shop.owner?.email}</strong>
                                </p>
                                <p>
                                    Trạng thái: <strong>{shop.owner?.isActive ? "Hoạt động" : "Không hoạt động"}</strong>
                                </p>
                                <p className="text-xs mt-1 text-purple-600">
                                    Lưu ý: Để thay đổi thông tin chủ shop, vui lòng truy cập trang quản lý người dùng
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || Object.values(uploadingStates).some((state) => state)}
                            className="bg-pink-600 hover:bg-pink-700"
                        >
                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}