"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
    FiArrowLeft,
    FiEdit3,
    FiTrash2,
    FiFolder,
    FiPackage,
    FiShoppingBag,
    FiCalendar,
    FiUser,
    FiEye,
    FiEyeOff,
    FiMove,
} from "react-icons/fi"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Separator } from "../../../components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../../components/ui/breadcrumb"
import { toast } from "sonner"
import {
    getCategoryById,
    getCategoryBreadcrumb,
    getCategoryChildren,
    deleteCategory,
    checkCanDelete,
} from "../../../services/categoryService"

const CategoryDetail = () => {
    const { categoryId } = useParams()
    const navigate = useNavigate()
    const [category, setCategory] = useState(null)
    const [breadcrumb, setBreadcrumb] = useState([])
    const [children, setChildren] = useState([])
    const [loading, setLoading] = useState(true)
    const [canDelete, setCanDelete] = useState({ canDelete: false, reason: "" })

    useEffect(() => {
        fetchCategoryDetail()
    }, [categoryId])

    const fetchCategoryDetail = async () => {
        try {
            setLoading(true)
            const [categoryResponse, breadcrumbResponse, childrenResponse, deleteCheckResponse] = await Promise.all([
                getCategoryById(categoryId),
                getCategoryBreadcrumb(categoryId),
                getCategoryChildren(categoryId, true),
                checkCanDelete(categoryId),
            ])

            if (categoryResponse.success) {
                setCategory(categoryResponse.data.category)
            }

            if (breadcrumbResponse.success) {
                setBreadcrumb(breadcrumbResponse.data)
            }

            if (childrenResponse.success) {
                setChildren(childrenResponse.data.children)
            }

            if (deleteCheckResponse.success) {
                setCanDelete(deleteCheckResponse.data)
            }
        } catch (error) {
            toast.error("Lỗi khi tải thông tin danh mục")
            console.error("Error fetching category detail:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!canDelete.canDelete) {
            toast.error(canDelete.reason)
            return
        }

        if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
            try {
                const response = await deleteCategory(categoryId)
                if (response.success) {
                    toast.success("Đã xóa danh mục thành công")
                    navigate("/admin/categories")
                }
            } catch (error) {
                toast.error("Có lỗi xảy ra khi xóa danh mục")
            }
        }
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getLevelBadgeColor = (level) => {
        const colors = {
            1: "bg-pink-100 text-pink-800",
            2: "bg-purple-100 text-purple-800",
            3: "bg-blue-100 text-blue-800",
            4: "bg-green-100 text-green-800",
        }
        return colors[level] || "bg-gray-100 text-gray-800"
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-6">
                        <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!category) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <FiFolder className="w-16 h-16 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy danh mục</h2>
                <p className="text-gray-600 mb-4">Danh mục bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
                <Button onClick={() => navigate("/admin/categories")}>
                    <FiArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại danh sách
                </Button>
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
                        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
                        <p className="text-gray-600 mt-1">Chi tiết thông tin danh mục</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => navigate(`/admin/categories/${categoryId}/move`)}>
                        <FiMove className="w-4 h-4 mr-2" />
                        Di chuyển
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/admin/categories/${categoryId}/edit`)}>
                        <FiEdit3 className="w-4 h-4 mr-2" />
                        Chỉnh sửa
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={!canDelete.canDelete}>
                        <FiTrash2 className="w-4 h-4 mr-2" />
                        Xóa
                    </Button>
                </div>
            </div>

            {/* Breadcrumb */}
            {breadcrumb.length > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/categories">Danh mục</BreadcrumbLink>
                                </BreadcrumbItem>
                                {breadcrumb.map((item, index) => (
                                    <div key={item._id} className="flex items-center">
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            {index === breadcrumb.length - 1 ? (
                                                <BreadcrumbPage>{item.name}</BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink href={`/admin/categories/${item._id}`}>{item.name}</BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                    </div>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin cơ bản</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-start gap-4">
                                {category.image ? (
                                    <img
                                        src={category.image || "/placeholder.svg"}
                                        alt={category.name}
                                        className="w-20 h-20 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-lg bg-pink-100 flex items-center justify-center">
                                        <FiFolder className="w-8 h-8 text-pink-600" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{category.name}</h2>
                                    <p className="text-gray-600 mb-3">{category.description || "Chưa có mô tả"}</p>
                                    <div className="flex items-center gap-3">
                                        <Badge className={getLevelBadgeColor(category.level)}>Cấp {category.level}</Badge>
                                        <Badge variant={category.isActive ? "success" : "secondary"}>
                                            {category.isActive ? "Hoạt động" : "Không hoạt động"}
                                        </Badge>
                                        <Badge variant={category.isVisible ? "default" : "secondary"}>
                                            {category.isVisible ? (
                                                <>
                                                    <FiEye className="w-3 h-3 mr-1" />
                                                    Hiển thị
                                                </>
                                            ) : (
                                                <>
                                                    <FiEyeOff className="w-3 h-3 mr-1" />
                                                    Ẩn
                                                </>
                                            )}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Slug</label>
                                    <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">{category.slug}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Thứ tự sắp xếp</label>
                                    <p className="text-sm text-gray-900">{category.sortOrder}</p>
                                </div>
                            </div>

                            {category.color && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Màu sắc</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-6 h-6 rounded border" style={{ backgroundColor: category.color }}></div>
                                        <span className="text-sm text-gray-900 font-mono">{category.color}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* SEO Information */}
                    {(category.metaTitle || category.metaDescription || category.keywords?.length > 0) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Thông tin SEO</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {category.metaTitle && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Meta Title</label>
                                        <p className="text-sm text-gray-900">{category.metaTitle}</p>
                                    </div>
                                )}
                                {category.metaDescription && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Meta Description</label>
                                        <p className="text-sm text-gray-900">{category.metaDescription}</p>
                                    </div>
                                )}
                                {category.keywords?.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Keywords</label>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {category.keywords.map((keyword, index) => (
                                                <Badge key={index} variant="outline" className="text-xs">
                                                    {keyword}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Children Categories */}
                    {children.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Danh mục con ({children.length})</CardTitle>
                                <CardDescription>Các danh mục thuộc danh mục này</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {children.map((child) => (
                                        <div
                                            key={child._id}
                                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                            onClick={() => navigate(`/admin/categories/${child._id}`)}
                                        >
                                            {child.image ? (
                                                <img
                                                    src={child.image || "/placeholder.svg"}
                                                    alt={child.name}
                                                    className="w-10 h-10 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-pink-100 flex items-center justify-center">
                                                    <FiFolder className="w-5 h-5 text-pink-600" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-medium text-sm">{child.name}</h4>
                                                <p className="text-xs text-gray-500">{child.productCount || 0} sản phẩm</p>
                                            </div>
                                            <Badge variant={child.isActive ? "success" : "secondary"} className="text-xs">
                                                {child.isActive ? "Hoạt động" : "Không hoạt động"}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Statistics */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thống kê</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FiPackage className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-gray-600">Sản phẩm</span>
                                </div>
                                <span className="font-semibold">{category.productCount || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FiShoppingBag className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-gray-600">Shop</span>
                                </div>
                                <span className="font-semibold">{category.shopCount || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FiFolder className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm text-gray-600">Danh mục con</span>
                                </div>
                                <span className="font-semibold">{children.length}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Creation Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin tạo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <FiCalendar className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium">Ngày tạo</p>
                                    <p className="text-xs text-gray-600">{formatDate(category.createdAt)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FiCalendar className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium">Cập nhật cuối</p>
                                    <p className="text-xs text-gray-600">{formatDate(category.updatedAt)}</p>
                                </div>
                            </div>
                            {category.createdBy && (
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={category.createdBy.avatar || "/placeholder.svg"} />
                                        <AvatarFallback>
                                            <FiUser className="w-4 h-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">Người tạo</p>
                                        <p className="text-xs text-gray-600">{category.createdBy.fullName || "Admin"}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Delete Warning */}
                    {!canDelete.canDelete && (
                        <Card className="border-red-200 bg-red-50">
                            <CardHeader>
                                <CardTitle className="text-red-800">Không thể xóa</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-red-700">{canDelete.reason}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}

export default CategoryDetail
