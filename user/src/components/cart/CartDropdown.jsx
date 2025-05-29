"use client"

import { useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { ShoppingBag, Trash2, LogIn } from "lucide-react"
import { Button } from "../ui/button"
import { useCart } from "../../contexts/CartContext"
import { useAuth } from "../../contexts/AuthContext"
import { toast } from "sonner"
import CartItem from "./CartItem"

const CartDropdown = () => {
    const {
        cart,
        loading,
        showCartDropdown,
        closeCartDropdown,
        getTotalItems,
        getTotalPrice,
        clearAllCart,
        selectAllItemsForCheckout,
    } = useCart()
    const { isAuthenticated, setShowLoginModal } = useAuth()

    const modalRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                closeCartDropdown()
            }
        }

        if (showCartDropdown) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [showCartDropdown, closeCartDropdown])

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price)
    }

    const handleClearCart = async () => {
        if (window.confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?")) {
            try {
                await clearAllCart()
                toast.success("Đã xóa toàn bộ giỏ hàng")
            } catch (error) {
                console.error("Lỗi xóa giỏ hàng:", error)
                toast.error(error.message || "Không thể xóa giỏ hàng")
            }
        }
    }

    const handleLoginClick = () => {
        closeCartDropdown()
        setShowLoginModal(true)
    }

    const handleCheckoutClick = () => {
        // Select all items when clicking checkout from dropdown
        selectAllItemsForCheckout()
        closeCartDropdown()
    }

    if (!showCartDropdown) return null

    // Hiển thị khi chưa đăng nhập
    if (!isAuthenticated) {
        return (
            <div
                className="absolute right-4 top-16 z-50 w-96 rounded-lg shadow-xl bg-white dark:bg-zinc-900 border border-pink-200 dark:border-zinc-700"
                ref={modalRef}
            >
                <div className="p-8 text-center">
                    <LogIn className="h-12 w-12 text-pink-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Đăng nhập để xem giỏ hàng</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng và mua sắm
                    </p>
                    <Button onClick={handleLoginClick} className="bg-pink-600 hover:bg-pink-700 text-white">
                        Đăng nhập ngay
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div
            className="absolute right-4 top-16 z-50 w-96 rounded-lg shadow-xl bg-white dark:bg-zinc-900 border border-pink-200 dark:border-zinc-700"
            ref={modalRef}
        >
            {/* Header */}
            <div className="p-4 border-b border-pink-100 dark:border-zinc-700 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-zinc-800 dark:to-zinc-800 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-pink-600" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Giỏ hàng</h2>
                        <span className="bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full font-medium">
                            {getTotalItems()}
                        </span>
                    </div>

                    {cart.items?.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-red-500 hover:bg-red-50"
                            onClick={handleClearCart}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Đang tải...</p>
                    </div>
                ) : cart.items?.length === 0 ? (
                    <div className="p-8 text-center">
                        <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Giỏ hàng của bạn đang trống</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            Hãy thêm sản phẩm yêu thích vào giỏ hàng nhé!
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-pink-100 dark:divide-zinc-700">
                        {cart.items.map((item, index) => (
                            <CartItem key={`${item.product?._id}-${index}`} item={item} />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {cart.items?.length > 0 && (
                <div className="p-4 border-t border-pink-100 dark:border-zinc-700 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-zinc-800 dark:to-zinc-800 rounded-b-lg">
                    {/* Tổng tiền */}
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tổng cộng:</span>
                        <span className="text-lg font-bold text-pink-600">{formatPrice(getTotalPrice())}</span>
                    </div>

                    {/* Buttons */}
                    <div className="space-y-2">
                        <Link to="/marketplace/cart" onClick={closeCartDropdown} className="block">
                            <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">Xem giỏ hàng</Button>
                        </Link>

                        <Link to="/marketplace/checkout" onClick={handleCheckoutClick} className="block">
                            <Button variant="outline" className="w-full border-pink-600 text-pink-600 hover:bg-pink-50">
                                Thanh toán tất cả
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CartDropdown
