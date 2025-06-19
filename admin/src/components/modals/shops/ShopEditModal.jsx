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
import { Save } from "lucide-react"
import { toast } from "sonner"
import { updateShopBasicInfo, updateShopFeatureLevel } from "../../../services/shopService"

export default function ShopEditModal({ shop, open, onOpenChange, onSuccess }) {
    const [loading, setLoading] = useState(false)
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

    if (!shop) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

                    {/* Images */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="avatar">Avatar URL</Label>
                            <Input
                                id="avatar"
                                value={formData.avatar}
                                onChange={(e) => handleChange("avatar", e.target.value)}
                                placeholder="https://..."
                                className="border-pink-200 focus:border-pink-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="logo">Logo URL</Label>
                            <Input
                                id="logo"
                                value={formData.logo}
                                onChange={(e) => handleChange("logo", e.target.value)}
                                placeholder="https://..."
                                className="border-pink-200 focus:border-pink-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="coverImage">Cover Image URL</Label>
                            <Input
                                id="coverImage"
                                value={formData.coverImage}
                                onChange={(e) => handleChange("coverImage", e.target.value)}
                                placeholder="https://..."
                                className="border-pink-200 focus:border-pink-400"
                            />
                        </div>
                    </div>

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
                        <Button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-700">
                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
