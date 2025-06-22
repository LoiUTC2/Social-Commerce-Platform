"use client"

import { useState, useEffect } from "react"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Card, CardContent } from "../../../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "../../../../components/ui/pagination"
import { Badge } from "../../../../components/ui/badge"
import { Checkbox } from "../../../../components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu"
import { DatePickerWithRange } from "../../../../components/ui/date-range-picker"
import {
    Zap,
    Search,
    Plus,
    RefreshCw,
    Eye,
    Edit,
    Trash2,
    MoreVertical,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp,
    DollarSign,
    Package,
    BarChart3,
    Calendar,
    ImageIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "../../../../contexts/AuthContext"
import CreateFlashSaleModal from "./CreateFlashSaleModal"
import EditFlashSaleModal from "./EditFlashSaleModal"
import FlashSaleDetailModal from "./FlashSaleDetailModal"
import DeleteConfirmModal from "./DeleteConfirmModal"
import { getMyFlashSales, softDeleteFlashSale, hardDeleteFlashSale } from "../../../../services/flashSaleService"

// Format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount)
}

// Format date
const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    })
}

// Flash Sale status mapping
const flashSaleStatuses = {
    upcoming: { label: "Sắp diễn ra", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock },
    active: { label: "Đang diễn ra", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
    ended: { label: "Đã kết thúc", color: "bg-gray-100 text-gray-800 border-gray-200", icon: XCircle },
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
}

// Approval status mapping
const approvalStatuses = {
    pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    approved: { label: "Đã duyệt", color: "bg-green-100 text-green-800", icon: CheckCircle },
    rejected: { label: "Bị từ chối", color: "bg-red-100 text-red-800", icon: XCircle },
}

// Get flash sale status based on time
const getFlashSaleStatus = (flashSale) => {
    const now = new Date()
    const startTime = new Date(flashSale.startTime)
    const endTime = new Date(flashSale.endTime)

    if (!flashSale.isActive) return "cancelled"
    if (now < startTime) return "upcoming"
    if (now >= startTime && now <= endTime) return "active"
    return "ended"
}

export default function FlashSales() {
    const { user, setShowLoginModal } = useAuth()
    const [selectedFlashSales, setSelectedFlashSales] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("all")
    const [filterApproval, setFilterApproval] = useState("all")
    const [dateRange, setDateRange] = useState(null)
    const [flashSales, setFlashSales] = useState([])
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    })
    const [loading, setLoading] = useState(false)

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedFlashSale, setSelectedFlashSale] = useState(null)
    const [deleteType, setDeleteType] = useState("soft") // 'soft' or 'hard'

    // Statistics
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        upcoming: 0,
        ended: 0,
        totalRevenue: 0,
        totalViews: 0,
        totalPurchases: 0,
        conversionRate: 0,
    })

    // Fetch flash sales
    const fetchFlashSales = async (page = 1) => {
        if (!user) return setShowLoginModal(true)
        setLoading(true)
        try {
            const response = await getMyFlashSales(page, pagination.limit)

            if (response.success) {
                let flashSalesData = response.data.items || []

                // Apply filters
                if (searchQuery) {
                    flashSalesData = flashSalesData.filter(
                        (fs) =>
                            fs.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            fs.description?.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                }

                if (filterStatus !== "all") {
                    flashSalesData = flashSalesData.filter((fs) => getFlashSaleStatus(fs) === filterStatus)
                }

                if (filterApproval !== "all") {
                    flashSalesData = flashSalesData.filter((fs) => fs.approvalStatus === filterApproval)
                }

                if (dateRange?.from && dateRange?.to) {
                    flashSalesData = flashSalesData.filter((fs) => {
                        const startTime = new Date(fs.startTime)
                        return startTime >= dateRange.from && startTime <= dateRange.to
                    })
                }

                setFlashSales(flashSalesData)
                setPagination({
                    page: response.data.pagination.page,
                    limit: response.data.pagination.limit,
                    total: response.data.pagination.total,
                    totalPages: response.data.pagination.totalPages,
                })

                // Calculate stats
                calculateStats(flashSalesData)
            } else {
                throw new Error(response.message || "Không thể lấy danh sách Flash Sale")
            }
        } catch (error) {
            toast.error("Lỗi", { description: error.message || "Không thể lấy danh sách Flash Sale." })
            console.error("Lỗi khi lấy Flash Sale:", error)
        } finally {
            setLoading(false)
        }
    }

    // Calculate statistics
    const calculateStats = (flashSalesData) => {
        const stats = {
            total: flashSalesData.length,
            active: 0,
            upcoming: 0,
            ended: 0,
            totalRevenue: 0,
            totalViews: 0,
            totalPurchases: 0,
            conversionRate: 0,
        }

        flashSalesData.forEach((fs) => {
            const status = getFlashSaleStatus(fs)
            stats[status] = (stats[status] || 0) + 1
            stats.totalRevenue += fs.stats?.totalRevenue || 0
            stats.totalViews += fs.stats?.totalViews || 0
            stats.totalPurchases += fs.stats?.totalPurchases || 0
        })

        stats.conversionRate = stats.totalViews > 0 ? (stats.totalPurchases / stats.totalViews) * 100 : 0

        setStats(stats)
    }

    useEffect(() => {
        fetchFlashSales(pagination.page)
    }, [pagination.page, filterStatus, filterApproval, searchQuery, dateRange])

    // Handle refresh
    const handleRefresh = () => {
        fetchFlashSales(pagination.page)
        toast.info("Đã làm mới danh sách Flash Sale.")
    }

    // Handle delete
    const handleDelete = async (flashSale, type = "soft") => {
        setSelectedFlashSale(flashSale)
        setDeleteType(type)
        setShowDeleteModal(true)
    }

    const confirmDelete = async () => {
        try {
            const response =
                deleteType === "soft"
                    ? await softDeleteFlashSale(selectedFlashSale._id)
                    : await hardDeleteFlashSale(selectedFlashSale._id)

            if (response.success) {
                toast.success("Thành công", {
                    description: `${deleteType === "soft" ? "Ẩn" : "Xóa"} Flash Sale thành công.`,
                })
                fetchFlashSales(pagination.page)
            } else {
                throw new Error(response.message)
            }
        } catch (error) {
            toast.error("Lỗi", { description: error.message || "Không thể xóa Flash Sale." })
        } finally {
            setShowDeleteModal(false)
            setSelectedFlashSale(null)
        }
    }

    // Handle selection
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedFlashSales(flashSales.map((fs) => fs._id))
        } else {
            setSelectedFlashSales([])
        }
    }

    const handleSelectFlashSale = (flashSaleId) => {
        setSelectedFlashSales((prev) =>
            prev.includes(flashSaleId) ? prev.filter((id) => id !== flashSaleId) : [...prev, flashSaleId],
        )
    }

    // Handle page change
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination((prev) => ({ ...prev, page: newPage }))
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Zap className="w-6 h-6 text-pink-500" /> Quản lý Flash Sale
                </h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Làm mới
                    </Button>
                    <Button className="bg-pink-500 hover:bg-pink-600" onClick={() => setShowCreateModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tạo Flash Sale
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                <Card className="bg-gradient-to-r from-pink-50 to-pink-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-pink-700">{stats.total}</div>
                                <div className="text-sm text-pink-600">Tổng Flash Sale</div>
                            </div>
                            <Zap className="w-8 h-8 text-pink-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-50 to-green-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-green-700">{stats.active}</div>
                                <div className="text-sm text-green-600">Đang diễn ra</div>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-blue-700">{stats.upcoming}</div>
                                <div className="text-sm text-blue-600">Sắp diễn ra</div>
                            </div>
                            <Clock className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-gray-700">{stats.ended}</div>
                                <div className="text-sm text-gray-600">Đã kết thúc</div>
                            </div>
                            <XCircle className="w-8 h-8 text-gray-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-lg font-bold text-purple-700">
                                    {formatCurrency(stats.totalRevenue).replace("₫", "").trim()}₫
                                </div>
                                <div className="text-sm text-purple-600">Doanh thu</div>
                            </div>
                            <DollarSign className="w-8 h-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-orange-700">{stats.totalViews}</div>
                                <div className="text-sm text-orange-600">Lượt xem</div>
                            </div>
                            <Eye className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-teal-50 to-teal-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-teal-700">{stats.totalPurchases}</div>
                                <div className="text-sm text-teal-600">Lượt mua</div>
                            </div>
                            <Package className="w-8 h-8 text-teal-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-indigo-700">{stats.conversionRate.toFixed(1)}%</div>
                                <div className="text-sm text-indigo-600">Tỷ lệ chuyển đổi</div>
                            </div>
                            <BarChart3 className="w-8 h-8 text-indigo-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Tìm kiếm theo tên Flash Sale..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    {Object.entries(flashSaleStatuses).map(([key, status]) => (
                                        <SelectItem key={key} value={key}>
                                            <div className="flex items-center gap-2">
                                                <status.icon className="w-3 h-3" />
                                                {status.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filterApproval} onValueChange={setFilterApproval}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Phê duyệt" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    {Object.entries(approvalStatuses).map(([key, status]) => (
                                        <SelectItem key={key} value={key}>
                                            <div className="flex items-center gap-2">
                                                <status.icon className="w-3 h-3" />
                                                {status.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} className="w-[280px]" />
                        </div>
                    </div>

                    {selectedFlashSales.length > 0 && (
                        <div className="mt-4 flex items-center gap-2 p-3 bg-pink-50 rounded-lg border border-pink-200">
                            <span className="text-sm font-medium mr-2">Đã chọn {selectedFlashSales.length} Flash Sale</span>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4 mr-1" />
                                Xóa đã chọn
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Flash Sales Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <Checkbox
                                            checked={flashSales.length > 0 && flashSales.every((fs) => selectedFlashSales.includes(fs._id))}
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Chọn tất cả"
                                        />
                                    </TableHead>
                                    <TableHead>Flash Sale</TableHead>
                                    <TableHead>Sản phẩm</TableHead>
                                    <TableHead>Thời gian</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Phê duyệt</TableHead>
                                    <TableHead>Thống kê</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mr-2"></div>
                                                Đang tải...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : flashSales.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <div className="flex flex-col items-center justify-center text-gray-500">
                                                <Zap className="w-12 h-12 mb-2 opacity-20" />
                                                <p>Chưa có Flash Sale nào</p>
                                                <Button className="mt-2 bg-pink-500 hover:bg-pink-600" onClick={() => setShowCreateModal(true)}>
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Tạo Flash Sale đầu tiên
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    flashSales.map((flashSale) => {
                                        const status = getFlashSaleStatus(flashSale)
                                        const statusInfo = flashSaleStatuses[status]
                                        const approvalInfo = approvalStatuses[flashSale.approvalStatus]

                                        return (
                                            <TableRow key={flashSale._id} className="hover:bg-gray-50">
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedFlashSales.includes(flashSale._id)}
                                                        onCheckedChange={() => handleSelectFlashSale(flashSale._id)}
                                                        aria-label={`Chọn ${flashSale.name}`}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                            {flashSale.banner ? (
                                                                <img
                                                                    src={flashSale.banner || "/placeholder.svg"}
                                                                    alt={flashSale.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-semibold text-gray-900 truncate">{flashSale.name}</div>
                                                            <div className="text-sm text-gray-500 line-clamp-2">
                                                                {flashSale.description || "Không có mô tả"}
                                                            </div>
                                                            {flashSale.isFeatured && (
                                                                <Badge className="mt-1 bg-yellow-100 text-yellow-800">
                                                                    <TrendingUp className="w-3 h-3 mr-1" />
                                                                    Nổi bật
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <div className="font-medium">{flashSale.products?.length || 0} sản phẩm</div>
                                                        <div className="text-gray-500">
                                                            Đã bán: {flashSale.products?.reduce((sum, p) => sum + (p.soldCount || 0), 0) || 0}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <div className="flex items-center gap-1 text-green-600">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(flashSale.startTime)}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-red-600 mt-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(flashSale.endTime)}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={statusInfo.color}>
                                                        <statusInfo.icon className="w-3 h-3 mr-1" />
                                                        {statusInfo.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={approvalInfo.color}>
                                                        <approvalInfo.icon className="w-3 h-3 mr-1" />
                                                        {approvalInfo.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm space-y-1">
                                                        <div className="flex items-center gap-1">
                                                            <Eye className="w-3 h-3 text-gray-400" />
                                                            <span>{flashSale.stats?.totalViews || 0}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Package className="w-3 h-3 text-gray-400" />
                                                            <span>{flashSale.stats?.totalPurchases || 0}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <DollarSign className="w-3 h-3 text-gray-400" />
                                                            <span className="text-pink-600 font-medium">
                                                                {formatCurrency(flashSale.stats?.totalRevenue || 0)
                                                                    .replace("₫", "")
                                                                    .trim()}
                                                                ₫
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedFlashSale(flashSale)
                                                                    setShowDetailModal(true)
                                                                }}
                                                            >
                                                                <Eye className="w-4 h-4 mr-2" /> Xem chi tiết
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedFlashSale(flashSale)
                                                                    setShowEditModal(true)
                                                                }}
                                                            >
                                                                <Edit className="w-4 h-4 mr-2" /> Chỉnh sửa
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(flashSale, "soft")}
                                                                className="text-orange-600"
                                                            >
                                                                <AlertCircle className="w-4 h-4 mr-2" /> Ẩn Flash Sale
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(flashSale, "hard")}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" /> Xóa vĩnh viễn
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
                        <div className="p-4 border-t">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                                    {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total}{" "}
                                    Flash Sale
                                </div>
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() => handlePageChange(pagination.page - 1)}
                                                className={pagination.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                            />
                                        </PaginationItem>
                                        {[...Array(pagination.totalPages)].map((_, index) => {
                                            const page = index + 1
                                            if (
                                                page === 1 ||
                                                page === pagination.totalPages ||
                                                (page >= pagination.page - 1 && page <= pagination.page + 1)
                                            ) {
                                                return (
                                                    <PaginationItem key={page}>
                                                        <PaginationLink
                                                            onClick={() => handlePageChange(page)}
                                                            isActive={pagination.page === page}
                                                            className="cursor-pointer"
                                                        >
                                                            {page}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                )
                                            }
                                            if (
                                                (page === pagination.page - 2 && pagination.page > 3) ||
                                                (page === pagination.page + 2 && pagination.page < pagination.totalPages - 2)
                                            ) {
                                                return (
                                                    <PaginationItem key={page}>
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                )
                                            }
                                            return null
                                        })}
                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => handlePageChange(pagination.page + 1)}
                                                className={
                                                    pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                                                }
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            <CreateFlashSaleModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    setShowCreateModal(false)
                    fetchFlashSales(pagination.page)
                }}
            />

            <EditFlashSaleModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false)
                    setSelectedFlashSale(null)
                }}
                flashSale={selectedFlashSale}
                onSuccess={() => {
                    setShowEditModal(false)
                    setSelectedFlashSale(null)
                    fetchFlashSales(pagination.page)
                }}
            />

            <FlashSaleDetailModal
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false)
                    setSelectedFlashSale(null)
                }}
                flashSale={selectedFlashSale}
            />

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false)
                    setSelectedFlashSale(null)
                }}
                onConfirm={confirmDelete}
                title={deleteType === "soft" ? "Ẩn Flash Sale" : "Xóa Flash Sale"}
                description={
                    deleteType === "soft"
                        ? `Bạn có chắc chắn muốn ẩn Flash Sale "${selectedFlashSale?.name}"? Flash Sale sẽ không hiển thị với khách hàng nhưng vẫn có thể khôi phục.`
                        : `Bạn có chắc chắn muốn xóa vĩnh viễn Flash Sale "${selectedFlashSale?.name}"? Hành động này không thể hoàn tác.`
                }
                confirmText={deleteType === "soft" ? "Ẩn Flash Sale" : "Xóa vĩnh viễn"}
                variant={deleteType === "soft" ? "default" : "destructive"}
            />
        </div>
    )
}
