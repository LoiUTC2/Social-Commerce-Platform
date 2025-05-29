"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { useAuth } from "../../contexts/AuthContext"
import { getOrdersForBuyer, cancelOrder, reorderItems } from "../../services/orderService"
import {
    Package,
    Clock,
    CheckCircle,
    Truck,
    XCircle,
    RotateCcw,
    Star,
    Eye,
    ArrowLeft,
    ShoppingCart,
    Store,
} from "lucide-react"
import { toast } from "sonner"

import ProductReviewModal from "../../components/orders/ProductReviewModal"
import ShopReviewModal from "../../components/orders/ShopReviewModal"

// Map frontend status (UPPERCASE) to backend status (lowercase)
const ORDER_STATUS = {
    PENDING: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800", icon: Clock, backendValue: "pending" },
    CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800", icon: CheckCircle, backendValue: "confirmed" },
    PREPARING: {
        label: "Đang chuẩn bị",
        color: "bg-purple-100 text-purple-800",
        icon: Package,
        backendValue: "preparing",
    },
    SHIPPING: { label: "Đang giao", color: "bg-orange-100 text-orange-800", icon: Truck, backendValue: "shipping" },
    DELIVERED: { label: "Đã giao", color: "bg-green-100 text-green-800", icon: CheckCircle, backendValue: "delivered" },
    CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-800", icon: XCircle, backendValue: "cancelled" },
    RETURNED: { label: "Đã trả hàng", color: "bg-gray-100 text-gray-800", icon: RotateCcw, backendValue: "returned" },
}

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

const ORDER_TABS = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "Chờ xác nhận" },
    { key: "CONFIRMED", label: "Đã xác nhận" },
    { key: "SHIPPING", label: "Đang giao" },
    { key: "DELIVERED", label: "Đã giao" },
    { key: "CANCELLED", label: "Đã hủy" },
]

export default function OrdersPage() {
    const navigate = useNavigate()
    const { isAuthenticated, setShowLoginModal } = useAuth()

    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [orderSummary, setOrderSummary] = useState([])
    const [cancellingOrderId, setCancellingOrderId] = useState(null)
    const [reorderingOrderId, setReorderingOrderId] = useState(null)

    const [showProductReviewModal, setShowProductReviewModal] = useState(false)
    const [showShopReviewModal, setShowShopReviewModal] = useState(false)
    const [selectedOrderForReview, setSelectedOrderForReview] = useState(null)
    const [selectedProductForReview, setSelectedProductForReview] = useState(null)

    useEffect(() => {
        if (!isAuthenticated) {
            setShowLoginModal(true)
            navigate("/")
            return
        }
        fetchOrders()
    }, [isAuthenticated, activeTab, currentPage])

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const params = {
                page: currentPage,
                limit: 10,
                status: activeTab,
            }

            const response = await getOrdersForBuyer(params)
            if (response.success) {
                // Transform backend orders to match frontend structure
                const transformedOrders = response.data.orders.map((order) => ({
                    ...order,
                    // Convert backend status to frontend status
                    status: mapBackendStatusToFrontend(order.status),
                    // Ensure _id is available
                    _id: order._id,
                }))

                setOrders(transformedOrders || [])
                setTotalPages(response.data.pagination?.totalPages || 1)

                // Set order summary if available
                if (response.data.orderSummary) {
                    setOrderSummary(response.data.orderSummary)
                }
            }
        } catch (error) {
            console.error("Lỗi khi lấy đơn hàng:", error)
            toast.error("Không thể tải danh sách đơn hàng")
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        setCurrentPage(1)
        fetchOrders()
    }

    const handleCancelOrder = async (orderId) => {
        try {
            setCancellingOrderId(orderId)
            const reason = prompt("Vui lòng nhập lý do hủy đơn hàng:")

            if (reason === null) return // User cancelled the prompt

            const response = await cancelOrder(orderId, reason)
            if (response.success) {
                toast.success("Hủy đơn hàng thành công")
                fetchOrders() // Refresh the orders list
            }
        } catch (error) {
            console.error("Lỗi khi hủy đơn hàng:", error)
            toast.error("Không thể hủy đơn hàng")
        } finally {
            setCancellingOrderId(null)
        }
    }

    const handleReorder = async (orderId) => {
        try {
            setReorderingOrderId(orderId)
            const response = await reorderItems(orderId)
            if (response.success) {
                toast.success("Đã thêm sản phẩm vào giỏ hàng")
                navigate("/marketplace/cart")
            }
        } catch (error) {
            console.error("Lỗi khi đặt lại đơn hàng:", error)
            toast.error("Không thể đặt lại đơn hàng")
        } finally {
            setReorderingOrderId(null)
        }
    }

    const handleReviewProduct = (order, product = null) => {
        setSelectedOrderForReview(order)
        setSelectedProductForReview(product)
        setShowProductReviewModal(true)
    }

    const handleReviewShop = (order) => {
        setSelectedOrderForReview(order)
        setShowShopReviewModal(true)
    }

    const handleReviewSuccess = () => {
        // Refresh orders list after successful review
        fetchOrders()
        setShowProductReviewModal(false)
        setShowShopReviewModal(false)
        setSelectedOrderForReview(null)
        setSelectedProductForReview(null)
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

    const canCancelOrder = (status) => {
        return ["PENDING", "CONFIRMED"].includes(status)
    }

    const canReviewOrder = (status) => {
        return status === "DELIVERED"
    }

    if (!isAuthenticated) {
        return null
    }

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
                        <span className="text-gray-900">Đơn hàng của tôi</span>
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
                            onClick={() => navigate(-1)}
                            className="text-gray-600 hover:bg-white/50 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/60 rounded-full">
                                <Package className="w-8 h-8 text-pink-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Đơn Hàng Của Tôi</h1>
                                <p className="text-pink-700 text-sm mt-1">Theo dõi và quản lý các đơn hàng bạn đã đặt</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 space-y-6">
                {/* Order Summary Stats */}
                {orderSummary.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {orderSummary.map((stat) => {
                            const statusInfo = getStatusInfo(mapBackendStatusToFrontend(stat._id))
                            return (
                                <Card key={stat._id} className="shadow-sm">
                                    <CardContent className="p-4 text-center">
                                        <div
                                            className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${statusInfo.color}`}
                                        >
                                            <statusInfo.icon className="w-6 h-6" />
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
                                        <div className="text-sm text-gray-600">{statusInfo.label}</div>
                                        <div className="text-xs text-pink-600 font-medium">{formatPrice(stat.totalSpent || 0)}</div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}

                {/* Order Status Tabs */}
                <Card className="shadow-md">
                    <CardContent className="p-0">
                        <div className="flex overflow-x-auto">
                            {ORDER_TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => {
                                        setActiveTab(tab.key)
                                        setCurrentPage(1)
                                    }}
                                    className={`flex-shrink-0 px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === tab.key
                                        ? "border-pink-500 text-pink-600 bg-pink-50"
                                        : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Orders List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="shadow-md">
                                <CardContent className="p-6">
                                    <div className="animate-pulse space-y-4">
                                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                        <div className="h-20 bg-gray-200 rounded"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <Card className="shadow-md">
                        <CardContent className="p-12 text-center">
                            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                {activeTab === "ALL"
                                    ? "Chưa có đơn hàng nào"
                                    : `Không có đơn hàng ${ORDER_TABS.find((t) => t.key === activeTab)?.label.toLowerCase()}`}
                            </h3>
                            <p className="text-gray-500 mb-6">Hãy khám phá và mua sắm những sản phẩm yêu thích nhé!</p>
                            <Button onClick={() => navigate("/marketplace")} className="bg-pink-600 hover:bg-pink-700">
                                Khám phá ngay
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const statusInfo = getStatusInfo(order.status)
                            const StatusIcon = statusInfo.icon

                            return (
                                <Card key={order._id} className="shadow-md hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        {/* Order Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-pink-100 rounded-full">
                                                    <Package className="w-5 h-5 text-pink-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">Đơn hàng #{order._id?.substring(0, 8)}</h3>
                                                    <p className="text-sm text-gray-500">Đặt lúc: {formatDate(order.createdAt)}</p>
                                                    {order.shop && (
                                                        <p
                                                            className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                                                            onClick={() => navigate(`/shop/${order.shop.slug}`)}
                                                        >
                                                            Shop: {order.shop.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {statusInfo.label}
                                            </Badge>
                                        </div>

                                        {/* Order Items */}
                                        <div className="space-y-3 mb-4">
                                            {order.items?.slice(0, 2).map((item, index) => (
                                                <div key={index} className="flex gap-3 items-center">
                                                    <img
                                                        src={item.product?.images?.[0] || "/placeholder.svg?height=60&width=60"}
                                                        alt={item.product?.name}
                                                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-gray-900 line-clamp-1">{item.product?.name}</h4>
                                                        <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                                                        <p className="text-sm font-semibold text-pink-600">{formatPrice(item.price)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {order.items?.length > 2 && (
                                                <p className="text-sm text-gray-500 text-center py-2">
                                                    ... và {order.items.length - 2} sản phẩm khác
                                                </p>
                                            )}
                                        </div>

                                        {/* Order Footer */}
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                            <div className="text-sm text-gray-600">
                                                <span>Tổng tiền: </span>
                                                <span className="text-lg font-bold text-pink-600">{formatPrice(order.totalAmount)}</span>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/feed/order-details/${order._id}`)}
                                                    className="border-pink-200 text-pink-600 hover:bg-pink-50"
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Xem chi tiết
                                                </Button>

                                                {canCancelOrder(order.status) && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCancelOrder(order._id)}
                                                        disabled={cancellingOrderId === order._id}
                                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        {cancellingOrderId === order._id ? "Đang hủy..." : "Hủy đơn"}
                                                    </Button>
                                                )}

                                                {canReviewOrder(order.status) && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleReviewProduct(order)}
                                                            className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                                        >
                                                            <Star className="w-4 h-4 mr-1" />
                                                            Đánh giá sản phẩm
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleReviewShop(order)}
                                                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                                        >
                                                            <Store className="w-4 h-4 mr-1" />
                                                            Đánh giá shop
                                                        </Button>
                                                    </>
                                                )}

                                                {(order.status === "DELIVERED" || order.status === "CANCELLED") && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleReorder(order._id)}
                                                        disabled={reorderingOrderId === order._id}
                                                        className="border-green-200 text-green-600 hover:bg-green-50"
                                                    >
                                                        <ShoppingCart className="w-4 h-4 mr-1" />
                                                        {reorderingOrderId === order._id ? "Đang thêm..." : "Mua lại"}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2">
                        <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                            Trước
                        </Button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = i + 1
                            return (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    onClick={() => setCurrentPage(page)}
                                    className={currentPage === page ? "bg-pink-600 hover:bg-pink-700" : ""}
                                >
                                    {page}
                                </Button>
                            )
                        })}

                        <Button
                            variant="outline"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                        >
                            Sau
                        </Button>
                    </div>
                )}
            </div>

            {/* Review Modals */}
            {showProductReviewModal && selectedOrderForReview && (
                <ProductReviewModal
                    order={selectedOrderForReview}
                    product={selectedProductForReview}
                    onClose={() => {
                        setShowProductReviewModal(false)
                        setSelectedOrderForReview(null)
                        setSelectedProductForReview(null)
                    }}
                    onSuccess={handleReviewSuccess}
                />
            )}

            {showShopReviewModal && selectedOrderForReview && (
                <ShopReviewModal
                    order={selectedOrderForReview}
                    shop={selectedOrderForReview.shop}
                    onClose={() => {
                        setShowShopReviewModal(false)
                        setSelectedOrderForReview(null)
                    }}
                    onSuccess={handleReviewSuccess}
                />
            )}

        </div>
    )
}
