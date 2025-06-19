"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Textarea } from "../../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Card, CardContent } from "../../ui/card"
import { Label } from "../../ui/label"
import { Switch } from "../../ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { updateUser } from "../../../services/userService"

export default function UserEditModal({ user, open, onOpenChange, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    phone: "",
    gender: "unknown",
    address: "",
    role: "buyer",
    isActive: true,
  })

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        bio: user.bio || "",
        phone: user.phone || "",
        gender: user.gender || "unknown",
        address: user.address || "",
        role: user.role || "buyer",
        isActive: user.isActive ?? true,
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)
      const response = await updateUser(user._id, formData)

      if (response.success) {
        toast.success("Cập nhật người dùng thành công")
        onSuccess?.()
      }
    } catch (error) {
      toast.error("Lỗi khi cập nhật người dùng")
      console.error("Error updating user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-pink-600" />
            Chỉnh sửa người dùng
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Avatar & Basic Info */}
          <Card className="border-pink-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-pink-100 text-pink-600 text-lg">
                    {user.fullName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{user.email}</h4>
                  <p className="text-sm text-gray-500">ID: {user._id}</p>
                  <p className="text-sm text-gray-500">
                    Tham gia: {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="Nhập họ và tên..."
                required
                className="border-pink-200 focus:border-pink-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Nhập số điện thoại..."
                className="border-pink-200 focus:border-pink-400"
              />
            </div>
          </div>

          {/* Gender & Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Giới tính</Label>
              <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
                <SelectTrigger className="border-pink-200">
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Không xác định</SelectItem>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="female">Nữ</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleChange("role", value)}>
                <SelectTrigger className="border-pink-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Nhập địa chỉ..."
              className="border-pink-200 focus:border-pink-400"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Giới thiệu</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Nhập giới thiệu về người dùng..."
              rows={3}
              className="border-pink-200 focus:border-pink-400"
            />
          </div>

          {/* Account Status */}
          <Card className="border-pink-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Trạng thái tài khoản</Label>
                  <p className="text-sm text-gray-500">
                    {formData.isActive ? "Tài khoản đang hoạt động" : "Tài khoản bị vô hiệu hóa"}
                  </p>
                </div>
                <Switch checked={formData.isActive} onCheckedChange={(checked) => handleChange("isActive", checked)} />
              </div>
            </CardContent>
          </Card>

          {/* Shop Information (if exists) */}
          {user.shopId && (
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-purple-800 mb-2">Thông tin Shop</h4>
                <div className="text-sm text-purple-700">
                  <p>
                    Người dùng này có shop: <strong>{user.shopDetails?.name || "Chưa có tên"}</strong>
                  </p>
                  <p>
                    Trạng thái: <strong>{user.shopDetails?.isApproved ? "Đã duyệt" : "Chờ duyệt"}</strong>
                  </p>
                  <p className="text-xs mt-1 text-purple-600">
                    Lưu ý: Thay đổi trạng thái người dùng sẽ ảnh hưởng đến shop của họ
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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
