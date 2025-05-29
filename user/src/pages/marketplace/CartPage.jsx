"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Separator } from "../../components/ui/separator"
import { Checkbox } from "../../components/ui/checkbox"
import { useCart } from "../../contexts/CartContext"
import { useAuth } from "../../contexts/AuthContext"
import { ShoppingCart, Trash2, Plus, Minus, Shield, Truck, Tag, CheckCircle2, ArrowLeft, Package, Star, MapPin, RefreshCw, } from "lucide-react"

export default function CartPage() {
  const navigate = useNavigate()
  const { isAuthenticated, setShowLoginModal } = useAuth()
  const {
    cart,
    loading,
    getTotalItems,
    getTotalPrice,
    getItemsCount,
    getSelectedItems,
    getSelectedItemsTotals,
    updateItemQuantity,
    removeItems,
    clearAllCart,
    cleanCartItems,
    fetchCart,
    toggleItemForCheckout,
    isItemSelectedForCheckout,
    updateSelectedItemsForCheckout,
    getItemKey,
  } = useCart()

  const [updatingItems, setUpdatingItems] = useState(new Set())

  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      navigate("/")
      return
    }
    fetchCart()
  }, [isAuthenticated])

  const updateQuantity = async (item, delta) => {
    const newQuantity = item.quantity + delta
    if (newQuantity < 1) return

    const itemKey = getItemKey(item)
    setUpdatingItems((prev) => new Set([...prev, itemKey]))

    try {
      await updateItemQuantity(item.product._id, item.selectedVariant, newQuantity)
      toast.success("Đã cập nhật số lượng")
    } catch (error) {
      toast.error(error.message || "Không thể cập nhật số lượng")
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(itemKey)
        return newSet
      })
    }
  }

  const removeSelectedItems = async () => {
    const selectedItems = getSelectedItems()
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn sản phẩm để xóa!")
      return
    }

    const itemsToRemove = selectedItems.map((item) => ({
      productId: item.product._id,
      selectedVariant: item.selectedVariant,
    }))

    try {
      await removeItems(itemsToRemove)
      toast.success(`Đã xóa ${itemsToRemove.length} sản phẩm`)
    } catch (error) {
      toast.error("Không thể xóa sản phẩm")
    }
  }

  const toggleSelectAll = () => {
    const selectedItems = getSelectedItems()
    if (selectedItems.length === cart.items?.length) {
      // Unselect all
      updateSelectedItemsForCheckout([])
    } else {
      // Select all
      const allItemKeys = cart.items?.map(getItemKey) || []
      updateSelectedItemsForCheckout(allItemKeys)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const getVariantText = (selectedVariant) => {
    if (!selectedVariant || Object.keys(selectedVariant).length === 0) {
      return ""
    }
    return Object.entries(selectedVariant)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")
  }

  const selectedTotals = getSelectedItemsTotals()
  const shippingFee = selectedTotals.itemCount > 0 ? 30000 : 0
  const finalTotal = selectedTotals.subtotal + shippingFee

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white py-3 px-4 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <nav className="text-sm text-gray-600">
              <span className="hover:text-pink-500 cursor-pointer" onClick={() => navigate("/marketplace")}>
                Marketplace
              </span>
              <span className="mx-2">›</span>
              <span className="text-gray-900">Giỏ hàng</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4">
          <div className="animate-pulse space-y-6">
            <div className="h-20 bg-gradient-to-r from-pink-100 to-pink-200 rounded-lg"></div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 dark:bg-zinc-700 rounded-lg"></div>
                ))}
              </div>
              <div className="h-80 bg-gray-200 dark:bg-zinc-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white py-3 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <nav className="text-sm text-gray-600">
            <span className="hover:text-pink-500 cursor-pointer" onClick={() => navigate("/marketplace")}>
              Marketplace
            </span>
            <span className="mx-2">›</span>
            <span className="text-gray-900">Giỏ hàng</span>
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
              onClick={() => navigate("/")}
              className="text-gray-600 hover:bg-white/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/60 rounded-full">
                <ShoppingCart className="w-8 h-8 text-pink-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Giỏ Hàng Của Bạn</h1>
                <p className="text-pink-700 text-sm flex items-center gap-2 mt-1">
                  <Package className="w-4 h-4" />
                  {getItemsCount()} loại sản phẩm • {getTotalItems()} sản phẩm • {selectedTotals.itemCount} đã chọn
                </p>
              </div>
            </div>
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={cleanCartItems}
                className="text-gray-600 hover:bg-white/50 transition-colors"
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Làm sạch giỏ hàng
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {!cart.items || cart.items.length === 0 ? (
          <Card className="text-center py-20">
            <CardContent>
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-pink-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Giỏ hàng trống</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Hãy khám phá hàng ngàn sản phẩm tuyệt vời và thêm vào giỏ hàng của bạn!
              </p>
              <Button
                onClick={() => navigate("/marketplace")}
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-8 py-3 text-lg"
              >
                Khám phá ngay
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Cart */}
            <div className="lg:col-span-2 space-y-4">
              {/* Actions Bar */}
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex flex-wrap gap-6 text-sm">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium transition-colors"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        {selectedTotals.itemCount === cart.items?.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                      </button>
                      <button
                        onClick={removeSelectedItems}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                        Xóa đã chọn ({selectedTotals.itemCount})
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Tổng tiền: {formatPrice(getTotalPrice())}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cart Items */}
              <div className="space-y-4">
                {cart.items?.map((item, index) => {
                  const itemKey = getItemKey(item)
                  const isSelected = isItemSelectedForCheckout(item)
                  const isUpdating = updatingItems.has(itemKey)
                  const product = item.product
                  const currentPrice =
                    product?.discount > 0 ? product.price * (1 - product.discount / 100) : product?.price || 0

                  return (
                    <Card
                      key={itemKey}
                      className={`shadow-md transition-all duration-300 ${isSelected ? "ring-2 ring-pink-400 shadow-pink-200" : "hover:shadow-lg"
                        }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          {/* Checkbox */}
                          <div className="flex items-start pt-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleItemForCheckout(item)}
                              disabled={isUpdating}
                              className="w-5 h-5 border-pink-300 data-[state=checked]:bg-pink-600"
                            />
                          </div>

                          {/* Product Image */}
                          <div className="relative">
                            <img
                              src={product?.images?.[0] || "/placeholder.svg?height=120&width=120"}
                              alt={product?.name}
                              className="w-28 h-28 object-cover rounded-xl border-2 border-pink-100 shadow-md"
                            />
                            {product?.discount > 0 && (
                              <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2 py-1">
                                -{product.discount}%
                              </Badge>
                            )}
                  
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 mb-2">
                                  {product?.name}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>Cửa hàng: </span>
                                  <span className="text-pink-600 font-medium">
                                    {product?.seller?.name || "HULO Store"}
                                  </span>
                                </div>
                                {getVariantText(item.selectedVariant) && (
                                  <p className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full inline-block">
                                    {getVariantText(item.selectedVariant)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Features */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                <Truck className="w-3 h-3 mr-1" />
                                Miễn phí ship
                              </Badge>
                              {product?.discount > 0 && (
                                <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                                  <Tag className="w-3 h-3 mr-1" />
                                  Giảm {product.discount}%
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                <Star className="w-3 h-3 mr-1" />
                                Chính hãng
                              </Badge>
                            </div>

                            {/* Price and Quantity */}
                            <div className="flex justify-between items-end">
                              <div>
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl font-bold text-pink-600">{formatPrice(currentPrice)}</span>
                                  {product?.price > currentPrice && (
                                    <span className="text-lg text-gray-400 line-through">
                                      {formatPrice(product.price)}
                                    </span>
                                  )}
                                </div>
                                {product?.stock <= 5 && product?.stock > 0 && (
                                  <p className="text-sm text-orange-500 mt-1">Chỉ còn {product.stock} sản phẩm</p>
                                )}
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item, -1)}
                                  disabled={isUpdating || item.quantity <= 1}
                                  className="w-10 h-10 rounded-full border-pink-200 hover:bg-pink-50"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-12 text-center font-bold text-lg">
                                  {isUpdating ? "..." : item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item, 1)}
                                  disabled={isUpdating || item.quantity >= (product?.stock || 999)}
                                  className="w-10 h-10 rounded-full border-pink-200 hover:bg-pink-50"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-4">
              {/* Order Summary */}
              <Card className="shadow-lg sticky top-4">
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
                    <div className="p-2 bg-pink-100 rounded-full">
                      <ShoppingCart className="w-5 h-5 text-pink-600" />
                    </div>
                    Tóm tắt đơn hàng
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm">
                      <span>Tạm tính ({selectedTotals.itemCount} sản phẩm):</span>
                      <span className="font-medium">{formatPrice(selectedTotals.subtotal)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Phí vận chuyển:</span>
                      <span className={shippingFee === 0 ? "text-green-600 font-medium" : "font-medium"}>
                        {shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}
                      </span>
                    </div>

                    <Separator className="bg-pink-200" />

                    <div className="flex justify-between font-bold text-xl">
                      <span>Tổng cộng:</span>
                      <span className="text-pink-600">{formatPrice(finalTotal)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold py-4 text-lg shadow-lg"
                    disabled={selectedTotals.itemCount === 0}
                    onClick={() => {
                      navigate("/marketplace/checkout")
                    }}
                  >
                    Thanh toán ({selectedTotals.itemCount})
                  </Button>

                  <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200">
                    <div className="flex items-center gap-2 text-sm text-pink-700 mb-2">
                      <Shield className="w-5 h-5" />
                      <span className="font-semibold">Cam kết bảo vệ</span>
                    </div>
                    <p className="text-xs text-pink-600">
                      • Hoàn tiền 100% nếu sản phẩm không đúng mô tả
                      <br />• Hỗ trợ đổi trả trong 7 ngày
                      <br />• Bảo hành chính hãng
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-4">Thao tác nhanh</h4>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-gray-600 hover:text-pink-600"
                      onClick={() => navigate("/marketplace")}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Tiếp tục mua sắm
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-gray-600 hover:text-red-600"
                      onClick={async () => {
                        if (window.confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?")) {
                          try {
                            await clearAllCart()
                            toast.success("Đã xóa toàn bộ giỏ hàng")
                          } catch (error) {
                            toast.error("Không thể xóa giỏ hàng")
                          }
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa toàn bộ giỏ hàng
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
