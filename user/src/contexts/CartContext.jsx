"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { toast } from "sonner"
import {
    getCart,
    getCartCount,
    addToCart,
    updateCartItem,
    removeCartItem,
    removeMultipleCartItems,
    clearCart,
    cleanCart,
} from "../services/cartService"
import { useAuth } from "./AuthContext"

const CartContext = createContext()

export function CartProvider({ children }) {
    const [cart, setCart] = useState({
        items: [],
        totalItems: 0,
        totalPrice: 0,
        itemsCount: 0,
    })
    const [loading, setLoading] = useState(false)
    const [showCartDropdown, setShowCartDropdown] = useState(false)
    const [selectedItemsForCheckout, setSelectedItemsForCheckout] = useState(new Set()) // Track selected items for checkout
    const { isAuthenticated, user } = useAuth()

    // Helper function to create item key
    const getItemKey = (item) => {
        if (typeof item === "string") return item // Already a key
        return `${item.product?._id || item.productId}-${JSON.stringify(item.selectedVariant || {})}`
    }

    // Tính tổng số lượng sản phẩm trong giỏ (từ backend)
    const getTotalItems = () => {
        return cart.totalItems || 0
    }

    // Tính tổng tiền (từ backend)
    const getTotalPrice = () => {
        return cart.totalPrice || 0
    }

    // Lấy số lượng loại sản phẩm khác nhau
    const getItemsCount = () => {
        return cart.itemsCount || 0
    }

    // Get selected items for checkout
    const getSelectedItems = () => {
        return cart.items?.filter((item) => selectedItemsForCheckout.has(getItemKey(item))) || []
    }

    // Calculate totals for selected items only
    const getSelectedItemsTotals = () => {
        const selected = getSelectedItems()

        let subtotal = 0
        let totalQuantity = 0

        selected.forEach((item) => {
            const currentPrice =
                item.product?.discount > 0 ? item.product.price * (1 - item.product.discount / 100) : item.product?.price || 0

            subtotal += currentPrice * item.quantity
            totalQuantity += item.quantity
        })

        return {
            items: selected,
            subtotal: Math.round(subtotal),
            totalQuantity,
            itemCount: selected.length,
        }
    }

    // Lấy giỏ hàng từ API
    const fetchCart = async () => {
        if (!isAuthenticated) {
            setCart({ items: [], totalItems: 0, totalPrice: 0, itemsCount: 0 })
            setSelectedItemsForCheckout(new Set())
            return
        }

        try {
            setLoading(true)
            const response = await getCart()

            if (response.success && response.data) {
                setCart(response.data)
            } else {
                setCart({ items: [], totalItems: 0, totalPrice: 0, itemsCount: 0 })
                setSelectedItemsForCheckout(new Set())
            }
        } catch (error) {
            console.error("Lỗi khi lấy giỏ hàng:", error)
            setCart({ items: [], totalItems: 0, totalPrice: 0, itemsCount: 0 })
            setSelectedItemsForCheckout(new Set())
        } finally {
            setLoading(false)
        }
    }

    // Lấy chỉ số lượng sản phẩm (cho badge header)
    const fetchCartCount = async () => {
        if (!isAuthenticated) {
            return
        }

        try {
            const response = await getCartCount()
            if (response.success && response.data) {
                setCart((prev) => ({
                    ...prev,
                    totalItems: response.data.totalItems,
                    itemsCount: response.data.itemsCount,
                }))
            }
        } catch (error) {
            console.error("Lỗi khi lấy số lượng giỏ hàng:", error)
        }
    }

    // Thêm sản phẩm vào giỏ
    const addItemToCart = async (productId, quantity = 1, selectedVariant = {}) => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng")
            throw new Error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng")
        }

        try {
            setLoading(true)
            const response = await addToCart({ productId, quantity, selectedVariant })

            if (response.success && response.data) {
                // Backend trả về cart đã populate đầy đủ
                setCart(response.data)
                toast.success("Đã thêm sản phẩm vào giỏ hàng")
                return response
            } else {
                throw new Error(response.message || "Lỗi khi thêm vào giỏ hàng")
            }
        } catch (error) {
            console.error("Lỗi khi thêm vào giỏ hàng:", error)
            toast.error(error.message || "Không thể thêm sản phẩm vào giỏ hàng")
            throw error
        } finally {
            setLoading(false)
        }
    }

    // Mua ngay - thêm sản phẩm vào giỏ và tự động chọn (nhưng không xóa các lựa chọn khác)
    const buyNow = async (productId, quantity = 1, selectedVariant = {}) => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để mua hàng")
            throw new Error("Vui lòng đăng nhập để mua hàng")
        }

        try {
            setLoading(true)
            const response = await addToCart({ productId, quantity, selectedVariant })

            if (response.success && response.data) {
                setCart(response.data)

                // Tạo key để identify item này
                const itemKey = `${productId}-${JSON.stringify(selectedVariant)}`

                // Thêm item này vào danh sách đã chọn (không xóa các item khác đã chọn trước đó)
                setSelectedItemsForCheckout((prev) => {
                    const newSet = new Set(prev)
                    newSet.add(itemKey)
                    return newSet
                })

                toast.success("Đã thêm sản phẩm vào giỏ hàng")
                return response
            } else {
                throw new Error(response.message || "Lỗi khi thêm vào giỏ hàng")
            }
        } catch (error) {
            console.error("Lỗi khi mua ngay:", error)
            toast.error(error.message || "Không thể thêm sản phẩm vào giỏ hàng")
            throw error
        } finally {
            setLoading(false)
        }
    }

    // Select all items for checkout (from CartDropdown)
    const selectAllItemsForCheckout = () => {
        const allItemKeys = cart.items?.map(getItemKey) || []
        setSelectedItemsForCheckout(new Set(allItemKeys))
    }

    // Update selected items for checkout
    const updateSelectedItemsForCheckout = (itemKeys) => {
        setSelectedItemsForCheckout(new Set(itemKeys))
    }

    // Toggle item selection for checkout
    const toggleItemForCheckout = (item) => {
        const itemKey = getItemKey(item)
        setSelectedItemsForCheckout((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(itemKey)) {
                newSet.delete(itemKey)
            } else {
                newSet.add(itemKey)
            }
            return newSet
        })
    }

    // Check if item is selected for checkout
    const isItemSelectedForCheckout = (item) => {
        const itemKey = getItemKey(item)
        return selectedItemsForCheckout.has(itemKey)
    }

    // Cập nhật số lượng sản phẩm
    const updateItemQuantity = async (productId, selectedVariant, quantity) => {
        try {
            setLoading(true)
            const response = await updateCartItem({ productId, selectedVariant, quantity })

            if (response.success && response.data) {
                setCart(response.data)
                return response
            } else {
                throw new Error(response.message || "Lỗi khi cập nhật giỏ hàng")
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật giỏ hàng:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    // Xóa một sản phẩm khỏi giỏ
    const removeItem = async (productId, selectedVariant = {}) => {
        try {
            setLoading(true)
            const response = await removeCartItem({ productId, selectedVariant })

            if (response.success && response.data) {
                setCart(response.data)

                // Xóa khỏi selectedItemsForCheckout nếu có
                const itemKey = `${productId}-${JSON.stringify(selectedVariant)}`
                
                setSelectedItemsForCheckout((prev) => {
                    const newSet = new Set(prev)
                    newSet.delete(itemKey)
                    return newSet
                })

                return response
            } else {
                throw new Error(response.message || "Lỗi khi xóa sản phẩm")
            }
        } catch (error) {
            console.error("Lỗi khi xóa sản phẩm:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    // Xóa nhiều sản phẩm khỏi giỏ
    const removeItems = async (items) => {
        try {
            setLoading(true)
            const response = await removeMultipleCartItems(items)

            if (response.success && response.data) {
                setCart(response.data)

                // Xóa các items khỏi selectedItemsForCheckout
                setSelectedItemsForCheckout((prev) => {
                    const newSet = new Set(prev)
                    items.forEach((item) => {
                        const itemKey = `${item.productId}-${JSON.stringify(item.selectedVariant)}`
                        newSet.delete(itemKey)
                    })
                    return newSet
                })

                return response
            } else {
                throw new Error(response.message || "Lỗi khi xóa sản phẩm")
            }
        } catch (error) {
            console.error("Lỗi khi xóa sản phẩm:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    // Xóa toàn bộ giỏ hàng
    const clearAllCart = async () => {
        try {
            setLoading(true)
            const response = await clearCart()

            if (response.success) {
                setCart({ items: [], totalItems: 0, totalPrice: 0, itemsCount: 0 })
                setSelectedItemsForCheckout(new Set()) // Clear selected items
                return response
            } else {
                throw new Error(response.message || "Lỗi khi xóa giỏ hàng")
            }
        } catch (error) {
            console.error("Lỗi khi xóa giỏ hàng:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    // Làm sạch giỏ hàng (xóa sản phẩm không còn active)
    const cleanCartItems = async () => {
        try {
            setLoading(true)
            const response = await cleanCart()

            if (response.success) {
                // Sau khi clean, fetch lại cart để cập nhật
                await fetchCart()

                if (response.data?.removedCount > 0) {
                    toast.info(`Đã loại bỏ ${response.data.removedCount} sản phẩm không còn khả dụng`)
                }

                return response
            } else {
                throw new Error(response.message || "Lỗi khi làm sạch giỏ hàng")
            }
        } catch (error) {
            console.error("Lỗi khi làm sạch giỏ hàng:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    // Mở/đóng dropdown
    const toggleCartDropdown = () => {
        if (!isAuthenticated) {
            // Mở modal đăng nhập thay vì dropdown
            if (window.openLoginModal) {
                window.openLoginModal()
            }
            return
        }
        setShowCartDropdown(!showCartDropdown)
    }

    const closeCartDropdown = () => {
        setShowCartDropdown(false)
    }

    // Clear selected items for checkout (gọi sau khi checkout thành công)
    const clearSelectedItemsForCheckout = () => {
        setSelectedItemsForCheckout(new Set())
    }

    // Lấy giỏ hàng khi user đăng nhập
    useEffect(() => {
        if (isAuthenticated && user) {
            fetchCart()
        } else {
            setCart({ items: [], totalItems: 0, totalPrice: 0, itemsCount: 0 })
            setSelectedItemsForCheckout(new Set())
            setShowCartDropdown(false)
        }
    }, [isAuthenticated, user])

    // Tự động làm sạch giỏ hàng khi load
    useEffect(() => {
        if (isAuthenticated && cart.items?.length > 0) {
            // Tự động clean cart sau 1 giây để không ảnh hưởng UX
            const timer = setTimeout(() => {
                cleanCartItems()
            }, 1000)

            return () => clearTimeout(timer)
        }
    }, [isAuthenticated])

    return (
        <CartContext.Provider
            value={{
                cart,
                loading,
                showCartDropdown,
                selectedItemsForCheckout,
                getTotalItems,
                getTotalPrice,
                getItemsCount,
                getSelectedItems,
                getSelectedItemsTotals,
                addItemToCart,
                buyNow,
                selectAllItemsForCheckout,
                updateSelectedItemsForCheckout,
                toggleItemForCheckout,
                isItemSelectedForCheckout,
                updateItemQuantity,
                removeItem,
                removeItems,
                clearAllCart,
                cleanCartItems,
                toggleCartDropdown,
                closeCartDropdown,
                fetchCart,
                fetchCartCount,
                clearSelectedItemsForCheckout,
                getItemKey,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
