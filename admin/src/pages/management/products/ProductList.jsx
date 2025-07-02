"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
    FiSearch,
    FiDownload,
    FiEye,
    FiEdit3,
    FiTrash2,
    FiPower,
    FiMoreHorizontal,
    FiPackage,
    FiDollarSign,
    FiTrendingUp,
    FiRefreshCw,
    FiX,
} from "react-icons/fi"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Checkbox } from "../../../components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu"
import { Separator } from "../../../components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import { toast } from "sonner"
import {
    getAllProducts,
    deactivateProduct,
    deleteProduct,
    bulkUpdateProducts,
    exportProducts,
} from "../../../services/productService"

const ProductList = () => {
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedProducts, setSelectedProducts] = useState([])
    const [filters, setFilters] = useState({
        keyword: "",
        isActive: "all",
        seller: "",
        category: "",
        priceRange: "",
        stockStatus: "all",
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
        lowStock: 0,
    })

    // Fetch products
    const fetchProducts = async () => {
        try {
            setLoading(true)
            const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== "all"))

            const response = await getAllProducts(cleanFilters, pagination.page, pagination.limit)

            if (response.success) {
                setProducts(response.data.products)
                setPagination(response.data.pagination)

                // Calculate stats
                const totalProducts = response.data.products
                setStats({
                    total: totalProducts.length,
                    active: totalProducts.filter((p) => p.isActive).length,
                    inactive: totalProducts.filter((p) => !p.isActive).length,
                    lowStock: totalProducts.filter((p) => p.stock < 10).length,
                })
            }
        } catch (error) {
            toast.error("Lỗi khi tải danh sách sản phẩm")
            console.error("Error fetching products:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [pagination.page, pagination.limit])

    // Handle search
    const handleSearch = () => {
        setPagination((prev) => ({ ...prev, page: 1 }))
        fetchProducts()
    }

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    // Handle bulk actions
    const handleBulkAction = async (action) => {
        if (selectedProducts.length === 0) {
            toast.error("Vui lòng chọn ít nhất một sản phẩm")
            return
        }

        try {
            let response
            switch (action) {
                case "activate":
                    response = await bulkUpdateProducts(selectedProducts, "activate")
                    break
                case "deactivate":
                    response = await bulkUpdateProducts(selectedProducts, "deactivate")
                    break
                case "delete":
                    if (window.confirm("Bạn có chắc chắn muốn xóa các sản phẩm đã chọn?")) {
                        response = await bulkUpdateProducts(selectedProducts, "delete")
                    }
                    break
                default:
                    return
            }

            if (response?.success) {
                toast.success(
                    `Đã ${action === "activate" ? "kích hoạt" : action === "deactivate" ? "vô hiệu hóa" : "xóa"} ${selectedProducts.length} sản phẩm`,
                )
                setSelectedProducts([])
                fetchProducts()
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi thực hiện thao tác")
        }
    }

    // Handle export
    const handleExport = async (format) => {
        try {
            const blob = await exportProducts(filters, format)
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `products.${format === "excel" ? "xlsx" : "csv"}`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            toast.success("Xuất file thành công")
        } catch (error) {
            toast.error("Lỗi khi xuất file")
        }
    }

    // Handle single product actions
    const handleProductAction = async (productId, action) => {
        try {
            let response
            switch (action) {
                case "deactivate":
                    response = await deactivateProduct(productId)
                    break
                case "delete":
                    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
                        response = await deleteProduct(productId)
                    }
                    break
                default:
                    return
            }

            if (response?.success) {
                toast.success(response.message)
                fetchProducts()
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra")
        }
    }

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount)
    }

    // Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("vi-VN")
    }

    // Get stock status
    const getStockStatus = (stock) => {
        if (stock === 0) return { label: "Hết hàng", color: "destructive" }
        if (stock < 10) return { label: "Sắp hết", color: "warning" }
        return { label: "Còn hàng", color: "success" }
    }

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            if (filters.keyword && !product.name.toLowerCase().includes(filters.keyword.toLowerCase())) {
                return false
            }
            if (filters.isActive !== "all" && product.isActive.toString() !== filters.isActive) {
                return false
            }
            return true
        })
    }, [products, filters])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Sản phẩm</h1>
                    <p className="text-gray-600 mt-1">Quản lý toàn bộ sản phẩm trên nền tảng</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => fetchProducts()}>
                        <FiRefreshCw className="w-4 h-4 mr-2" />
                        Làm mới
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <FiDownload className="w-4 h-4 mr-2" />
                                Xuất file
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleExport("excel")}>Xuất Excel</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("csv")}>Xuất CSV</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng sản phẩm</CardTitle>
                        <FiPackage className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Trên toàn nền tảng</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Đang bán</CardTitle>
                        <FiTrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.active.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% tổng số
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ngừng bán</CardTitle>
                        <FiPower className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.inactive.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}% tổng số
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sắp hết hàng</CardTitle>
                        <FiDollarSign className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.lowStock.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Dưới 10 sản phẩm</p>
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
                                placeholder="Tìm kiếm sản phẩm..."
                                value={filters.keyword}
                                onChange={(e) => handleFilterChange("keyword", e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                            />
                        </div>

                        <Select value={filters.isActive} onValueChange={(value) => handleFilterChange("isActive", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="true">Đang bán</SelectItem>
                                <SelectItem value="false">Ngừng bán</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.stockStatus} onValueChange={(value) => handleFilterChange("stockStatus", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tồn kho" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="in-stock">Còn hàng</SelectItem>
                                <SelectItem value="low-stock">Sắp hết</SelectItem>
                                <SelectItem value="out-of-stock">Hết hàng</SelectItem>
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
                                    isActive: "all",
                                    seller: "",
                                    category: "",
                                    priceRange: "",
                                    stockStatus: "all",
                                })
                                fetchProducts()
                            }}
                        >
                            <FiX className="w-4 h-4 mr-2" />
                            Xóa bộ lọc
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
                <Card className="border-pink-200 bg-pink-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">Đã chọn {selectedProducts.length} sản phẩm</span>
                                <Button size="sm" variant="outline" onClick={() => setSelectedProducts([])}>
                                    Bỏ chọn tất cả
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleBulkAction("activate")}>
                                    Kích hoạt
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleBulkAction("deactivate")}>
                                    Vô hiệu hóa
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")}>
                                    Xóa
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Products Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách Sản phẩm</CardTitle>
                    <CardDescription>
                        Hiển thị {filteredProducts.length} / {pagination.total} sản phẩm
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-500">
                                Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} sản
                                phẩm
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

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedProducts(filteredProducts.map((p) => p._id))
                                                } else {
                                                    setSelectedProducts([])
                                                }
                                            }}
                                        />
                                    </TableHead>
                                    <TableHead>Sản phẩm</TableHead>
                                    <TableHead>Shop</TableHead>
                                    <TableHead>Giá</TableHead>
                                    <TableHead>Tồn kho</TableHead>
                                    <TableHead>Đã bán</TableHead>
                                    <TableHead>Đánh giá</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell colSpan={10}>
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
                                ) : filteredProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <FiPackage className="w-8 h-8 text-gray-400" />
                                                <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProducts.map((product) => {
                                        const stockStatus = getStockStatus(product.stock)
                                        return (
                                            <TableRow key={product._id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedProducts.includes(product._id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedProducts((prev) => [...prev, product._id])
                                                            } else {
                                                                setSelectedProducts((prev) => prev.filter((id) => id !== product._id))
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <img
                                                            src={product.images?.[0] || "/placeholder.svg?height=40&width=40"}
                                                            alt={product.name}
                                                            className="w-10 h-10 rounded-md object-cover"
                                                        />
                                                        <div>
                                                            <div className="font-medium text-sm">{product.name}</div>
                                                            <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Avatar className="w-6 h-6">
                                                            <AvatarImage src={product.seller?.avatar || "/placeholder.svg"} />
                                                            <AvatarFallback className="text-xs">{product.seller?.name?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm">{product.seller?.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{formatCurrency(product.price)}</div>
                                                        {product.discount > 0 && <div className="text-xs text-green-600">-{product.discount}%</div>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm">{product.stock}</span>
                                                        <Badge variant={stockStatus.color} className="text-xs">
                                                            {stockStatus.label}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">{product.soldCount || 0}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="text-sm">{product.ratings?.avg?.toFixed(1) || "0.0"}</span>
                                                        <span className="text-xs text-gray-500">({product.ratings?.count || 0})</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={product.isActive ? "success" : "secondary"}>
                                                        {product.isActive ? "Đang bán" : "Ngừng bán"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">{formatDate(product.createdAt)}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <FiMoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => navigate(`/admin/products/${product._id}`)}>
                                                                <FiEye className="w-4 h-4 mr-2" />
                                                                Xem chi tiết
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => navigate(`/admin/products/${product._id}/edit`)}>
                                                                <FiEdit3 className="w-4 h-4 mr-2" />
                                                                Chỉnh sửa
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleProductAction(product._id, "deactivate")}>
                                                                <FiPower className="w-4 h-4 mr-2" />
                                                                {product.isActive ? "Ngừng bán" : "Kích hoạt"}
                                                            </DropdownMenuItem>
                                                            <Separator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleProductAction(product._id, "delete")}
                                                                className="text-red-600"
                                                            >
                                                                <FiTrash2 className="w-4 h-4 mr-2" />
                                                                Xóa vĩnh viễn
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-500">
                                Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} sản
                                phẩm
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
        </div>
    )
}

export default ProductList
