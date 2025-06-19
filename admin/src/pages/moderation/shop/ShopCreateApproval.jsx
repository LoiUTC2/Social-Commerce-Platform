"use client"

import { useState, useEffect } from "react"
import { FiSearch, FiEye, FiCheck, FiX, FiShoppingBag, FiUser, FiCalendar, FiMapPin } from "react-icons/fi"
import { toast } from "sonner"
import { getAllShops, approveCreateShop, rejectCreateShop, getShopDetails } from "../../../services/shopService"
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

const ShopCreateApproval = () => {
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
        createStatus: "pending",
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
                response = await approveCreateShop(processingShopId, approvalNote)
                toast.success("Đã duyệt shop thành công!")
            } else {
                response = await rejectCreateShop(processingShopId, approvalNote)
                toast.success("Đã từ chối shop thành công!")
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
            toast.error(`Lỗi khi ${approvalType === "approve" ? "duyệt" : "từ chối"} shop`)
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
                    <h1 className="text-3xl font-bold text-gray-900">Duyệt Tạo Shop</h1>
                    <p className="text-gray-600 mt-1">Quản lý và duyệt các yêu cầu tạo shop mới</p>
                </div>
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                        {pagination.total} shop chờ duyệt
                    </Badge>
                </div>
            </div>

            {/* Filter Tabs */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Button
                            variant={filters.createStatus === "pending" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilters({ ...filters, createStatus: "pending" })}
                            className={filters.createStatus === "pending" ? "bg-pink-600 hover:bg-pink-700" : ""}
                        >
                            Chờ duyệt ({shops.filter((s) => s.status?.approvalCreateStatus === "pending").length})
                        </Button>
                        <Button
                            variant={filters.createStatus === "approved" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilters({ ...filters, createStatus: "approved" })}
                            className={filters.createStatus === "approved" ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                            Đã duyệt
                        </Button>
                        <Button
                            variant={filters.createStatus === "rejected" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilters({ ...filters, createStatus: "rejected" })}
                            className={filters.createStatus === "rejected" ? "bg-red-600 hover:bg-red-700" : ""}
                        >
                            Đã từ chối
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
                        {filters.createStatus === "pending" && "Danh sách Shop Chờ Duyệt"}
                        {filters.createStatus === "approved" && "Danh sách Shop Đã Duyệt"}
                        {filters.createStatus === "rejected" && "Danh sách Shop Đã Từ Chối"}
                        {/* Optional: Add a default title if no filter is active or for an "All" state */}
                        {!filters.createStatus && "Danh sách Tất Cả Shop"}
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
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Không có shop nào chờ duyệt</h3>
                            <p className="text-gray-600">Tất cả các yêu cầu tạo shop đã được xử lý</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredShops.map((shop) => (
                                <div key={shop._id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            {/* Shop Avatar */}
                                            <Avatar className="w-16 h-16">
                                                <AvatarImage src={shop.avatar || shop.logo} alt={shop.name} />
                                                <AvatarFallback className="bg-pink-100 text-pink-600 text-lg font-semibold">
                                                    {shop.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            {/* Shop Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-xl font-semibold text-gray-900 truncate">{shop.name}</h3>
                                                    <Badge
                                                        className={
                                                            shop.status?.approvalCreateStatus === "pending"
                                                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                                                : shop.status?.approvalCreateStatus === "approved"
                                                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                                    : "bg-red-100 text-red-800 hover:bg-red-100"
                                                        }
                                                    >
                                                        {shop.status?.approvalCreateStatus === "pending"
                                                            ? "Chờ duyệt"
                                                            : shop.status?.approvalCreateStatus === "approved"
                                                                ? "Đã duyệt"
                                                                : "Đã từ chối"}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <FiUser className="w-4 h-4" />
                                                        <span>Chủ shop: {shop.owner?.fullName || "N/A"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <FiCalendar className="w-4 h-4" />
                                                        <span>Đăng ký: {formatDate(shop.createdAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span>📧</span>
                                                        <span>{shop.owner?.email || "N/A"}</span>
                                                    </div>
                                                    {shop.contact?.businessAddress && (
                                                        <div className="flex items-center gap-2">
                                                            <FiMapPin className="w-4 h-4" />
                                                            <span className="truncate">
                                                                {shop.contact.businessAddress.city}, {shop.contact.businessAddress.province}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {shop.description && <p className="text-gray-700 mt-3 line-clamp-2">{shop.description}</p>}
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
                                            {shop.status?.approvalCreateStatus === "pending" && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprovalAction(shop._id, "approve")}
                                                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                                    >
                                                        <FiCheck className="w-4 h-4" />
                                                        Duyệt
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleApprovalAction(shop._id, "reject")}
                                                        className="flex items-center gap-2"
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
                        <DialogTitle>Chi tiết Shop</DialogTitle>
                        <DialogDescription>Thông tin chi tiết về shop đang chờ duyệt</DialogDescription>
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

                                {/* Business Info */}
                                {selectedShop.businessInfo && (
                                    <>
                                        <div>
                                            <h3 className="font-semibold text-lg mb-3">Thông tin doanh nghiệp</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <strong>Giấy phép KD:</strong> {selectedShop.businessInfo.businessLicense || "N/A"}
                                                </div>
                                                <div>
                                                    <strong>Mã số thuế:</strong> {selectedShop.businessInfo.taxIdentificationNumber || "N/A"}
                                                </div>
                                                <div>
                                                    <strong>Số ĐKKD:</strong> {selectedShop.businessInfo.businessRegistrationNumber || "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                        <Separator />
                                    </>
                                )}

                                {/* Product Info */}
                                {selectedShop.productInfo && (
                                    <div>
                                        <h3 className="font-semibold text-lg mb-3">Thông tin sản phẩm</h3>
                                        <div className="text-sm space-y-2">
                                            {selectedShop.productInfo.brands?.length > 0 && (
                                                <div>
                                                    <strong>Thương hiệu:</strong> {selectedShop.productInfo.brands.join(", ")}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>

            {/* Approval Modal */}
            <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{approvalType === "approve" ? "Duyệt Shop" : "Từ chối Shop"}</DialogTitle>
                        <DialogDescription>
                            {approvalType === "approve"
                                ? "Xác nhận duyệt shop này. Shop sẽ được kích hoạt và có thể hoạt động."
                                : "Xác nhận từ chối shop này. Vui lòng nhập lý do từ chối."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">
                                Ghi chú {approvalType === "reject" ? "(bắt buộc)" : "(tùy chọn)"}
                            </label>
                            <Textarea
                                placeholder={approvalType === "approve" ? "Ghi chú về việc duyệt..." : "Lý do từ chối..."}
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
                            className={approvalType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                            disabled={approvalType === "reject" && !approvalNote.trim()}
                        >
                            {approvalType === "approve" ? "Duyệt Shop" : "Từ chối Shop"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ShopCreateApproval
