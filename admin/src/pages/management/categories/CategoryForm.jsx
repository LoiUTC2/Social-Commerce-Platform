"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { FiArrowLeft, FiSave, FiUpload, FiX, FiImage } from "react-icons/fi"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Label } from "../../../components/ui/label"
import { Switch } from "../../../components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Badge } from "../../../components/ui/badge"
import { toast } from "sonner"
import { createCategory, updateCategory, getCategoryById, getAllCategories } from "../../../services/categoryService"
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary"

const CategoryForm = () => {
    const { categoryId } = useParams()
    const navigate = useNavigate()
    const isEdit = !!categoryId
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(isEdit)
    const [imageUploading, setImageUploading] = useState(false)
    const [parentCategories, setParentCategories] = useState([])
    const [selectedImage, setSelectedImage] = useState(null)
    const [keywords, setKeywords] = useState([])
    const [keywordInput, setKeywordInput] = useState("")

    // Sử dụng useRef thay vì document.getElementById
    const fileInputRef = useRef(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
    } = useForm({
        defaultValues: {
            name: "",
            description: "",
            parent: "",
            icon: "",
            image: "",
            color: "#ec4899",
            isActive: true,
            isVisible: true,
            sortOrder: 0,
            metaTitle: "",
            metaDescription: "",
        },
    })

    const watchedParent = watch("parent")
    const watchedIsActive = watch("isActive")
    const watchedIsVisible = watch("isVisible")

    useEffect(() => {
        fetchParentCategories()
        if (isEdit) {
            fetchCategoryData()
        }
    }, [isEdit, categoryId])

    const fetchParentCategories = useCallback(async () => {
        try {
            const response = await getAllCategories({ isActive: true })
            if (response.success) {
                // Filter out current category if editing to prevent circular reference
                const filtered = isEdit
                    ? response.data.categories.filter((cat) => cat._id !== categoryId)
                    : response.data.categories
                setParentCategories(filtered)
            }
        } catch (error) {
            console.error("Error fetching parent categories:", error)
        }
    }, [isEdit, categoryId])

    const fetchCategoryData = useCallback(async () => {
        try {
            setInitialLoading(true)
            const response = await getCategoryById(categoryId)
            if (response.success) {
                const category = response.data.category
                reset({
                    name: category.name,
                    description: category.description || "",
                    parent: category.parent?._id || "",
                    icon: category.icon || "",
                    image: category.image || "",
                    color: category.color || "#ec4899",
                    isActive: category.isActive,
                    isVisible: category.isVisible,
                    sortOrder: category.sortOrder || 0,
                    metaTitle: category.metaTitle || "",
                    metaDescription: category.metaDescription || "",
                })
                setSelectedImage(category.image || null)
                setKeywords(category.keywords || [])
            }
        } catch (error) {
            toast.error("Lỗi khi tải thông tin danh mục")
            console.error("Error fetching category:", error)
        } finally {
            setInitialLoading(false)
        }
    }, [categoryId, reset])

    const handleImageUpload = useCallback(async (event) => {
        const file = event.target.files[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Vui lòng chọn file hình ảnh")
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Kích thước file không được vượt quá 5MB")
            return
        }

        try {
            setImageUploading(true)
            const result = await uploadToCloudinary(file)
            if (result.success) {
                setSelectedImage(result.secure_url)
                setValue("image", result.secure_url)
                toast.success("Tải ảnh lên thành công")
            }
        } catch (error) {
            toast.error("Lỗi khi tải ảnh lên")
            console.error("Error uploading image:", error)
        } finally {
            setImageUploading(false)
        }
    }, [setValue])

    const handleAddKeyword = useCallback(() => {
        if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
            setKeywords(prev => [...prev, keywordInput.trim()])
            setKeywordInput("")
        }
    }, [keywordInput, keywords])

    const handleRemoveKeyword = useCallback((keyword) => {
        setKeywords(prev => prev.filter((k) => k !== keyword))
    }, [])

    const handleImageRemove = useCallback(() => {
        setSelectedImage(null)
        setValue("image", "")
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }, [setValue])

    // Sửa hàm handleFileInputClick để sử dụng ref
    const handleFileInputClick = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }, [])

    const onSubmit = useCallback(async (data) => {
        try {
            setLoading(true)

            const formData = {
                ...data,
                keywords,
                parent: data.parent && data.parent !== "none" ? data.parent : null,
            }

            let response
            if (isEdit) {
                response = await updateCategory(categoryId, formData)
            } else {
                response = await createCategory(formData)
            }

            if (response.success) {
                toast.success(isEdit ? "Cập nhật danh mục thành công" : "Tạo danh mục thành công")
                navigate("/admin/categories")
            }
        } catch (error) {
            toast.error(error.message || "Có lỗi xảy ra")
            console.error("Error saving category:", error)
        } finally {
            setLoading(false)
        }
    }, [keywords, isEdit, categoryId, navigate])

    const generateSlug = useCallback((name) => {
        return name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim("-")
    }, [])

    const handleKeywordKeyPress = useCallback((e) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleAddKeyword()
        }
    }, [handleAddKeyword])

    const handleParentChange = useCallback((value) => {
        setValue("parent", value === "none" ? "" : value)
    }, [setValue])

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
                    <p>Đang tải thông tin danh mục...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => navigate("/admin/categories")}>
                        <FiArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{isEdit ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}</h1>
                        <p className="text-gray-600 mt-1">
                            {isEdit ? "Cập nhật thông tin danh mục" : "Thêm danh mục mới vào hệ thống"}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin cơ bản</CardTitle>
                            <CardDescription>Nhập thông tin cơ bản của danh mục</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Tên danh mục *</Label>
                                    <Input
                                        id="name"
                                        {...register("name", { required: "Tên danh mục là bắt buộc" })}
                                        placeholder="Nhập tên danh mục"
                                    />
                                    {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="parent">Danh mục cha</Label>
                                    <Select value={watchedParent || ""} onValueChange={handleParentChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn danh mục cha (tùy chọn)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Không có (Danh mục gốc)</SelectItem>
                                            {parentCategories.map((category) => (
                                                <SelectItem key={`parent-${category._id}`} value={category._id}>
                                                    {"  ".repeat((category.level || 1) - 1)}
                                                    {category.name} (Cấp {category.level || 1})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Mô tả</Label>
                                <Textarea id="description" {...register("description")} placeholder="Nhập mô tả danh mục" rows={3} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="icon">Icon (Class CSS)</Label>
                                    <Input id="icon" {...register("icon")} placeholder="fa-solid fa-folder" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="color">Màu sắc</Label>
                                    <div className="flex items-center gap-2">
                                        <Input id="color" type="color" {...register("color")} className="w-12 h-10 p-1" />
                                        <Input {...register("color")} placeholder="#ec4899" className="flex-1" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sortOrder">Thứ tự sắp xếp</Label>
                                    <Input
                                        id="sortOrder"
                                        type="number"
                                        {...register("sortOrder", { valueAsNumber: true })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SEO Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin SEO</CardTitle>
                            <CardDescription>Tối ưu hóa cho công cụ tìm kiếm</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="metaTitle">Meta Title</Label>
                                <Input id="metaTitle" {...register("metaTitle")} placeholder="Tiêu đề SEO" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="metaDescription">Meta Description</Label>
                                <Textarea id="metaDescription" {...register("metaDescription")} placeholder="Mô tả SEO" rows={3} />
                            </div>

                            <div className="space-y-2">
                                <Label>Keywords</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        placeholder="Nhập từ khóa"
                                        onKeyPress={handleKeywordKeyPress}
                                    />
                                    <Button type="button" onClick={handleAddKeyword}>
                                        Thêm
                                    </Button>
                                </div>
                                {keywords.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {keywords.map((keyword, index) => (
                                            <Badge key={`keyword-${index}-${keyword}`} variant="outline" className="text-xs">
                                                {keyword}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveKeyword(keyword)}
                                                    className="ml-1 hover:text-red-600"
                                                >
                                                    <FiX className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Image Upload */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hình ảnh danh mục</CardTitle>
                            <CardDescription>Tải lên hình ảnh đại diện cho danh mục</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col items-center gap-4">
                                {selectedImage ? (
                                    <div className="relative">
                                        <img
                                            src={selectedImage}
                                            alt="Category preview"
                                            className="w-32 h-32 rounded-lg object-cover"
                                            onError={(e) => {
                                                console.error("Image load error:", e)
                                                setSelectedImage(null)
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleImageRemove}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                        >
                                            <FiX className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                        <FiImage className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}

                                <div className="w-full">
                                    {/* Sử dụng ref thay vì id */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        disabled={imageUploading}
                                        onClick={handleFileInputClick}
                                    >
                                        {imageUploading ? (
                                            <>Đang tải lên...</>
                                        ) : (
                                            <>
                                                <FiUpload className="w-4 h-4 mr-2" />
                                                Chọn hình ảnh
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Cài đặt</CardTitle>
                            <CardDescription>Cấu hình trạng thái và hiển thị</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Trạng thái hoạt động</Label>
                                    <p className="text-sm text-gray-500">Danh mục có được sử dụng không</p>
                                </div>
                                <Switch
                                    checked={watchedIsActive}
                                    onCheckedChange={(checked) => setValue("isActive", checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Hiển thị công khai</Label>
                                    <p className="text-sm text-gray-500">Hiển thị cho người dùng</p>
                                </div>
                                <Switch
                                    checked={watchedIsVisible}
                                    onCheckedChange={(checked) => setValue("isVisible", checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col gap-3">
                                <Button type="submit" className="bg-pink-600 hover:bg-pink-700" disabled={loading}>
                                    <FiSave className="w-4 h-4 mr-2" />
                                    {loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo danh mục"}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => navigate("/admin/categories")}>
                                    Hủy bỏ
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    )
}

export default CategoryForm