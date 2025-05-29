"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { CheckCircle, ShoppingBag, Package, ArrowRight } from "lucide-react"
import { useCart } from "../../contexts/CartContext"

export default function OrderSuccessModal({ orderData, onClose }) {
    const { fetchCart } = useCart();
    const navigate = useNavigate()

    // Prevent scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = "auto"
        }
    }, [])

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price)
    }

    // Get first order if there are multiple orders
    const firstOrder = Array.isArray(orderData?.orders) ? orderData.orders[0] : orderData

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 text-center">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Đặt hàng thành công!</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Cảm ơn bạn đã mua sắm tại HULO. Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.
                    </p>

                    {/* Order Summary */}
                    <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 mb-6 text-left">
                        <div className="flex items-center gap-2 mb-3">
                            <ShoppingBag className="w-5 h-5 text-pink-600" />
                            <h3 className="font-semibold">Thông tin đơn hàng</h3>
                        </div>

                        {Array.isArray(orderData?.orders) ? (
                            <div className="space-y-2 text-sm">
                                <p>
                                    <span className="text-gray-600 dark:text-gray-400">Số lượng đơn hàng:</span>{" "}
                                    <span className="font-medium">{orderData.orders.length}</span>
                                </p>
                                <p>
                                    <span className="text-gray-600 dark:text-gray-400">Tổng giá trị:</span>{" "}
                                    <span className="font-medium">
                                        {formatPrice(orderData.orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0))}
                                    </span>
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 text-sm">
                                <p>
                                    <span className="text-gray-600 dark:text-gray-400">Mã đơn hàng:</span>{" "}
                                    <span className="font-medium">#{firstOrder?._id?.substring(0, 8)}</span>
                                </p>
                                <p>
                                    <span className="text-gray-600 dark:text-gray-400">Tổng giá trị:</span>{" "}
                                    <span className="font-medium">{formatPrice(firstOrder?.totalAmount || 0)}</span>
                                </p>
                                <p>
                                    <span className="text-gray-600 dark:text-gray-400">Phương thức thanh toán:</span>{" "}
                                    <span className="font-medium">{firstOrder?.paymentMethod || "COD"}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Next Steps */}
                    <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4 mb-6 text-left">
                        <div className="flex items-center gap-2 mb-3">
                            <Package className="w-5 h-5 text-pink-600" />
                            <h3 className="font-semibold">Các bước tiếp theo</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <li>• Bạn sẽ nhận được email xác nhận đơn hàng</li>
                            <li>• Người bán sẽ chuẩn bị và gửi hàng trong thời gian sớm nhất</li>
                            <li>• Bạn có thể theo dõi trạng thái đơn hàng trong mục "Đơn hàng của tôi"</li>
                        </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/marketplace")}
                            className="border-pink-200 text-pink-600 hover:bg-pink-50 dark:border-pink-900 dark:hover:bg-pink-900/20"
                        >
                            Tiếp tục mua sắm
                        </Button>

                        <Button onClick={() => navigate("/feed/orders")} className="bg-pink-600 hover:bg-pink-700 text-white">
                            Xem đơn hàng
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
