"use client"

import { Label } from "../../../../components/ui/label"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../components/ui/dialog"
import { Button } from "../../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Badge } from "../../../../components/ui/badge"
import { Separator } from "../../../../components/ui/separator"
import { Progress } from "../../../../components/ui/progress"
import {
    Eye,
    Calendar,
    Package,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    Hash,
    ImageIcon,
    BarChart3,
} from "lucide-react"
import { getFlashSaleForSeller } from "../../../../services/flashSaleService"
import { toast } from "sonner"

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

export default function FlashSaleDetailModal({ isOpen, onClose, flashSale }) {
    const [loading, setLoading] = useState(false)
    const [detailData, setDetailData] = useState(null)

    useEffect(() => {
        if (isOpen && flashSale) {
            fetchFlashSaleDetail()
        }
    }, [isOpen, flashSale])

    const fetchFlashSaleDetail = async () => {
        setLoading(true)
        try {
            const response = await getFlashSaleForSeller(flashSale._id)
            if (response.success) {
                setDetailData(response.data)
            } else {
                throw new Error(response.message || "Không thể lấy chi tiết Flash Sale")
            }
        } catch (error) {
            toast.error("Lỗi", { description: error.message || "Không thể lấy chi tiết Flash Sale" })
            console.error("Error fetching flash sale detail:", error)
        } finally {
            setLoading(false)
        }
    }

    if (!flashSale) return null

    const status = getFlashSaleStatus(flashSale)
    const statusInfo = flashSaleStatuses[status]
    const approvalInfo = approvalStatuses[flashSale.approvalStatus]

    // Calculate total stats
    const totalProducts = flashSale.products?.length || 0
    const totalSold = flashSale.products?.reduce((sum, p) => sum + (p.soldCount || 0), 0) || 0
    const totalRevenue = flashSale.stats?.totalRevenue || 0
    const totalViews = flashSale.stats?.totalViews || 0
    const totalPurchases = flashSale.stats?.totalPurchases || 0
    const conversionRate = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-pink-500" />
                        Chi tiết Flash Sale
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mr-2"></div>
                        Đang tải...
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                        {flashSale.banner ? (
                                            <img
                                                src={flashSale.banner || "/placeholder.svg"}
                                                alt={flashSale.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-xl font-semibold">{flashSale.name}</h3>
                                            {flashSale.isFeatured && (
                                                <Badge className="bg-yellow-100 text-yellow-800">
                                                    <TrendingUp className="w-3 h-3 mr-1" />
                                                    Nổi bật
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-gray-600 mb-3">{flashSale.description || "Không có mô tả"}</p>
                                        <div className="flex items-center gap-4">
                                            <Badge className={statusInfo.color}>
                                                <statusInfo.icon className="w-3 h-3 mr-1" />
                                                {statusInfo.label}
                                            </Badge>
                                            <Badge className={approvalInfo.color}>
                                                <approvalInfo.icon className="w-3 h-3 mr-1" />
                                                {approvalInfo.label}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {flashSale.hashtags && flashSale.hashtags.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Hashtags</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {flashSale.hashtags.map((hashtag, index) => (
                                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                                    <Hash className="w-3 h-3" />
                                                    {hashtag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Time Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Thời gian diễn ra
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-gray-600">Thời gian bắt đầu</div>
                                        <div className="flex items-center gap-2 text-green-600">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(flashSale.startTime)}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-gray-600">Thời gian kết thúc</div>
                                        <div className="flex items-center gap-2 text-red-600">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(flashSale.endTime)}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Statistics */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" />
                                    Thống kê hiệu suất
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">{totalViews}</div>
                                        <div className="text-sm text-blue-500">Lượt xem</div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{totalPurchases}</div>
                                        <div className="text-sm text-green-500">Lượt mua</div>
                                    </div>
                                    <div className="text-center p-4 bg-pink-50 rounded-lg">
                                        <div className="text-2xl font-bold text-pink-600">
                                            {formatCurrency(totalRevenue).replace("₫", "").trim()}₫
                                        </div>
                                        <div className="text-sm text-pink-500">Doanh thu</div>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-600">{conversionRate.toFixed(1)}%</div>
                                        <div className="text-sm text-purple-500">Tỷ lệ chuyển đổi</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Products */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Sản phẩm trong Flash Sale ({totalProducts})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {flashSale.products && flashSale.products.length > 0 ? (
                                    <div className="space-y-4">
                                        {flashSale.products.map((product, index) => {
                                            const soldPercentage = product.stockLimit > 0 ? (product.soldCount / product.stockLimit) * 100 : 0
                                            const discountPercentage =
                                                product.productInfo?.price > 0
                                                    ? ((product.productInfo.price - product.salePrice) / product.productInfo.price) * 100
                                                    : 0

                                            return (
                                                <div key={index} className="border rounded-lg p-4">
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <img
                                                            src={product.productInfo?.images?.[0] || "/placeholder.svg?height=60&width=60"}
                                                            alt={product.productInfo?.name || "Sản phẩm"}
                                                            className="w-15 h-15 object-cover rounded"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="font-medium text-lg">{product.productInfo?.name || "Tên sản phẩm"}</div>
                                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                                <span>Giá gốc: {formatCurrency(product.productInfo?.price || 0)}</span>
                                                                <span className="text-pink-600 font-medium">
                                                                    Giá sale: {formatCurrency(product.salePrice)}
                                                                </span>
                                                                <Badge className="bg-red-100 text-red-800">-{discountPercentage.toFixed(0)}%</Badge>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span>Đã bán</span>
                                                                <span className="font-medium">
                                                                    {product.soldCount || 0}/{product.stockLimit}
                                                                </span>
                                                            </div>
                                                            <Progress value={soldPercentage} className="h-2" />
                                                            <div className="text-xs text-gray-500">{soldPercentage.toFixed(1)}% hoàn thành</div>
                                                        </div>

                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-green-600">
                                                                {formatCurrency((product.soldCount || 0) * product.salePrice)
                                                                    .replace("₫", "")
                                                                    .trim()}
                                                                ₫
                                                            </div>
                                                            <div className="text-sm text-gray-500">Doanh thu</div>
                                                        </div>

                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-blue-600">
                                                                {product.stockLimit - (product.soldCount || 0)}
                                                            </div>
                                                            <div className="text-sm text-gray-500">Còn lại</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        <p>Chưa có sản phẩm nào</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Separator />

                        {/* Actions */}
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={onClose}>
                                Đóng
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
