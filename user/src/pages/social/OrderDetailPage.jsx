"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Separator } from "../../components/ui/separator"
import { useAuth } from "../../contexts/AuthContext"
import { getOrderDetailForBuyer, cancelOrder, confirmReceived, reorderItems } from "../../services/orderService"
import {
    ArrowLeft,
    Package,
    Truck,
    MapPin,
    Phone,
    CreditCard,
    Clock,
    CheckCircle,
    XCircle,
    Star,
    MessageSquare,
    RotateCcw,
    ShoppingCart,
    Store,
} from "lucide-react"
import { toast } from "sonner"

import ProductReviewModal from "../../components/orders/ProductReviewModal"
import ShopReviewModal from "../../components/orders/ShopReviewModal"

// Map backend status (lowercase) to frontend status (UPPERCASE)
const mapBackendStatusToFrontend = (backendStatus) => {
    const statusMap = {
        pending: "PENDING",
        confirmed: "CONFIRMED",
        preparing: "PREPARING",
        shipping: "SHIPPING",
        delivered: "DELIVERED",
        cancelled: "CANCELLED",
        returned: "RETURNED",
    }
    return statusMap[backendStatus] || "PENDING"
}

const ORDER_STATUS = {
    PENDING: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
    PREPARING: { label: "Đang chuẩn bị", color: "bg-purple-100 text-purple-800", icon: Package },
    SHIPPING: { label: "Đang giao", color: "bg-orange-100 text-orange-800", icon: Truck },
    DELIVERED: { label: "Đã giao", color: "bg-green-100 text-green-800", icon: CheckCircle },
    CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-800", icon: XCircle },
    RETURNED: { label: "Đã trả hàng", color: "bg-gray-100 text-gray-800", icon: RotateCcw },
}

const ORDER_TIMELINE = {
    PENDING: [
        { status: "PENDING", label: "Đơn hàng đã được đặt", active: true },
        { status: "CONFIRMED", label: "Chờ xác nhận", active: false },
        { status: "PREPARING", label: "Chuẩn bị hàng", active: false },
        { status: "SHIPPING", label: "Đang giao hàng", active: false },
        { status: "DELIVERED", label: "Đã giao hàng", active: false },
    ],
    CONFIRMED: [
        { status: "PENDING", label: "Đơn hàng đã được đặt", active: true },
        { status: "CONFIRMED", label: "Đã xác nhận", active: true },
        { status: "PREPARING", label: "Chuẩn bị hàng", active: false },
        { status: "SHIPPING", label: "Đang giao hàng", active: false },
        { status: "DELIVERED", label: "Đã giao hàng", active: false },
    ],
    PREPARING: [
        { status: "PENDING", label: "Đơn hàng đã được đặt", active: true },
        { status: "CONFIRMED", label: "Đã xác nhận", active: true },
        { status: "PREPARING", label: "Đang chuẩn bị hàng", active: true },
        { status: "SHIPPING", label: "Đang giao hàng", active: false },
        { status: "DELIVERED", label: "Đã giao hàng", active: false },
    ],
    SHIPPING: [
        { status: "PENDING", label: "Đơn hàng đã được đặt", active: true },
        { status: "CONFIRMED", label: "Đã xác nhận", active: true },
        { status: "PREPARING", label: "Đã chuẩn bị hàng", active: true },
        { status: "SHIPPING", label: "Đang giao hàng", active: true },
        { status: "DELIVERED", label: "Đã giao hàng", active: false },
    ],
    DELIVERED: [
        { status: "PENDING", label: "Đơn hàng đã được đặt", active: true },
        { status: "CONFIRMED", label: "Đã xác nhận", active: true },
        { status: "PREPARING", label: "Đã chuẩn bị hàng", active: true },
        { status: "SHIPPING", label: "Đang giao hàng", active: true },
        { status: "DELIVERED", label: "Giao hàng thành công", active: true },
    ],
    CANCELLED: [
        { status: "PENDING", label: "Đơn hàng đã được đặt", active: true },
        { status: "CANCELLED", label: "Đã hủy đơn hàng", active: true },
    ],
}

export default function OrderDetailPage() {
    const { orderId } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { isAuthenticated, setShowLoginModal } = useAuth()

    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    const [showProductReviewModal, setShowProductReviewModal] = useState(false)
    const [showShopReviewModal, setShowShopReviewModal] = useState(false)
    const [selectedProductForReview, setSelectedProductForReview] = useState(null)

    useEffect(() => {
        if (!isAuthenticated) {
            setShowLoginModal(true)
            navigate("/")
            return
        }
        fetchOrderDetail()
    }, [orderId, isAuthenticated])

    const fetchOrderDetail = async () => {
        try {
            setLoading(true)
            const response = await getOrderDetailForBuyer(orderId)
            if (response.success) {
                // Transform backend order to match frontend structure
                const transformedOrder = {
                    ...response.data,
                    status: mapBackendStatusToFrontend(response.data.status),
                }
                setOrder(transformedOrder)
            } else {
                toast.error("Không thể tải thông tin đơn hàng")
                navigate("/orders")
            }
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết đơn hàng:", error)
            toast.error("Không thể tải thông tin đơn hàng")
            navigate("/orders")
        } finally {
            setLoading(false)
        }
    }

    const handleCancelOrder = async () => {
        const reason = prompt("Vui lòng nhập lý do hủy đơn hàng:")
        if (reason === null) return // User cancelled

        try {
            setActionLoading(true)
            const response = await cancelOrder(orderId, reason)
            if (response.success) {
                toast.success("Đã hủy đơn hàng thành công")
                fetchOrderDetail()
            } else {
                toast.error(response.message || "Không thể hủy đơn hàng")
            }
        } catch (error) {
            console.error("Lỗi khi hủy đơn hàng:", error)
            toast.error("Không thể hủy đơn hàng")
        } finally {
            setActionLoading(false)
        }
    }

    const handleConfirmReceived = async () => {
        if (!window.confirm("Xác nhận bạn đã nhận được hàng?")) return

        try {
            setActionLoading(true)
            const response = await confirmReceived(orderId)
            if (response.success) {
                toast.success("Đã xác nhận nhận hàng thành công")
                fetchOrderDetail()
            } else {
                toast.error(response.message || "Không thể xác nhận nhận hàng")
            }
        } catch (error) {
            console.error("Lỗi khi xác nhận nhận hàng:", error)
            toast.error("Không thể xác nhận nhận hàng")
        } finally {
            setActionLoading(false)
        }
    }

    const handleReorder = async () => {
        try {
            setActionLoading(true)
            const response = await reorderItems(orderId)
            if (response.success) {
                toast.success("Đã thêm sản phẩm vào giỏ hàng")
                navigate("/markerplace/cart")
            }
        } catch (error) {
            console.error("Lỗi khi đặt lại đơn hàng:", error)
            toast.error("Không thể đặt lại đơn hàng")
        } finally {
            setActionLoading(false)
        }
    }

    const handleReviewProduct = (product = null) => {
        setSelectedProductForReview(product)
        setShowProductReviewModal(true)
    }

    const handleReviewShop = () => {
        setShowShopReviewModal(true)
    }

    const handleReviewSuccess = () => {
        // Refresh order details after successful review
        fetchOrderDetail()
        setShowProductReviewModal(false)
        setShowShopReviewModal(false)
        setSelectedProductForReview(null)
        toast.success("Cảm ơn bạn đã đánh giá!")
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price)
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getStatusInfo = (status) => {
        return ORDER_STATUS[status] || ORDER_STATUS.PENDING
    }

    const getTimeline = (status) => {
        return ORDER_TIMELINE[status] || ORDER_TIMELINE.PENDING
    }

    const canCancelOrder = (status) => {
        return ["PENDING", "CONFIRMED"].includes(status)
    }

    const canConfirmReceived = (status) => {
        return status === "SHIPPING"
    }

    const canReview = (status) => {
        return status === "DELIVERED"
    }

    const canReorder = (status) => {
        return ["DELIVERED", "CANCELLED"].includes(status)
    }

    if (!isAuthenticated) {
        return null
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto p-4">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-600 mb-2">Không tìm thấy đơn hàng</h2>
                    <Button onClick={() => navigate("/orders")} className="bg-pink-600 hover:bg-pink-700">
                        Quay lại danh sách đơn hàng
                    </Button>
                </div>
            </div>
        )
    }

    const statusInfo = getStatusInfo(order.status)
    const timeline = getTimeline(order.status)
    const StatusIcon = statusInfo.icon

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white py-3 px-4 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <nav className="text-sm text-gray-600">
                        <span className="hover:text-pink-500 cursor-pointer" onClick={() => navigate("/")}>
                            Trang chủ
                        </span>
                        <span className="mx-2">›</span>
                        <span className="hover:text-pink-500 cursor-pointer" onClick={() => navigate("/feed/orders")}>
                            Đơn hàng của tôi
                        </span>
                        <span className="mx-2">›</span>
                        <span className="text-gray-900">Chi tiết đơn hàng</span>
                    </nav>
                </div>
            </div>

            {/* Header */}
            <div className="bg-gradient-to-r from-pink-100 via-pink-50 to-rose-100 border-b border-pink-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/feed/orders")}
                            className="text-gray-600 hover:bg-white/50 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/60 rounded-full">
                                <StatusIcon className="w-8 h-8 text-pink-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Đơn hàng #{order._id?.substring(0, 8)}</h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {statusInfo.label}
                                    </Badge>
                                    <span className="text-pink-700 text-sm">Đặt lúc: {formatDate(order.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 space-y-6">
                {/* Shop Information */}
                {order.shop && (
                    <Card className="shadow-md">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <Store className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">Thông tin shop</h3>
                                    <p
                                        className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                                        onClick={() => navigate(`/shop/${order.shop.slug}`)}
                                    >
                                        {order.shop.name}
                                    </p>
                                    {order.shop.contact?.phone && (
                                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                            <Phone className="w-4 h-4" />
                                            {order.shop.contact.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Order Timeline */}
                {order.status !== "CANCELLED" && (
                    <Card className="shadow-md">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Truck className="w-5 h-5 text-pink-600" />
                                Trạng thái đơn hàng
                            </h2>

                            <div className="relative">
                                <div className="flex justify-between">
                                    {timeline.map((step, index) => (
                                        <div key={step.status} className="flex flex-col items-center relative">
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step.active
                                                    ? "bg-pink-600 border-pink-600 text-white"
                                                    : "bg-gray-200 border-gray-300 text-gray-400"
                                                    }`}
                                            >
                                                {step.active ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                            </div>
                                            <p
                                                className={`text-xs mt-2 text-center max-w-20 ${step.active ? "text-pink-600 font-medium" : "text-gray-500"
                                                    }`}
                                            >
                                                {step.label}
                                            </p>

                                            {index < timeline.length - 1 && (
                                                <div
                                                    className={`absolute top-5 left-10 w-full h-0.5 ${timeline[index + 1]?.active ? "bg-pink-600" : "bg-gray-300"
                                                        }`}
                                                    style={{ width: "calc(100% + 2.5rem)" }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Order Actions */}
                <Card className="shadow-md">
                    <CardContent className="p-6">
                        <div className="flex flex-wrap gap-3 justify-end">
                            {canCancelOrder(order.status) && (
                                <Button
                                    variant="outline"
                                    onClick={handleCancelOrder}
                                    disabled={actionLoading}
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    {actionLoading ? "Đang hủy..." : "Hủy đơn hàng"}
                                </Button>
                            )}

                            {canConfirmReceived(order.status) && (
                                <Button
                                    onClick={handleConfirmReceived}
                                    disabled={actionLoading}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {actionLoading ? "Đang xác nhận..." : "Đã nhận hàng"}
                                </Button>
                            )}

                            {canReview(order.status) && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleReviewProduct()}
                                        className="border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                                    >
                                        <Star className="w-4 h-4 mr-2" />
                                        Đánh giá sản phẩm
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleReviewShop}
                                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                    >
                                        <Store className="w-4 h-4 mr-2" />
                                        Đánh giá shop
                                    </Button>
                                </>
                            )}

                            {canReorder(order.status) && (
                                <Button
                                    variant="outline"
                                    onClick={handleReorder}
                                    disabled={actionLoading}
                                    className="border-green-200 text-green-600 hover:bg-green-50"
                                >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    {actionLoading ? "Đang thêm..." : "Mua lại"}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Order Items */}
                <Card className="shadow-md">
                    <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Package className="w-5 h-5 text-pink-600" />
                            Sản phẩm đã đặt
                        </h2>

                        <div className="space-y-4">
                            {order.items?.map((item, index) => (
                                <div key={index} className="flex gap-4 items-center p-4 bg-gray-50 rounded-lg">
                                    <img
                                        src={item.product?.images?.[0] || "/placeholder.svg?height=80&width=80"}
                                        alt={item.product?.name}
                                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900 line-clamp-2">{item.product?.name}</h3>
                                        {Object.keys(item.selectedVariant || {}).length > 0 && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                {Object.entries(item.selectedVariant)
                                                    .map(([key, value]) => `${key}: ${value}`)
                                                    .join(", ")}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm text-gray-600">Số lượng: {item.quantity}</span>
                                            <span className="font-semibold text-pink-600">{formatPrice(item.price)}</span>
                                        </div>
                                    </div>
                                    {canReview(order.status) && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleReviewProduct(item)}
                                            className="border-yellow-200 text-yellow-600 hover:bg-yellow-50 ml-2"
                                        >
                                            <Star className="w-4 h-4 mr-1" />
                                            Đánh giá
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card className="shadow-md">
                    <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-pink-600" />
                            Địa chỉ giao hàng
                        </h2>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">{order.shippingAddress?.fullName}</p>
                                    <p className="text-gray-600 flex items-center gap-2 mt-1">
                                        <Phone className="w-4 h-4" />
                                        {order.shippingAddress?.phone}
                                    </p>
                                    <p className="text-gray-600 mt-1">{order.shippingAddress?.address}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment & Summary */}
                <Card className="shadow-md">
                    <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-pink-600" />
                            Thông tin thanh toán
                        </h2>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Phương thức thanh toán:</span>
                                <span className="font-medium">
                                    {order.paymentMethod === "COD" ? "Thanh toán khi nhận hàng" : order.paymentMethod}
                                </span>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tạm tính:</span>
                                    <span>{formatPrice(order.totalAmount - (order.shippingFee || 0))}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Phí vận chuyển:</span>
                                    <span>{formatPrice(order.shippingFee || 0)}</span>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex justify-between items-center text-lg font-bold">
                                <span>Tổng cộng:</span>
                                <span className="text-pink-600">{formatPrice(order.totalAmount)}</span>
                            </div>

                            {order.isPaid && (
                                <div className="flex items-center gap-2 text-green-600 text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Đã thanh toán {order.paidAt && `lúc ${formatDate(order.paidAt)}`}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Order Notes */}
                {order.notes && (
                    <Card className="shadow-md">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-pink-600" />
                                Ghi chú đơn hàng
                            </h2>
                            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{order.notes}</p>
                        </CardContent>
                    </Card>
                )}
                {showProductReviewModal && order && (
                    <ProductReviewModal
                        order={order}
                        product={selectedProductForReview}
                        onClose={() => {
                            setShowProductReviewModal(false)
                            setSelectedProductForReview(null)
                        }}
                        onSuccess={handleReviewSuccess}
                    />
                )}

                {showShopReviewModal && order && (
                    <ShopReviewModal
                        order={order}
                        shop={order.shop}
                        onClose={() => setShowShopReviewModal(false)}
                        onSuccess={handleReviewSuccess}
                    />
                )}
            </div>
        </div>
    )
}
