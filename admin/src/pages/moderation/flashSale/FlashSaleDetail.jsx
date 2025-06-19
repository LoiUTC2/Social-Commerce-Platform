"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
    FiArrowLeft,
    FiCalendar,
    FiClock,
    FiTag,
    FiShoppingBag,
    FiDollarSign,
    FiEye,
    FiBarChart2,
    FiEdit,
    FiTrash2,
    FiCheck,
    FiX,
    FiTrendingUp,
} from "react-icons/fi"
import {
    getFlashSaleDetails,
    approveFlashSale,
    rejectFlashSale,
    deleteFlashSale,
} from "../../../services/flashSaleService"
import { format, parseISO, isAfter, isBefore } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
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

const FlashSaleDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [flashSale, setFlashSale] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchFlashSaleDetails()
    }, [id])

    const fetchFlashSaleDetails = async () => {
        setLoading(true)
        try {
            const response = await getFlashSaleDetails(id)
            setFlashSale(response.data)
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết Flash Sale:", error)
            toast.error("Không thể tải thông tin Flash Sale")
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        try {
            await approveFlashSale(id)
            toast.success("Đã duyệt Flash Sale thành công")
            fetchFlashSaleDetails()
        } catch (error) {
            console.error("Lỗi khi duyệt Flash Sale:", error)
            toast.error("Không thể duyệt Flash Sale")
        }
    }

    const handleReject = async () => {
        try {
            await rejectFlashSale(id)
            toast.success("Đã từ chối Flash Sale")
            fetchFlashSaleDetails()
        } catch (error) {
            console.error("Lỗi khi từ chối Flash Sale:", error)
            toast.error("Không thể từ chối Flash Sale")
        }
    }

    const handleDelete = async () => {
        try {
            await deleteFlashSale(id)
            toast.success("Đã xóa Flash Sale thành công")
            navigate("/admin/flash-sales")
        } catch (error) {
            console.error("Lỗi khi xóa Flash Sale:", error)
            toast.error("Không thể xóa Flash Sale")
        }
    }

    const formatDate = (dateString) => {
        return format(parseISO(dateString), "dd/MM/yyyy HH:mm", { locale: vi })
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount)
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
                <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
        )
    }

    if (!flashSale) {
        return (
            <Card className="max-w-md mx-auto mt-8">
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <FiShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy Flash Sale</h3>
                    <p className="text-gray-600 text-center mb-6">Flash Sale này không tồn tại hoặc đã bị xóa.</p>
                    <Button onClick={() => navigate("/admin/flash-sales")} variant="outline">
                        <FiArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại danh sách
                    </Button>
                </CardContent>
            </Card>
        )
    }

    const timeStatus = getTimeStatus(flashSale.startTime, flashSale.endTime)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Button onClick={() => navigate("/admin/flash-sale-approval")} variant="outline" className="w-fit">
                    <FiArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại
                </Button>
                <div className="flex gap-2">
                    <Button
                        onClick={() => navigate(`/admin/flash-sales/edit/${id}`)}
                        className="bg-pink-600 hover:bg-pink-700 text-white"
                    >
                        <FiEdit className="w-4 h-4 mr-2" />
                        Chỉnh sửa
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <FiTrash2 className="w-4 h-4 mr-2" />
                                Xóa
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
                                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                    Xóa
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Banner & Title Section */}
            <Card className="overflow-hidden">
                <div className="relative h-64 bg-gradient-to-br from-pink-500 to-pink-600">
                    {flashSale.banner ? (
                        <img
                            src={flashSale.banner || "/placeholder.svg"}
                            alt={flashSale.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <h1 className="text-white text-3xl font-bold text-center px-6">{flashSale.name}</h1>
                        </div>
                    )}
                    <Badge className={`absolute top-4 right-4 ${timeStatus.className} hover:${timeStatus.className}`}>
                        {timeStatus.label}
                    </Badge>
                </div>
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{flashSale.name}</h1>
                            <div className="flex items-center gap-2">
                                {getStatusBadge(flashSale.approvalStatus)}
                                {flashSale.isFeatured && <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100">Nổi bật</Badge>}
                            </div>
                        </div>
                        {flashSale.approvalStatus === "pending" && (
                            <div className="flex gap-2">
                                <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white">
                                    <FiCheck className="w-4 h-4 mr-2" />
                                    Duyệt Flash Sale
                                </Button>
                                <Button
                                    onClick={handleReject}
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <FiX className="w-4 h-4 mr-2" />
                                    Từ chối
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FiShoppingBag className="w-5 h-5 text-pink-600" />
                                Thông tin chung
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-pink-100 rounded-lg">
                                        <FiCalendar className="w-5 h-5 text-pink-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Thời gian bắt đầu</p>
                                        <p className="font-semibold text-gray-900">{formatDate(flashSale.startTime)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-pink-100 rounded-lg">
                                        <FiClock className="w-5 h-5 text-pink-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Thời gian kết thúc</p>
                                        <p className="font-semibold text-gray-900">{formatDate(flashSale.endTime)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-pink-100 rounded-lg">
                                        <FiShoppingBag className="w-5 h-5 text-pink-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Số lượng sản phẩm</p>
                                        <p className="font-semibold text-gray-900">{flashSale.products?.length || 0}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-pink-100 rounded-lg">
                                        <FiTag className="w-5 h-5 text-pink-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Slug</p>
                                        <p className="font-semibold text-gray-900">{flashSale.slug || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Description */}
                    {flashSale.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Mô tả</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 leading-relaxed">{flashSale.description}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Products Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách sản phẩm ({flashSale.products?.length || 0})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {flashSale.saleProducts && flashSale.saleProducts.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Sản phẩm</TableHead>
                                                <TableHead>Giá gốc</TableHead>
                                                <TableHead>Giá Flash Sale</TableHead>
                                                <TableHead>Giới hạn</TableHead>
                                                <TableHead>Đã bán</TableHead>
                                                <TableHead>Còn lại</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {flashSale.saleProducts.map((product) => (
                                                <TableRow key={product._id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            {product.images && product.images[0] && (
                                                                <img
                                                                    src={product.images[0] || "/placeholder.svg"}
                                                                    alt={product.name}
                                                                    className="w-12 h-12 rounded-lg object-cover"
                                                                />
                                                            )}
                                                            <span className="font-medium text-gray-900 line-clamp-2">{product.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600">{formatCurrency(product.price)}</TableCell>
                                                    <TableCell className="font-semibold text-pink-600">
                                                        {formatCurrency(product.flashSale.salePrice)}
                                                    </TableCell>
                                                    <TableCell>{product.flashSale.stockLimit}</TableCell>
                                                    <TableCell>{product.flashSale.soldCount}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {Math.max(0, product.flashSale.stockLimit - product.flashSale.soldCount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FiShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600">Không có sản phẩm nào trong Flash Sale này.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Statistics */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FiBarChart2 className="w-5 h-5 text-pink-600" />
                                Thống kê
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FiEye className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Lượt xem</p>
                                        <p className="text-2xl font-bold text-gray-900">{flashSale.stats?.totalViews || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <FiTag className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Lượt mua</p>
                                        <p className="text-2xl font-bold text-gray-900">{flashSale.stats?.totalPurchases || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <FiTrendingUp className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Lượt click</p>
                                        <p className="text-2xl font-bold text-gray-900">{flashSale.stats?.totalClicks || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-pink-100 rounded-lg">
                                        <FiDollarSign className="w-5 h-5 text-pink-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Doanh thu</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {formatCurrency(flashSale.stats?.totalRevenue || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thao tác nhanh</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                onClick={() => navigate(`/admin/flash-sales/edit/${id}`)}
                                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                            >
                                <FiEdit className="w-4 h-4 mr-2" />
                                Chỉnh sửa Flash Sale
                            </Button>
                            <Button onClick={() => navigate("/admin/flash-sales")} variant="outline" className="w-full">
                                <FiArrowLeft className="w-4 h-4 mr-2" />
                                Quay lại danh sách
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default FlashSaleDetail
