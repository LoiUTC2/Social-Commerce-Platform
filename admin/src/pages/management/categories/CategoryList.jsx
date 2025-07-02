"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
    FiSearch,
    FiEye,
    FiEdit3,
    FiTrash2,
    FiMoreHorizontal,
    FiFolder,
    FiTrendingUp,
    FiRefreshCw,
    FiX,
    FiPlus,
    FiGrid,
    FiList,
    FiMove,
} from "react-icons/fi"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Checkbox } from "../../../components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"
import { Separator } from "../../../components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { toast } from "sonner"
import {
    getAllCategories,
    getCategoryTree,
    deleteCategory,
    getCategoryStats,
    searchCategories,
    checkCanDelete,
} from "../../../services/categoryService"
import CategoryTree from "../../../components/categories/CategoryTree"

const CategoryList = () => {
    const navigate = useNavigate()
    const [categories, setCategories] = useState([])
    const [categoryTree, setCategoryTree] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCategories, setSelectedCategories] = useState([])
    const [viewMode, setViewMode] = useState("table") // "table" or "tree"
    const [filters, setFilters] = useState({
        keyword: "",
        level: "all",
        isActive: "all",
        parent: "",
    })
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    })
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        byLevel: {},
    })

    // Fetch categories
    const fetchCategories = async () => {
        try {
            setLoading(true)
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, value]) => value !== "all" && value !== ""),
            )

            const [categoriesResponse, treeResponse, statsResponse] = await Promise.all([
                getAllCategories({ ...cleanFilters, page: pagination.page, limit: pagination.limit }),
                getCategoryTree({ includeInactive: true }),
                getCategoryStats(),
            ])

            if (categoriesResponse.success) {
                setCategories(categoriesResponse.data.categories)
                setPagination(categoriesResponse.data.pagination)
            }

            if (treeResponse.success) {
                setCategoryTree(treeResponse.data.tree)
            }

            if (statsResponse.success) {
                setStats(statsResponse.data)
            }
        } catch (error) {
            toast.error("Lỗi khi tải danh sách danh mục")
            console.error("Error fetching categories:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [pagination.page, pagination.limit])

    // Handle search
    const handleSearch = async () => {
        if (filters.keyword.trim()) {
            try {
                const response = await searchCategories(filters.keyword, {
                    level: filters.level !== "all" ? Number.parseInt(filters.level) : null,
                    isActive: filters.isActive !== "all" ? filters.isActive === "true" : null,
                })
                if (response.success) {
                    setCategories(response.data.results)
                    setPagination((prev) => ({ ...prev, total: response.data.total, page: 1 }))
                }
            } catch (error) {
                toast.error("Lỗi khi tìm kiếm danh mục")
            }
        } else {
            setPagination((prev) => ({ ...prev, page: 1 }))
            fetchCategories()
        }
    }

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedCategories.length === 0) {
            toast.error("Vui lòng chọn ít nhất một danh mục")
            return
        }

        if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedCategories.length} danh mục đã chọn?`)) {
            return
        }

        try {
            const deletePromises = selectedCategories.map(async (categoryId) => {
                const canDelete = await checkCanDelete(categoryId)
                if (canDelete.data.canDelete) {
                    return await deleteCategory(categoryId)
                } else {
                    throw new Error(`Không thể xóa danh mục: ${canDelete.data.reason}`)
                }
            })

            await Promise.all(deletePromises)
            toast.success(`Đã xóa ${selectedCategories.length} danh mục`)
            setSelectedCategories([])
            fetchCategories()
        } catch (error) {
            toast.error(error.message || "Có lỗi xảy ra khi xóa danh mục")
        }
    }

    // Handle single category delete
    const handleCategoryDelete = async (categoryId) => {
        try {
            const canDelete = await checkCanDelete(categoryId)
            if (!canDelete.data.canDelete) {
                toast.error(canDelete.data.reason)
                return
            }

            if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
                const response = await deleteCategory(categoryId)
                if (response.success) {
                    toast.success("Đã xóa danh mục thành công")
                    fetchCategories()
                }
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi xóa danh mục")
        }
    }

    // Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("vi-VN")
    }

    // Get level badge color
    const getLevelBadgeColor = (level) => {
        const colors = {
            1: "bg-pink-100 text-pink-800",
            2: "bg-purple-100 text-purple-800",
            3: "bg-blue-100 text-blue-800",
            4: "bg-green-100 text-green-800",
        }
        return colors[level] || "bg-gray-100 text-gray-800"
    }

    const filteredCategories = useMemo(() => {
        return categories.filter((category) => {
            if (filters.keyword && !category.name.toLowerCase().includes(filters.keyword.toLowerCase())) {
                return false
            }
            if (filters.level !== "all" && category.level.toString() !== filters.level) {
                return false
            }
            if (filters.isActive !== "all" && category.isActive.toString() !== filters.isActive) {
                return false
            }
            return true
        })
    }, [categories, filters])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Danh mục</h1>
                    <p className="text-gray-600 mt-1">Quản lý cấu trúc danh mục sản phẩm</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => fetchCategories()}>
                        <FiRefreshCw className="w-4 h-4 mr-2" />
                        Làm mới
                    </Button>
                    <Button className="bg-pink-600 hover:bg-pink-700" onClick={() => navigate("/admin/categories/create")}>
                        <FiPlus className="w-4 h-4 mr-2" />
                        Thêm danh mục
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng danh mục</CardTitle>
                        <FiFolder className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total?.toLocaleString() || 0}</div>
                        <p className="text-xs text-muted-foreground">Tất cả cấp độ</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
                        <FiTrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.active?.toLocaleString() || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% tổng số
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cấp 1 (Root)</CardTitle>
                        <FiFolder className="h-4 w-4 text-pink-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-pink-600">{stats.byLevel?.[1]?.toLocaleString() || 0}</div>
                        <p className="text-xs text-muted-foreground">Danh mục gốc</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Có sản phẩm</CardTitle>
                        <FiTrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {categories.filter((c) => c.productCount > 0).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Đang được sử dụng</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Bộ lọc & Tìm kiếm</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                placeholder="Tìm kiếm danh mục..."
                                value={filters.keyword}
                                onChange={(e) => handleFilterChange("keyword", e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                            />
                        </div>

                        <Select value={filters.level} onValueChange={(value) => handleFilterChange("level", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Cấp độ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả cấp</SelectItem>
                                <SelectItem value="1">Cấp 1</SelectItem>
                                <SelectItem value="2">Cấp 2</SelectItem>
                                <SelectItem value="3">Cấp 3</SelectItem>
                                <SelectItem value="4">Cấp 4</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.isActive} onValueChange={(value) => handleFilterChange("isActive", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="true">Hoạt động</SelectItem>
                                <SelectItem value="false">Không hoạt động</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button onClick={handleSearch} className="bg-pink-600 hover:bg-pink-700">
                            <FiSearch className="w-4 h-4 mr-2" />
                            Tìm kiếm
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                setFilters({
                                    keyword: "",
                                    level: "all",
                                    isActive: "all",
                                    parent: "",
                                })
                                fetchCategories()
                            }}
                        >
                            <FiX className="w-4 h-4 mr-2" />
                            Xóa bộ lọc
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
                <Tabs value={viewMode} onValueChange={setViewMode}>
                    <TabsList>
                        <TabsTrigger value="table">
                            <FiList className="w-4 h-4 mr-2" />
                            Dạng bảng
                        </TabsTrigger>
                        <TabsTrigger value="tree">
                            <FiGrid className="w-4 h-4 mr-2" />
                            Dạng cây
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Bulk Actions */}
                {selectedCategories.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Đã chọn {selectedCategories.length}</span>
                        <Button size="sm" variant="outline" onClick={() => setSelectedCategories([])}>
                            Bỏ chọn
                        </Button>
                        <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                            Xóa đã chọn
                        </Button>
                    </div>
                )}
            </div>

            {/* Content */}
            <Tabs value={viewMode} onValueChange={setViewMode}>
                <TabsContent value="table">
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách Danh mục</CardTitle>
                            <CardDescription>
                                Hiển thị {filteredCategories.length} / {pagination.total} danh mục
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={
                                                        selectedCategories.length === filteredCategories.length && filteredCategories.length > 0
                                                    }
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedCategories(filteredCategories.map((c) => c._id))
                                                        } else {
                                                            setSelectedCategories([])
                                                        }
                                                    }}
                                                />
                                            </TableHead>
                                            <TableHead>Danh mục</TableHead>
                                            <TableHead>Cấp độ</TableHead>
                                            <TableHead>Danh mục cha</TableHead>
                                            <TableHead>Sản phẩm</TableHead>
                                            <TableHead>Shop</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Ngày tạo</TableHead>
                                            <TableHead className="w-12"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            Array.from({ length: 5 }).map((_, index) => (
                                                <TableRow key={index}>
                                                    <TableCell colSpan={9}>
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-12 h-12 bg-gray-200 rounded animate-pulse"></div>
                                                            <div className="space-y-2 flex-1">
                                                                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                                                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : filteredCategories.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center py-8">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <FiFolder className="w-8 h-8 text-gray-400" />
                                                        <p className="text-gray-500">Không tìm thấy danh mục nào</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredCategories.map((category) => (
                                                <TableRow key={category._id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedCategories.includes(category._id)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedCategories((prev) => [...prev, category._id])
                                                                } else {
                                                                    setSelectedCategories((prev) => prev.filter((id) => id !== category._id))
                                                                }
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-3">
                                                            {category.image ? (
                                                                <img
                                                                    src={category.image || "/placeholder.svg"}
                                                                    alt={category.name}
                                                                    className="w-10 h-10 rounded-md object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-md bg-pink-100 flex items-center justify-center">
                                                                    <FiFolder className="w-5 h-5 text-pink-600" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-medium text-sm">{category.name}</div>
                                                                <div className="text-xs text-gray-500">{category.slug}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={getLevelBadgeColor(category.level)}>Cấp {category.level}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {category.parent ? (
                                                            <span className="text-sm">{category.parent.name}</span>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">Danh mục gốc</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm">{category.productCount || 0}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm">{category.shopCount || 0}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={category.isActive ? "success" : "secondary"}>
                                                            {category.isActive ? "Hoạt động" : "Không hoạt động"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm">{formatDate(category.createdAt)}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <FiMoreHorizontal className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => navigate(`/admin/categories/${category._id}`)}>
                                                                    <FiEye className="w-4 h-4 mr-2" />
                                                                    Xem chi tiết
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => navigate(`/admin/categories/${category._id}/edit`)}>
                                                                    <FiEdit3 className="w-4 h-4 mr-2" />
                                                                    Chỉnh sửa
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => navigate(`/admin/categories/${category._id}/move`)}>
                                                                    <FiMove className="w-4 h-4 mr-2" />
                                                                    Di chuyển
                                                                </DropdownMenuItem>
                                                                <Separator />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleCategoryDelete(category._id)}
                                                                    className="text-red-600"
                                                                >
                                                                    <FiTrash2 className="w-4 h-4 mr-2" />
                                                                    Xóa
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-gray-500">
                                        Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                                        {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total}{" "}
                                        danh mục
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                                            disabled={pagination.page === 1}
                                        >
                                            Trước
                                        </Button>
                                        <span className="text-sm">
                                            Trang {pagination.page} / {pagination.totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                                            disabled={pagination.page === pagination.totalPages}
                                        >
                                            Sau
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tree">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cây Danh mục</CardTitle>
                            <CardDescription>Hiển thị cấu trúc phân cấp danh mục</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CategoryTree
                                data={categoryTree}
                                onEdit={(categoryId) => navigate(`/admin/categories/${categoryId}/edit`)}
                                onDelete={handleCategoryDelete}
                                onView={(categoryId) => navigate(`/admin/categories/${categoryId}`)}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default CategoryList
