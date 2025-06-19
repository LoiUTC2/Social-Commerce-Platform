"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Search,
    Eye,
    Edit,
    Trash2,
    MoreHorizontal,
    Store,
    Crown,
    Pause,
    Play,
    RefreshCw,
    X,
    Filter,
    TrendingUp,
    Star,
    Users,
    Package,
} from "lucide-react"
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
import ShopDetailModal from "../../../components/modals/shops/ShopDetailModal"
import ShopEditModal from "../../../components/modals/shops/ShopEditModal"
import ShopStatistics from "../../../components/modals/shops/ShopStatisticsModal"
import AdvancedShopSearchModal from "../../../components/modals/shops/AdvancedShopSearchModal"
import {
    getAllShopsForManagement,
    getShopsOverview,
    suspendShop,
    restoreShop,
    deleteShop,
    updateShopFeatureLevel,
} from "../../../services/shopService"


export default function ShopManagement() {
    const [shops, setShops] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedShops, setSelectedShops] = useState([])
    const [selectedShop, setSelectedShop] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showStatsModal, setShowStatsModal] = useState(false)
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
    const [statistics, setStatistics] = useState(null)

    const [filters, setFilters] = useState({
        search: "",
        status: "all",
        featureLevel: "all",
        isApproved: "all",
        sortBy: "createdAt",
        sortOrder: "desc",
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
        normal: 0,
        premium: 0,
        vip: 0,
    })

    // Fetch shops
    const fetchShops = async () => {
        try {
            setLoading(true)
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, value]) => value !== "all" && value !== ""),
            )

            const response = await getAllShopsForManagement({
                ...cleanFilters,
                page: pagination.page,
                limit: pagination.limit,
            })

            if (response.success) {
                setShops(response.data.shops)
                setPagination(response.data.pagination)
            }
        } catch (error) {
            toast.error("Lỗi khi tải danh sách shop")
            console.error("Error loading shops:", error)
        } finally {
            setLoading(false)
        }
    }

    // Load statistics
    const loadStatistics = async () => {
        try {
            const response = await getShopsOverview()
            if (response.success) {
                setStatistics(response.data)
                const overview = response.data.totalStats
                setStats({
                    total: overview.totalShops,
                    active: overview.activeShops,
                    inactive: overview.inactiveShops,
                    normal: response.data.featureLevelStats.normal,
                    premium: response.data.featureLevelStats.premium,
                    vip: response.data.featureLevelStats.vip,
                })
            }
        } catch (error) {
            console.error("Error loading statistics:", error)
        }
    }

    useEffect(() => {
        fetchShops()
    }, [pagination.page, pagination.limit])

    useEffect(() => {
        loadStatistics()
    }, [])

    // Handle search
    const handleSearch = () => {
        setPagination((prev) => ({ ...prev, page: 1 }))
        fetchShops()
    }

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    // Handle bulk actions
    const handleBulkAction = async (action) => {
        if (selectedShops.length === 0) {
            toast.error("Vui lòng chọn ít nhất một shop")
            return
        }

        if (!window.confirm(`Bạn có chắc chắn muốn ${action} ${selectedShops.length} shop đã chọn?`)) {
            return
        }

        try {
            const promises = selectedShops.map((shopId) => {
                switch (action) {
                    case "suspend":
                        return suspendShop(shopId, "Bulk suspension by admin", 0)
                    case "restore":
                        return restoreShop(shopId, "Bulk restoration by admin")
                    case "delete":
                        return deleteShop(shopId)
                    default:
                        return Promise.resolve()
                }
            })

            await Promise.all(promises)

            toast.success(
                `Đã ${action === "suspend" ? "tạm dừng" : action === "restore" ? "khôi phục" : "xóa"} ${selectedShops.length} shop`,
            )
            setSelectedShops([])
            fetchShops()
        } catch (error) {
            toast.error("Có lỗi xảy ra khi thực hiện thao tác")
        }
    }

    // Handle single shop actions
    const handleShopAction = async (shopId, action, data = {}) => {
        try {
            let response
            switch (action) {
                case "suspend":
                    response = await suspendShop(shopId, data.reason || "Suspended by admin", data.duration || 0)
                    break
                case "restore":
                    response = await restoreShop(shopId, data.note || "Restored by admin")
                    break
                case "delete":
                    if (window.confirm("Bạn có chắc chắn muốn xóa shop này vĩnh viễn?")) {
                        response = await deleteShop(shopId)
                    }
                    break
                case "updateFeatureLevel":
                    response = await updateShopFeatureLevel(shopId, data.featureLevel)
                    break
                default:
                    return
            }

            if (response?.success) {
                toast.success(response.message || "Thao tác thành công")
                fetchShops()
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra")
        }
    }

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    // Get status badge
    const getStatusBadge = (shop) => {
        if (!shop.status.isActive) {
            return (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Tạm dừng
                </Badge>
            )
        }
        if (!shop.status.isApprovedCreate) {
            return (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Chờ duyệt
                </Badge>
            )
        }
        return (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
                Hoạt động
            </Badge>
        )
    }

    // Get feature level badge
    const getFeatureLevelBadge = (level) => {
        const colors = {
            normal: "bg-gray-100 text-gray-800",
            premium: "bg-blue-100 text-blue-800",
            vip: "bg-purple-100 text-purple-800",
        }
        const labels = {
            normal: "Normal",
            premium: "Premium",
            vip: "VIP",
        }
        return (
            <Badge variant="secondary" className={colors[level]}>
                {labels[level]}
            </Badge>
        )
    }

    const filteredShops = useMemo(() => {
        return shops.filter((shop) => {
            if (filters.search) {
                const keyword = filters.search.toLowerCase()
                return shop.name?.toLowerCase().includes(keyword) || shop.owner?.email?.toLowerCase().includes(keyword)
            }
            return true
        })
    }, [shops, filters])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Shop</h1>
                    <p className="text-gray-600 mt-1">Quản lý tất cả shop trên nền tảng</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => fetchShops()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Làm mới
                    </Button>
                    <Button onClick={() => setShowStatsModal(true)} className="bg-pink-600 hover:bg-pink-700">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Thống kê
                    </Button>
                    <Button onClick={() => setShowAdvancedSearch(true)} variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Tìm kiếm nâng cao
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng shop</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Trên toàn nền tảng</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hoạt động</CardTitle>
                        <Play className="h-4 w-4 text-green-600" />
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
                        <CardTitle className="text-sm font-medium">Tạm dừng</CardTitle>
                        <Pause className="h-4 w-4 text-red-600" />
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
                        <CardTitle className="text-sm font-medium">Normal</CardTitle>
                        <Store className="h-4 w-4 text-gray-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-600">{stats.normal.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Gói cơ bản</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Premium</CardTitle>
                        <Star className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.premium.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Gói nâng cao</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">VIP</CardTitle>
                        <Crown className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{stats.vip.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Gói cao cấp</p>
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
                                placeholder="Tìm kiếm shop..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                            />
                        </div>

                        <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="active">Hoạt động</SelectItem>
                                <SelectItem value="inactive">Tạm dừng</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.featureLevel} onValueChange={(value) => handleFilterChange("featureLevel", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Gói dịch vụ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="vip">VIP</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button onClick={handleSearch} className="bg-pink-600 hover:bg-pink-700">
                            <Search className="w-4 h-4 mr-2" />
                            Tìm kiếm
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                setFilters({
                                    search: "",
                                    status: "all",
                                    featureLevel: "all",
                                    isApproved: "all",
                                    sortBy: "createdAt",
                                    sortOrder: "desc",
                                })
                                fetchShops()
                            }}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Xóa bộ lọc
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedShops.length > 0 && (
                <Card className="border-pink-200 bg-pink-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">Đã chọn {selectedShops.length} shop</span>
                                <Button size="sm" variant="outline" onClick={() => setSelectedShops([])}>
                                    Bỏ chọn tất cả
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleBulkAction("suspend")}>
                                    Tạm dừng
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleBulkAction("restore")}>
                                    Khôi phục
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")}>
                                    Xóa
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Shops Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách Shop</CardTitle>
                    <CardDescription>
                        Hiển thị {filteredShops.length} / {pagination.total} shop
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedShops.length === filteredShops.length && filteredShops.length > 0}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedShops(filteredShops.map((s) => s._id))
                                                } else {
                                                    setSelectedShops([])
                                                }
                                            }}
                                        />
                                    </TableHead>
                                    <TableHead>Shop</TableHead>
                                    <TableHead>Chủ shop</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Gói dịch vụ</TableHead>
                                    <TableHead>Thống kê</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell colSpan={8}>
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
                                ) : filteredShops.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <Store className="w-8 h-8 text-gray-400" />
                                                <p className="text-gray-500">Không tìm thấy shop nào</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredShops.map((shop) => (
                                        <TableRow key={shop._id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedShops.includes(shop._id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedShops((prev) => [...prev, shop._id])
                                                        } else {
                                                            setSelectedShops((prev) => prev.filter((id) => id !== shop._id))
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarImage src={shop.avatar || "/placeholder.svg"} />
                                                        <AvatarFallback className="bg-pink-100 text-pink-600">
                                                            {shop.name?.[0] || "S"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium text-sm">{shop.name || "Chưa có tên"}</div>
                                                        <div className="text-xs text-gray-500">@{shop.slug}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {shop.additionalStats?.productCount || 0} sản phẩm
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Avatar className="w-6 h-6">
                                                        <AvatarImage src={shop.owner?.avatar || "/placeholder.svg"} />
                                                        <AvatarFallback className="text-xs">{shop.owner?.fullName?.[0] || "U"}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="text-sm font-medium">{shop.owner?.fullName || "Unknown"}</div>
                                                        <div className="text-xs text-gray-500">{shop.owner?.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(shop)}</TableCell>
                                            <TableCell>{getFeatureLevelBadge(shop.status?.featureLevel || "normal")}</TableCell>
                                            <TableCell>
                                                <div className="space-y-1 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-3 h-3 text-yellow-500" />
                                                        <span>{shop.stats?.rating?.avg?.toFixed(1) || "0.0"}</span>
                                                        <span className="text-gray-500">({shop.stats?.rating?.count || 0})</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-3 h-3 text-blue-500" />
                                                        <span>{shop.additionalStats?.followersCount || 0} followers</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Package className="w-3 h-3 text-green-500" />
                                                        <span>{shop.stats?.orderCount || 0} đơn hàng</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{formatDate(shop.createdAt)}</div>
                                                <div className="text-xs text-gray-500">
                                                    {Math.floor((Date.now() - new Date(shop.createdAt).getTime()) / (1000 * 60 * 60 * 24))} ngày
                                                    trước
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedShop(shop)
                                                                setShowDetailModal(true)
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Xem chi tiết
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedShop(shop)
                                                                setShowEditModal(true)
                                                            }}
                                                        >
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Chỉnh sửa
                                                        </DropdownMenuItem>
                                                        <Separator />
                                                        {shop.status?.isActive ? (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleShopAction(shop._id, "suspend", {
                                                                        reason: "Suspended by admin",
                                                                        duration: 0,
                                                                    })
                                                                }
                                                            >
                                                                <Pause className="w-4 h-4 mr-2" />
                                                                Tạm dừng
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onClick={() => handleShopAction(shop._id, "restore", { note: "Restored by admin" })}
                                                            >
                                                                <Play className="w-4 h-4 mr-2" />
                                                                Khôi phục
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleShopAction(shop._id, "updateFeatureLevel", {
                                                                    featureLevel: shop.status?.featureLevel === "vip" ? "normal" : "premium",
                                                                })
                                                            }
                                                        >
                                                            <Crown className="w-4 h-4 mr-2" />
                                                            Nâng cấp gói
                                                        </DropdownMenuItem>
                                                        <Separator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleShopAction(shop._id, "delete")}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Xóa vĩnh viễn
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
                                {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} shop
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

            {/* Modals */}
            {selectedShop && (
                <>
                    <ShopDetailModal shop={selectedShop} open={showDetailModal} onOpenChange={setShowDetailModal} />
                    <ShopEditModal
                        shop={selectedShop}
                        open={showEditModal}
                        onOpenChange={setShowEditModal}
                        onSuccess={() => {
                            fetchShops()
                            setShowEditModal(false)
                        }}
                    />
                </>
            )}

            <ShopStatistics open={showStatsModal} onOpenChange={setShowStatsModal} statistics={statistics} />

            <AdvancedShopSearchModal
                open={showAdvancedSearch}
                onOpenChange={setShowAdvancedSearch}
                onSearch={(searchParams) => {
                    setFilters((prev) => ({ ...prev, ...searchParams }))
                    setPagination((prev) => ({ ...prev, page: 1 }))
                    setShowAdvancedSearch(false)
                    fetchShops()
                }}
            />
        </div>
    )
}
