"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Separator } from "../../components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import {
    Package,
    User,
    Phone,
    MapPin,
    Calendar,
    CreditCard,
    Truck,
    CheckCircle,
    Clock,
    XCircle,
    FileText,
    MessageSquare,
    Copy,
    Mail,
} from "lucide-react"
import { toast } from "sonner"
import { getOrderById, updateOrderStatus } from "../../services/orderService"

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

// Order status mapping
const orderStatuses = {
    pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
    confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800 border-blue-200", icon: CheckCircle },
    shipping: { label: "Đang giao hàng", color: "bg-orange-100 text-orange-800 border-orange-200", icon: Truck },
    delivered: { label: "Đã giao hàng", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
}

// Payment method mapping
const paymentMethods = {
    COD: { label: "Thanh toán khi nhận hàng", icon: "💵" },
    VNPay: { label: "VNPay", icon: "🏦" },
    Momo: { label: "Momo", icon: "📱" },
}

export default function OrderDetailModal({ orderId, isOpen, onClose, onStatusUpdate }) {
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(false)
    const [updatingStatus, setUpdatingStatus] = useState(false)

    useEffect(() => {
        if (isOpen && orderId) {
            fetchOrderDetail()
        }
    }, [isOpen, orderId])

    const fetchOrderDetail = async () => {
        setLoading(true)
        try {
            const response = await getOrderById(orderId)
            if (response.success) {
                setOrder(response.data)
            } else {
                throw new Error(response.message || "Không thể lấy chi tiết đơn hàng")
            }
        } catch (error) {
            toast.error("Lỗi", { description: error.message || "Không thể lấy chi tiết đơn hàng." })
            console.error("Error fetching order detail:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (newStatus) => {
        setUpdatingStatus(true)
        try {
            const response = await updateOrderStatus(orderId, newStatus)
            if (response.success) {
                toast.success("Thành công", {
                    description: `Cập nhật trạng thái đơn hàng thành ${orderStatuses[newStatus].label}.`,
                })

                // Update local state
                setOrder((prev) => ({ ...prev, status: newStatus }))

                // Notify parent component
                if (onStatusUpdate) {
                    onStatusUpdate(orderId, newStatus)
                }
            } else {
                throw new Error(response.message || "Cập nhật trạng thái thất bại")
            }
        } catch (error) {
            toast.error("Lỗi", { description: error.message || "Cập nhật trạng thái thất bại." })
        } finally {
            setUpdatingStatus(false)
        }
    }

    const copyOrderNumber = () => {
        if (order?._id) {
            navigator.clipboard.writeText(order._id)
            toast.success("Đã sao chép mã đơn hàng")
        }
    }

    const handlePrintInvoice = () => {
        toast.info("Tính năng in hóa đơn đang được phát triển")
    }

    const handleContactCustomer = () => {
        if (order?.buyer?._id?.email) {
            window.open(`mailto:${order.buyer._id.email}`, "_blank")
        } else {
            toast.info("Không có thông tin email khách hàng")
        }
    }

    if (!isOpen) return null

    // Calculate final amount
    const finalAmount = order ? order.totalAmount + (order.shippingFee || 0) : 0

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Chi tiết đơn hàng
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-2"></div>
                            <p className="text-gray-600">Đang tải...</p>
                        </div>
                    </div>
                ) : order ? (
                    <div className="space-y-6">
                        {/* Order Header */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-semibold">#{order._id}</h3>
                                                <Button variant="ghost" size="sm" onClick={copyOrderNumber}>
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <p className="text-sm text-gray-600">Đặt lúc: {formatDate(order.createdAt)}</p>
                                            {order.updatedAt !== order.createdAt && (
                                                <p className="text-sm text-gray-500">Cập nhật: {formatDate(order.updatedAt)}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={orderStatuses[order.status].color}>
                                            {React.createElement(orderStatuses[order.status].icon, { className: "w-3 h-3 mr-1" })}
                                            {orderStatuses[order.status].label}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-sm font-medium text-gray-700">Cập nhật trạng thái</label>
                                        <Select value={order.status} onValueChange={handleStatusUpdate} disabled={updatingStatus}>
                                            <SelectTrigger className="w-full mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(orderStatuses).map(([key, status]) => (
                                                    <SelectItem key={key} value={key}>
                                                        <div className="flex items-center gap-2">
                                                            <status.icon className="w-3 h-3" />
                                                            {status.label}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-2 items-end">
                                        <Button variant="outline" onClick={handlePrintInvoice}>
                                            <FileText className="w-4 h-4 mr-2" />
                                            In hóa đơn
                                        </Button>
                                        <Button variant="outline" onClick={handleContactCustomer}>
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Liên hệ
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Customer Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Thông tin khách hàng
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={order.buyer?._id?.avatar || "/placeholder.svg?height=40&width=40"}
                                            alt={order.buyer?._id?.fullName || order.buyer?._id?.name || "Khách hàng"}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="font-medium">{order.buyer?._id?.fullName || order.buyer?._id?.name || "Không có tên"}</p>
                                            <p className="text-sm text-gray-600">{order.buyer?._id?.email || order.buyer?._id?.contact.email || "Không có email"}</p>
                                        </div>
                                    </div>
                                    {order.buyer?._id?.phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span>{order.buyer._id.phone || order.buyer?._id?.contact.phone}</span>
                                        </div>
                                    )}
                                    {order.buyer?._id?.email && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span>{order.buyer._id.email || order.buyer?._id?.contact.email}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Shipping Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Địa chỉ giao hàng
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="font-medium">{order.shippingAddress?.fullName || "Không có tên"}</p>
                                    <p className="text-sm text-gray-600">{order.shippingAddress?.phone || "Không có SĐT"}</p>
                                    <p className="text-sm">{order.shippingAddress?.address || "Không có địa chỉ"}</p>
                                    {order.notes && (
                                        <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                                            <p className="text-sm">
                                                <strong>Ghi chú:</strong> {order.notes}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Sản phẩm đã đặt</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {order.items?.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                                            <img
                                                src={item.product?.images?.[0] || "/placeholder.svg?height=60&width=60"}
                                                alt={item.product?.name || "Sản phẩm"}
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                            <div className="flex-1">
                                                <h4 className="font-medium">{item.product?.name || "Tên sản phẩm không có"}</h4>
                                                {item.selectedVariant && Object.keys(item.selectedVariant).length > 0 && (
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {Object.entries(item.selectedVariant).map(([key, value]) => (
                                                            <span key={key} className="mr-3">
                                                                {key}: {value}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-sm">Số lượng: {item.quantity}</span>
                                                    <span className="text-sm">•</span>
                                                    <span className="text-sm font-medium text-pink-600">{formatCurrency(item.price)}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-pink-600">{formatCurrency(item.price * item.quantity)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment & Summary */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Payment Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" />
                                        Thông tin thanh toán
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{paymentMethods[order.paymentMethod]?.icon || "💳"}</span>
                                        <span className="font-medium">
                                            {paymentMethods[order.paymentMethod]?.label || order.paymentMethod}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Trạng thái:</span>
                                        <Badge className={order.isPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                            {order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                                        </Badge>
                                    </div>
                                    {order.isPaid && order.paidAt && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>Thanh toán lúc: {formatDate(order.paidAt)}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Order Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tổng kết đơn hàng</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span>Tạm tính:</span>
                                        <span>{formatCurrency(order.totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Phí vận chuyển:</span>
                                        <span>{formatCurrency(order.shippingFee || 0)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>Tổng cộng:</span>
                                        <span className="text-pink-600">{formatCurrency(finalAmount)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-600">Không tìm thấy thông tin đơn hàng</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
