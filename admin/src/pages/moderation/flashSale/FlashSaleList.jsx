"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FiPlus, FiSearch, FiCalendar, FiClock, FiTag, FiShoppingBag, FiEye, FiEdit, FiTrash2 } from "react-icons/fi"
import { getFlashSales, approveFlashSale, rejectFlashSale, deleteFlashSale } from "../../../services/flashSaleService"
import { format, isAfter, isBefore, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import { Card, CardContent } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../../../components/ui/alert-dialog"

const FlashSaleList = () => {
    const navigate = useNavigate()
    const [flashSales, setFlashSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    })

    useEffect(() => {
        fetchFlashSales()
    }, [filter, pagination.page])

    const fetchFlashSales = async () => {
        setLoading(true)
        try {
            const approvalStatus = filter === "all" ? "" : filter
            const response = await getFlashSales(approvalStatus, pagination.page, pagination.limit)

            if (response.success) {
                setFlashSales(response.data.items)
                setPagination(response.data.pagination)
            } else {
                toast.error("Không thể tải danh sách Flash Sale")
            }
        } catch (error) {
            console.error("Lỗi khi lấy danh sách Flash Sale:", error)
            toast.error("Có lỗi xảy ra khi tải dữ liệu")
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (id, name) => {
        try {
            const response = await approveFlashSale(id)
            if (response.success) {
                toast.success(`Đã duyệt Flash Sale "${name}"`)
                fetchFlashSales()
            } else {
                toast.error("Không thể duyệt Flash Sale")
            }
        } catch (error) {
            console.error("Lỗi khi duyệt Flash Sale:", error)
            toast.error("Có lỗi xảy ra khi duyệt Flash Sale")
        }
    }

    const handleReject = async (id, name) => {
        try {
            const response = await rejectFlashSale(id)
            if (response.success) {
                toast.success(`Đã từ chối Flash Sale "${name}"`)
                fetchFlashSales()
            } else {
                toast.error("Không thể từ chối Flash Sale")
            }
        } catch (error) {
            console.error("Lỗi khi từ chối Flash Sale:", error)
            toast.error("Có lỗi xảy ra khi từ chối Flash Sale")
        }
    }

    const handleDelete = async (id, name) => {
        try {
            const response = await deleteFlashSale(id)
            if (response.success) {
                toast.success(`Đã xóa Flash Sale "${name}"`)
                fetchFlashSales()
            } else {
                toast.error("Không thể xóa Flash Sale")
            }
        } catch (error) {
            console.error("Lỗi khi xóa Flash Sale:", error)
            toast.error("Có lỗi xảy ra khi xóa Flash Sale")
        }
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case "approved":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Đã duyệt</Badge>
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Chờ duyệt</Badge>
            case "rejected":
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Đã từ chối</Badge>
            default:
                return <Badge variant="secondary">Không xác định</Badge>
        }
    }

    const getTimeStatus = (startTime, endTime) => {
        const now = new Date()
        const start = parseISO(startTime)
        const end = parseISO(endTime)

        if (isBefore(now, start)) {
            return { status: "upcoming", label: "Sắp diễn ra", className: "bg-blue-100 text-blue-800" }
        } else if (isAfter(now, end)) {
            return { status: "ended", label: "Đã kết thúc", className: "bg-gray-100 text-gray-800" }
        } else {
            return { status: "active", label: "Đang diễn ra", className: "bg-pink-100 text-pink-800" }
        }
    }

    const formatDate = (dateString) => {
        return format(parseISO(dateString), "dd/MM/yyyy HH:mm", { locale: vi })
    }

    const filteredFlashSales = flashSales.filter((sale) => sale.name.toLowerCase().includes(searchTerm.toLowerCase()))

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
                <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Flash Sale</h1>
                    <p className="text-gray-600 mt-1">Quản lý các chương trình Flash Sale trên nền tảng HULO</p>
                </div>
                <Button
                    onClick={() => navigate("/admin/flash-sales/create")}
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Tạo Flash Sale
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Tìm kiếm Flash Sale..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Filter Tabs */}
                        <Tabs value={filter} onValueChange={setFilter} className="w-full lg:w-auto">
                            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                                <TabsTrigger value="all" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
                                    Tất cả
                                </TabsTrigger>
                                <TabsTrigger value="pending" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
                                    Chờ duyệt
                                </TabsTrigger>
                                <TabsTrigger
                                    value="approved"
                                    className="data-[state=active]:bg-pink-600 data-[state=active]:text-white"
                                >
                                    Đã duyệt
                                </TabsTrigger>
                                <TabsTrigger
                                    value="rejected"
                                    className="data-[state=active]:bg-pink-600 data-[state=active]:text-white"
                                >
                                    Đã từ chối
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>

            {/* Content */}
            <div className="min-h-[calc(100vh-300px)]">
                {filteredFlashSales.length === 0 ? (
                    <Card className="h-full">
                        <CardContent className="flex flex-col items-center justify-center py-16 px-6 min-h-[600px]">
                            <FiShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Không có Flash Sale nào</h3>
                            <p className="text-gray-600 text-center mb-6 max-w-md">
                                Chưa có chương trình Flash Sale nào trong hệ thống hoặc phù hợp với bộ lọc.
                            </p>
                            <Button
                                onClick={() => navigate("/admin/flash-sales/create")}
                                className="bg-pink-600 hover:bg-pink-700 text-white"
                            >
                                <FiPlus className="w-4 h-4 mr-2" />
                                Tạo Flash Sale mới
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Flash Sale Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredFlashSales.map((flashSale) => {
                                const timeStatus = getTimeStatus(flashSale.startTime, flashSale.endTime)
                                return (
                                    <Card key={flashSale._id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                                        {/* Banner */}
                                        <div className="relative h-48 bg-gradient-to-br from-pink-500 to-pink-600">
                                            {flashSale.banner ? (
                                                <img
                                                    src={flashSale.banner || "/placeholder.svg"}
                                                    alt={flashSale.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <h3 className="text-white text-xl font-bold text-center px-4">{flashSale.name}</h3>
                                                </div>
                                            )}
                                            <Badge className={`absolute top-3 right-3 ${timeStatus.className} hover:${timeStatus.className}`}>
                                                {timeStatus.label}
                                            </Badge>
                                        </div>

                                        <CardContent className="p-6">
                                            {/* Title */}
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">{flashSale.name}</h3>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <FiShoppingBag className="w-4 h-4 mr-1" />
                                                    <span>{flashSale.products?.length || 0} sản phẩm</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <FiTag className="w-4 h-4 mr-1" />
                                                    <span>{flashSale.stats?.totalPurchases || 0} lượt mua</span>
                                                </div>
                                            </div>

                                            {/* Dates */}
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <FiCalendar className="w-4 h-4 mr-2" />
                                                    <span className="font-medium mr-2">Bắt đầu:</span>
                                                    <span>{formatDate(flashSale.startTime)}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <FiClock className="w-4 h-4 mr-2" />
                                                    <span className="font-medium mr-2">Kết thúc:</span>
                                                    <span>{formatDate(flashSale.endTime)}</span>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="flex items-center gap-2 mb-4">
                                                {getStatusBadge(flashSale.approvalStatus)}
                                                {flashSale.isFeatured && (
                                                    <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100">Nổi bật</Badge>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/admin/flash-sales/${flashSale._id}`)}
                                                    className="flex-1"
                                                >
                                                    <FiEye className="w-4 h-4 mr-1" />
                                                    Chi tiết
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/admin/flash-sales/edit/${flashSale._id}`)}
                                                    className="flex-1"
                                                >
                                                    <FiEdit className="w-4 h-4 mr-1" />
                                                    Sửa
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Bạn có chắc chắn muốn xóa Flash Sale "{flashSale.name}"? Hành động này không thể hoàn tác.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(flashSale._id, flashSale.name)}
                                                                className="bg-red-600 hover:bg-red-700"
                                                            >
                                                                Xóa
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>

                                            {/* Approval Actions */}
                                            {flashSale.approvalStatus === "pending" && (
                                                <div className="flex gap-2 pt-4 border-t">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprove(flashSale._id, flashSale.name)}
                                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        Duyệt
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleReject(flashSale._id, flashSale.name)}
                                                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        Từ chối
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <Card>
                                <CardContent className="flex items-center justify-between p-6">
                                    <div className="text-sm text-gray-600">
                                        Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                                        {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} kết
                                        quả
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page === 1}
                                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                        >
                                            Trước
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                const pageNum = i + 1
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={pagination.page === pageNum ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setPagination({ ...pagination, page: pageNum })}
                                                        className={pagination.page === pageNum ? "bg-pink-600 hover:bg-pink-700" : ""}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page === pagination.totalPages}
                                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                        >
                                            Sau
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default FlashSaleList
