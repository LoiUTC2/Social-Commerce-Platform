"use client"

import { useState, useEffect } from "react"
import { FiSearch, FiEye, FiCheck, FiX, FiShoppingBag, FiUser, FiCalendar, FiAlertTriangle } from "react-icons/fi"
import { toast } from "sonner"
import { getAllShops, approveDeleteShop, rejectDeleteShop, getShopDetails } from "../../../services/shopService"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../../components/ui/dialog"
import { Textarea } from "../../../components/ui/textarea"
import { ScrollArea } from "../../../components/ui/scroll-area"
import { Separator } from "../../../components/ui/separator"
import { Alert, AlertDescription } from "../../../components/ui/alert"

const ShopDeleteApproval = () => {
    const [shops, setShops] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedShop, setSelectedShop] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showApprovalModal, setShowApprovalModal] = useState(false)
    const [approvalType, setApprovalType] = useState("") // "approve" or "reject"
    const [approvalNote, setApprovalNote] = useState("")
    const [processingShopId, setProcessingShopId] = useState(null)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    })
    const [filters, setFilters] = useState({
        deleteStatus: "pending",
    })

    useEffect(() => {
        fetchShops()
    }, [pagination.page, filters])

    const fetchShops = async () => {
        setLoading(true)
        try {
            const response = await getAllShops(filters, pagination.page, pagination.limit)
            if (response.success) {
                setShops(response.data.shops)
                setPagination((prev) => ({ ...prev, ...response.data.pagination }))
            }
        } catch (error) {
            console.error("Error fetching shops:", error)
            toast.error("Không thể tải danh sách shop")
        } finally {
            setLoading(false)
        }
    }

    const handleViewDetails = async (shopId) => {
        try {
            const response = await getShopDetails(shopId)
            if (response.success) {
                setSelectedShop(response.data)
                setShowDetailModal(true)
            }
        } catch (error) {
            console.error("Error fetching shop details:", error)
            toast.error("Không thể tải thông tin chi tiết shop")
        }
    }

    const handleApprovalAction = (shopId, type) => {
        setProcessingShopId(shopId)
        setApprovalType(type)
        setApprovalNote("")
        setShowApprovalModal(true)
    }

    const handleConfirmApproval = async () => {
        if (!processingShopId || !approvalType) return

        try {
            let response
            if (approvalType === "approve") {
                response = await approveDeleteShop(processingShopId, approvalNote)
                toast.success("Đã duyệt xóa shop thành công!")
            } else {
                response = await rejectDeleteShop(processingShopId, approvalNote)
                toast.success("Đã từ chối xóa shop thành công!")
            }

            if (response.success) {
                // Refresh danh sách
                fetchShops()
                setShowApprovalModal(false)
                setProcessingShopId(null)
                setApprovalNote("")
            }
        } catch (error) {
            console.error("Error processing approval:", error)
            toast.error(`Lỗi khi ${approvalType === "approve" ? "duyệt xóa" : "từ chối xóa"} shop`)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const filteredShops = shops.filter(
        (shop) =>
            shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shop.owner?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shop.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Duyệt Xóa Shop</h1>
                    <p className="text-gray-600 mt-1">Quản lý và duyệt các yêu cầu xóa shop</p>
                </div>
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-lg px-3 py-1 border-red-200 text-red-700">
                        {pagination.total} shop chờ duyệt xóa
                    </Badge>
                </div>
            </div>

            {/* Warning Alert */}
            <Alert className="border-red-200 bg-red-50">
                <FiAlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                    <strong>Cảnh báo:</strong> Việc duyệt xóa shop sẽ xóa vĩnh viễn shop khỏi hệ thống và không thể khôi phục. Vui
                    lòng kiểm tra kỹ trước khi thực hiện.
                </AlertDescription>
            </Alert>

            {/* Filter Tabs */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Button
                            variant={filters.deleteStatus === "pending" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilters({ ...filters, deleteStatus: "pending" })}
                            className={filters.deleteStatus === "pending" ? "bg-pink-600 hover:bg-pink-700" : ""}
                        >
                            Chờ duyệt xóa ({shops.filter((s) => s.status?.approvalDeleteStatus === "pending").length})
                        </Button>
                        <Button
                            variant={filters.deleteStatus === "approved" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilters({ ...filters, deleteStatus: "approved" })}
                            className={filters.deleteStatus === "approved" ? "bg-red-600 hover:bg-red-700" : ""}
                        >
                            Đã duyệt xóa
                        </Button>
                        <Button
                            variant={filters.deleteStatus === "rejected" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilters({ ...filters, deleteStatus: "rejected" })}
                            className={filters.deleteStatus === "rejected" ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                            Đã từ chối xóa
                        </Button>
                    </div>
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Tìm kiếm theo tên shop, tên chủ shop hoặc email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Shop List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FiShoppingBag className="w-5 h-5" />
                        {filters.deleteStatus === "pending" && "Danh sách Shop Chờ Duyệt Xóa"}
                        {filters.deleteStatus === "approved" && "Danh sách Shop Đã Duyệt Xóa"}
                        {filters.deleteStatus === "rejected" && "Danh sách Shop Đã Từ Chối Xóa"}
                        {/* Optional: Add a default title if no filter is active or for an "All" state */}
                        {!filters.deleteStatus && "Danh sách Tất Cả Shop"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                            <span className="ml-2 text-gray-600">Đang tải...</span>
                        </div>
                    ) : filteredShops.length === 0 ? (
                        <div className="text-center py-12">
                            <FiShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Không có shop nào chờ duyệt xóa</h3>
                            <p className="text-gray-600">Tất cả các yêu cầu xóa shop đã được xử lý</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredShops.map((shop) => (
                                <div
                                    key={shop._id}
                                    className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${shop.status?.approvalDeleteStatus === "pending"
                                            ? "border-red-200 bg-red-50/30"
                                            : shop.status?.approvalDeleteStatus === "approved"
                                                ? "border-gray-200 bg-gray-50/30 opacity-75"
                                                : "border-green-200 bg-green-50/30"
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            {/* Shop Avatar */}
                                            <Avatar className="w-16 h-16 opacity-75">
                                                <AvatarImage src={shop.avatar || shop.logo} alt={shop.name} />
                                                <AvatarFallback className="bg-red-100 text-red-600 text-lg font-semibold">
                                                    {shop.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            {/* Shop Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-xl font-semibold text-gray-900 truncate">{shop.name}</h3>
                                                    <Badge
                                                        className={
                                                            shop.status?.approvalDeleteStatus === "pending"
                                                                ? "bg-red-100 text-red-800 hover:bg-red-100"
                                                                : shop.status?.approvalDeleteStatus === "approved"
                                                                    ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                                                    : "bg-green-100 text-green-800 hover:bg-green-100"
                                                        }
                                                    >
                                                        {shop.status?.approvalDeleteStatus === "pending"
                                                            ? "Chờ duyệt xóa"
                                                            : shop.status?.approvalDeleteStatus === "approved"
                                                                ? "Đã xóa"
                                                                : "Từ chối xóa"}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <FiUser className="w-4 h-4" />
                                                        <span>Chủ shop: {shop.owner?.fullName || "N/A"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <FiCalendar className="w-4 h-4" />
                                                        <span>Tạo: {formatDate(shop.createdAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span>📧</span>
                                                        <span>{shop.owner?.email || "N/A"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span>⭐</span>
                                                        <span>
                                                            Đánh giá: {shop.stats?.rating?.avg?.toFixed(1) || "0.0"} ({shop.stats?.rating?.count || 0}
                                                            )
                                                        </span>
                                                    </div>
                                                </div>

                                                {shop.description && <p className="text-gray-700 mt-3 line-clamp-2">{shop.description}</p>}

                                                {/* Shop Stats */}
                                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                                                    <span>📦 Đơn hàng: {shop.stats?.orderCount || 0}</span>
                                                    <span>💰 Doanh thu: {(shop.stats?.revenue || 0).toLocaleString("vi-VN")}đ</span>
                                                    <span>👥 Theo dõi: {shop.stats?.followers?.length || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 ml-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewDetails(shop._id)}
                                                className="flex items-center gap-2"
                                            >
                                                <FiEye className="w-4 h-4" />
                                                Chi tiết
                                            </Button>
                                            {shop.status?.approvalDeleteStatus === "pending" && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprovalAction(shop._id, "approve")}
                                                        className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                                                    >
                                                        <FiCheck className="w-4 h-4" />
                                                        Duyệt xóa
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleApprovalAction(shop._id, "reject")}
                                                        className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
                                                    >
                                                        <FiX className="w-4 h-4" />
                                                        Từ chối
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-6 border-t">
                            <div className="text-sm text-gray-600">
                                Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} shop
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page === 1}
                                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
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
                                                onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
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
                                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    Sau
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Shop Detail Modal */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-red-700">Chi tiết Shop - Yêu cầu Xóa</DialogTitle>
                        <DialogDescription>Thông tin chi tiết về shop đang chờ duyệt xóa</DialogDescription>
                    </DialogHeader>

                    {selectedShop && (
                        <ScrollArea className="max-h-[70vh]">
                            <div className="space-y-6 pr-4">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-3">Thông tin cơ bản</h3>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <strong>Tên shop:</strong> {selectedShop.name}
                                            </div>
                                            <div>
                                                <strong>Mô tả:</strong> {selectedShop.description || "Không có"}
                                            </div>
                                            <div>
                                                <strong>Ngày tạo:</strong> {formatDate(selectedShop.createdAt)}
                                            </div>
                                            <div>
                                                <strong>Cập nhật cuối:</strong> {formatDate(selectedShop.updatedAt)}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-lg mb-3">Thông tin chủ shop</h3>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <strong>Họ tên:</strong> {selectedShop.owner?.fullName || "N/A"}
                                            </div>
                                            <div>
                                                <strong>Email:</strong> {selectedShop.owner?.email || "N/A"}
                                            </div>
                                            <div>
                                                <strong>Vai trò:</strong> {selectedShop.owner?.roles?.join(", ") || "N/A"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Shop Statistics */}
                                <div>
                                    <h3 className="font-semibold text-lg mb-3 text-red-700">Thống kê hoạt động</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-gray-900">{selectedShop.stats?.orderCount || 0}</div>
                                            <div className="text-sm text-gray-600">Đơn hàng</div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-gray-900">
                                                {(selectedShop.stats?.revenue || 0).toLocaleString("vi-VN")}
                                            </div>
                                            <div className="text-sm text-gray-600">Doanh thu (VNĐ)</div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-gray-900">
                                                {selectedShop.stats?.rating?.avg?.toFixed(1) || "0.0"}
                                            </div>
                                            <div className="text-sm text-gray-600">Đánh giá TB</div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-gray-900">
                                                {selectedShop.stats?.followers?.length || 0}
                                            </div>
                                            <div className="text-sm text-gray-600">Người theo dõi</div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Contact Info */}
                                {selectedShop.contact && (
                                    <>
                                        <div>
                                            <h3 className="font-semibold text-lg mb-3">Thông tin liên hệ</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <strong>Điện thoại:</strong> {selectedShop.contact.phone || "N/A"}
                                                </div>
                                                <div>
                                                    <strong>Email:</strong> {selectedShop.contact.email || "N/A"}
                                                </div>
                                                {selectedShop.contact.businessAddress && (
                                                    <div className="md:col-span-2">
                                                        <strong>Địa chỉ kinh doanh:</strong>
                                                        <div className="mt-1">
                                                            {[
                                                                selectedShop.contact.businessAddress.street,
                                                                selectedShop.contact.businessAddress.ward,
                                                                selectedShop.contact.businessAddress.district,
                                                                selectedShop.contact.businessAddress.city,
                                                                selectedShop.contact.businessAddress.province,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(", ")}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Separator />
                                    </>
                                )}

                                {/* Warning */}
                                <Alert className="border-red-200 bg-red-50">
                                    <FiAlertTriangle className="h-4 w-4 text-red-600" />
                                    <AlertDescription className="text-red-800">
                                        <strong>Lưu ý:</strong> Nếu duyệt xóa shop này, tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn và
                                        không thể khôi phục.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>

            {/* Approval Modal */}
            <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={approvalType === "approve" ? "text-red-700" : "text-green-700"}>
                            {approvalType === "approve" ? "Duyệt Xóa Shop" : "Từ chối Xóa Shop"}
                        </DialogTitle>
                        <DialogDescription>
                            {approvalType === "approve"
                                ? "⚠️ CẢNH BÁO: Shop sẽ bị xóa vĩnh viễn khỏi hệ thống và không thể khôi phục. Vui lòng xác nhận."
                                : "Từ chối yêu cầu xóa shop. Shop sẽ tiếp tục hoạt động bình thường."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">
                                Ghi chú {approvalType === "approve" ? "(bắt buộc)" : "(tùy chọn)"}
                            </label>
                            <Textarea
                                placeholder={approvalType === "approve" ? "Lý do duyệt xóa shop..." : "Lý do từ chối xóa shop..."}
                                value={approvalNote}
                                onChange={(e) => setApprovalNote(e.target.value)}
                                className="mt-1"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApprovalModal(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleConfirmApproval}
                            className={approvalType === "approve" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                            disabled={approvalType === "approve" && !approvalNote.trim()}
                        >
                            {approvalType === "approve" ? "⚠️ Xác nhận xóa" : "Từ chối xóa"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ShopDeleteApproval
