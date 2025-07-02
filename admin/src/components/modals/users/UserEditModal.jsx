"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Textarea } from "../../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Card, CardContent } from "../../ui/card"
import { Label } from "../../ui/label"
import { Switch } from "../../ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { Save, Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateUser } from "../../../services/userService"
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary"

export default function UserEditModal({ user, open, onOpenChange, onSuccess }) {
  const avatarInputRef = useRef(null)
  const coverImageInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(null) // tính năng copy-paste


  const [loading, setLoading] = useState(false)
  const [uploadingStates, setUploadingStates] = useState({
    avatar: false,
    coverImage: false,
  })
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    phone: "",
    gender: "unknown",
    address: "",
    role: "buyer",
    isActive: true,
    avatar: "",
    coverImage: "",
  })

  // Stable user ID for dependency
  const userId = user?._id

  useEffect(() => {
    if (user && userId) {
      setFormData({
        fullName: user.fullName || "",
        bio: user.bio || "",
        phone: user.phone || "",
        gender: user.gender || "unknown",
        address: user.address || "",
        role: user.role || "buyer",
        isActive: user.isActive ?? true,
        avatar: user.avatar || "",
        coverImage: user.coverImage || "",
      })
    }
  }, [userId]) // Chỉ depend vào userId thay vì user object

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

  const handleChange = useCallback((key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleImageUpload = useCallback(async (event, imageType) => {
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
  }, [handleChange])

  const handleRemoveImage = useCallback((imageType) => {
    handleChange(imageType, "")
    // Reset file input
    const inputRef = imageType === 'avatar' ? avatarInputRef : coverImageInputRef
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }, [handleChange])

  const getImageTypeLabel = useCallback((imageType) => {
    const labels = {
      avatar: "avatar",
      coverImage: "ảnh bìa",
    }
    return labels[imageType] || imageType
  }, [])

  const handleFileInputClick = useCallback((imageType) => {
    const inputRef = imageType === 'avatar' ? avatarInputRef : coverImageInputRef
    if (inputRef.current) {
      inputRef.current.click()
    }
  }, [])

  const handlePaste = useCallback(async (event, imageType) => {
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
  }, [handleImageUpload])

  //tính nawg copy paste
  const handleDrop = useCallback(async (event, imageType) => {
    event.preventDefault()
    setDragOver(null)

    const files = event.dataTransfer?.files
    if (files && files[0] && files[0].type.startsWith('image/')) {
      await handleImageUpload({ target: { files: [files[0]] } }, imageType)
    }
  }, [handleImageUpload])

  const handleDragOver = useCallback((event, imageType) => {
    event.preventDefault()
    setDragOver(imageType)
  }, [])

  const handleDragLeave = useCallback((event) => {
    event.preventDefault()
    setDragOver(null)
  }, [])

  // Render image upload component
  const ImageUploadComponent = useCallback(({ imageType, label, currentImage, className = "w-20 h-20" }) => {
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
              handleFileInputClick(imageType)
            }
          }}
        >
          {/* Image Preview */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {currentImage ? (
                <div className="relative group">
                  {imageType === "avatar" ? (
                    <Avatar className={className}>
                      <AvatarImage src={currentImage} />
                      <AvatarFallback className="bg-pink-100 text-pink-600">
                        {formData.fullName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <img
                      src={currentImage}
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
            </div>

            {/* Upload Instructions */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Ctrl+V</strong> để dán ảnh hoặc <strong>kéo thả</strong> ảnh vào đây
              </p>

              {/* Upload Button */}
              <div className="w-full">
                <input
                  ref={imageType === 'avatar' ? avatarInputRef : coverImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, imageType)}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-pink-200 hover:border-pink-400 hover:bg-pink-50"
                  disabled={isUploading}
                  onClick={() => handleFileInputClick(imageType)}
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
              {imageType === "coverImage" && "Khuyến nghị: 1200x400px"}
            </p>
          </div>
        </div>
      </div>
    )
  }, [uploadingStates, formData.fullName, handleImageUpload, handleRemoveImage, handleFileInputClick, handlePaste, handleDrop, handleDragOver, handleDragLeave, dragOver])

  // Early return if no user
  if (!user) return null

  // Loading state
  if (loading && !user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-6">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Đang tải...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                  <AvatarImage src={formData.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-pink-100 text-pink-600 text-lg">
                    {formData.fullName?.[0] || "U"}
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

          {/* Image Uploads */}
          <Card className="border-pink-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-4">Hình ảnh người dùng</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUploadComponent
                  key="avatar-upload"
                  imageType="avatar"
                  label="Avatar"
                  currentImage={formData.avatar}
                  className="w-24 h-24"
                />
                <ImageUploadComponent
                  key="cover-upload"
                  imageType="coverImage"
                  label="Ảnh bìa"
                  currentImage={formData.coverImage}
                  className="w-32 h-20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="border-pink-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-4">Thông tin cơ bản</h4>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
              <div className="space-y-2 mt-4">
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
              <div className="space-y-2 mt-4">
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
            </CardContent>
          </Card>

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