import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group"
import { Label } from "../../components/ui/label"
import { Separator } from "../../components/ui/separator"
import { Checkbox } from "../../components/ui/checkbox"
import { useCart } from "../../contexts/CartContext"
import { useAuth } from "../../contexts/AuthContext"
import { checkoutOrder } from "../../services/orderService"
// import OrderSuccessModal from '../../components/common/OrderSuccessModal';
import OrderSuccessModal from "../../components/checkout/OrderSuccessModal"
import AddressForm from "../../components/checkout/AddressForm"
import { ShoppingBag, CreditCard, Truck, MapPin, Tag, Coins, MessageSquare, ArrowLeft, Shield, Edit } from "lucide-react"

export default function CheckoutPage() {
    const navigate = useNavigate()
    const { isAuthenticated, user } = useAuth()
    const { cart, getSelectedItems, getSelectedItemsTotals, fetchCart, clearSelectedItemsForCheckout } =
        useCart()

    const [loading, setLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [successData, setSuccessData] = useState(null)
    const [showAddressForm, setShowAddressForm] = useState(false)

    // Form states
    const [shippingAddress, setShippingAddress] = useState({
        fullName: user?.fullName || "",
        phone: user?.phone || "",
        address: "",
        ward: "",
        district: "",
        city: "",
        province: "",
        isDefault: false,
    })
    const [paymentMethod, setPaymentMethod] = useState("COD")
    const [shippingMethod, setShippingMethod] = useState("standard")
    const [notes, setNotes] = useState("")
    const [useCoin, setUseCoin] = useState(false)
    const [selectedVoucher, setSelectedVoucher] = useState("")

    // Get selected items and their totals
    const selectedItems = getSelectedItems()
    const selectedTotals = getSelectedItemsTotals()

    // Calculated values
    const subtotal = selectedTotals.subtotal
    const shippingFee = shippingMethod === "standard" ? 30000 : 50000
    const voucherDiscount = selectedVoucher === "FREESHIP" ? shippingFee : selectedVoucher === "DISCOUNT50K" ? 50000 : 0
    const coinDiscount = useCoin ? 20000 : 0
    const total = subtotal + shippingFee - voucherDiscount - coinDiscount

    // Fetch cart data on component mount
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login")
            return
        }
        fetchCart()
    }, [isAuthenticated])

    // Redirect if no items selected - chỉ redirect khi đã load xong cart
    useEffect(() => {
        if (cart && cart.items && cart.items.length > 0 && selectedItems.length === 0) {
            // toast.error("Vui lòng chọn sản phẩm để thanh toán")
            // Chỉ redirect nếu đã có cart items nhưng không có selected items
            navigate("/marketplace/cart")
        }
    }, [cart, selectedItems, navigate])

    // Check if shipping address is valid 
    const isAddressValid = () => {
        return (
            shippingAddress.fullName &&
            shippingAddress.phone &&
            shippingAddress.address &&
            shippingAddress.district &&
            shippingAddress.city
        )
    }

    // Handle address form submission
    const handleAddressSubmit = (address) => {
        setShippingAddress(address)
        setShowAddressForm(false)
    }

    // Handle order placement
    const handlePlaceOrder = async () => {
        if (!isAddressValid()) {
            toast.error("Vui lòng điền đầy đủ thông tin địa chỉ giao hàng")
            return
        }

        if (selectedItems.length === 0) {
            toast.error("Vui lòng chọn sản phẩm để thanh toán")
            return
        }

        try {
            setLoading(true)

            console.log("Đang gửi request checkout...")
            const response = await checkoutOrder({
                shippingAddress,
                paymentMethod,
                notes: `${notes}${shippingMethod === "express" ? " - Giao hàng nhanh" : ""}`,
            })

            console.log("Response từ checkout:", response)

            if (response && response.success) {
                console.log("Checkout thành công, hiển thị modal...")
                setSuccessData(response.data)
                setShowSuccess(true)
                // toast.success("Đặt hàng thành công!")
            } else {
                console.error("Checkout thất bại:", response)
                toast.error(response?.message || "Đặt hàng thất bại")
            }
        } catch (error) {
            console.error("Lỗi khi đặt hàng:", error)
            toast.error(error.message || "Đặt hàng thất bại, vui lòng thử lại sau")
        } finally {
            setLoading(false)
        }
    }

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price)
    }

    // Handle back to cart
    const handleBackToCart = () => {
        navigate("/marketplace/cart")
    }

    // Handle modal close
    const handleModalClose = () => {
        console.log("Đóng modal...")
        setShowSuccess(false)
        // Clear selected items sau khi modal đóng
        clearSelectedItemsForCheckout()
        // Fetch cart để cập nhật giỏ hàng
        fetchCart()
        // Navigate về trang orders
        navigate("/orders")
    }

    if (!cart || !cart.items) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-gray-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 bg-gray-200 dark:bg-zinc-700 rounded w-1/3"></div>
                        <div className="h-64 bg-gray-200 dark:bg-zinc-700 rounded"></div>
                        <div className="h-32 bg-gray-200 dark:bg-zinc-700 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (selectedItems.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-gray-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 p-4">
                <div className="max-w-4xl mx-auto text-center py-16">
                    <ShoppingBag className="w-16 h-16 mx-auto text-pink-400 mb-4" />
                    <h1 className="text-2xl font-bold mb-4">Chưa chọn sản phẩm</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">Vui lòng chọn sản phẩm trong giỏ hàng để thanh toán</p>
                    <Button onClick={() => navigate("/marketplace/cart")} className="bg-pink-600 hover:bg-pink-700">
                        Quay lại giỏ hàng
                    </Button>
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
                        <span className="hover:text-pink-500 cursor-pointer" onClick={() => navigate("/marketplace/cart")}>
                            Giỏ hàng
                        </span>
                        <span className="mx-2">›</span>
                        <span className="text-gray-900">Thanh toán</span>
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
                            onClick={handleBackToCart}
                            className="text-gray-600 hover:bg-white/50 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 mr-1" />
                            Quay lại giỏ hàng
                        </Button>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <ShoppingBag className="w-8 h-8 text-pink-600" />
                            Thanh Toán ({selectedTotals.itemCount} sản phẩm)
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 space-y-4">
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Left Column - Products and Address */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Products */}
                        <Card className="border-pink-200 dark:border-zinc-700 shadow-md">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <ShoppingBag className="w-5 h-5 text-pink-600" />
                                        Sản phẩm đã chọn ({selectedTotals.totalQuantity} sản phẩm)
                                    </h2>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleBackToCart}
                                        className="text-pink-600 border-pink-200 hover:bg-pink-50"
                                    >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Thay đổi
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    {selectedItems.map((item, index) => {
                                        const product = item.product
                                        const currentPrice = product?.discount
                                            ? product.price * (1 - product.discount / 100)
                                            : product?.price || 0

                                        return (
                                            <div key={index} className="flex gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                                                <div className="relative">
                                                    <img
                                                        src={product?.images?.[0] || "/placeholder.svg?height=80&width=80"}
                                                        alt={product?.name}
                                                        className="w-20 h-20 object-cover rounded-lg border border-pink-100 dark:border-zinc-700"
                                                    />
                                                    <div className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                                                        {item.quantity}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">{product?.name}</h3>
                                                    {Object.keys(item.selectedVariant || {}).length > 0 && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {Object.entries(item.selectedVariant)
                                                                .map(([key, value]) => `${key}: ${value}`)
                                                                .join(", ")}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-pink-600 font-semibold">{formatPrice(currentPrice)}</span>
                                                        {product?.discount > 0 && (
                                                            <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Shipping Address */}
                        <Card className="border-pink-200 dark:border-zinc-700 shadow-md">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-pink-600" />
                                    Địa chỉ giao hàng
                                </h2>

                                {showAddressForm ? (
                                    <AddressForm
                                        initialAddress={shippingAddress}
                                        onSubmit={handleAddressSubmit}
                                        onCancel={() => setShowAddressForm(false)}
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        {isAddressValid() ? (
                                            <div className="bg-pink-50 dark:bg-zinc-800 p-4 rounded-lg border border-pink-100 dark:border-zinc-700">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {shippingAddress.fullName} | {shippingAddress.phone}
                                                        </p>
                                                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                                                            {shippingAddress.address}, {shippingAddress.ward}, {shippingAddress.district},{" "}
                                                            {shippingAddress.city}, {shippingAddress.province}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setShowAddressForm(true)}
                                                        className="text-pink-600 border-pink-200 hover:bg-pink-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                                                    >
                                                        Thay đổi
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <MapPin className="w-12 h-12 mx-auto text-pink-300 mb-3" />
                                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                                    Vui lòng thêm địa chỉ giao hàng để tiếp tục
                                                </p>
                                                <Button
                                                    onClick={() => setShowAddressForm(true)}
                                                    className="bg-pink-600 hover:bg-pink-700 text-white"
                                                >
                                                    Thêm địa chỉ mới
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Shipping Method */}
                        <Card className="border-pink-200 dark:border-zinc-700 shadow-md">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <Truck className="w-5 h-5 text-pink-600" />
                                    Phương thức vận chuyển
                                </h2>

                                <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="space-y-3">
                                    <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-gray-200 dark:border-zinc-700">
                                        <RadioGroupItem value="standard" id="standard" />
                                        <Label htmlFor="standard" className="flex-1 cursor-pointer">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">Giao hàng tiêu chuẩn</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Nhận hàng trong 3-5 ngày</p>
                                                </div>
                                                <span className="font-semibold">{formatPrice(30000)}</span>
                                            </div>
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-gray-200 dark:border-zinc-700">
                                        <RadioGroupItem value="express" id="express" />
                                        <Label htmlFor="express" className="flex-1 cursor-pointer">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">Giao hàng nhanh</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Nhận hàng trong 1-2 ngày</p>
                                                </div>
                                                <span className="font-semibold">{formatPrice(50000)}</span>
                                            </div>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        <Card className="border-pink-200 dark:border-zinc-700 shadow-md">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-pink-600" />
                                    Phương thức thanh toán
                                </h2>

                                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                                    <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-gray-200 dark:border-zinc-700">
                                        <RadioGroupItem value="COD" id="cod" />
                                        <Label htmlFor="cod" className="flex-1 cursor-pointer">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">Thanh toán khi nhận hàng (COD)</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Thanh toán bằng tiền mặt khi nhận hàng
                                                    </p>
                                                </div>
                                            </div>
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-gray-200 dark:border-zinc-700">
                                        <RadioGroupItem value="BANK" id="bank" />
                                        <Label htmlFor="bank" className="flex-1 cursor-pointer">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">Chuyển khoản ngân hàng</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Thanh toán qua chuyển khoản ngân hàng
                                                    </p>
                                                </div>
                                            </div>
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-gray-200 dark:border-zinc-700">
                                        <RadioGroupItem value="MOMO" id="momo" />
                                        <Label htmlFor="momo" className="flex-1 cursor-pointer">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">Ví MoMo</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Thanh toán qua ví điện tử MoMo</p>
                                                </div>
                                            </div>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        <Card className="border-pink-200 dark:border-zinc-700 shadow-md">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-pink-600" />
                                    Ghi chú
                                </h2>
                                <Textarea
                                    placeholder="Ghi chú cho người bán (không bắt buộc)..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="resize-none"
                                    rows={3}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <Card className="border-pink-200 dark:border-zinc-700 shadow-md sticky top-4">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Tóm tắt đơn hàng</h2>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Tạm tính ({selectedTotals.totalQuantity} sản phẩm)
                                        </span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Phí vận chuyển</span>
                                        <span>{formatPrice(shippingFee)}</span>
                                    </div>

                                    {voucherDiscount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Giảm giá voucher</span>
                                            <span>-{formatPrice(voucherDiscount)}</span>
                                        </div>
                                    )}

                                    {coinDiscount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Giảm giá xu</span>
                                            <span>-{formatPrice(coinDiscount)}</span>
                                        </div>
                                    )}

                                    <Separator className="my-2" />

                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Tổng cộng</span>
                                        <span className="text-pink-600">{formatPrice(total)}</span>
                                    </div>
                                </div>

                                {/* Voucher */}
                                <div className="mt-6 space-y-3">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-pink-600" />
                                        Mã giảm giá
                                    </h3>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Nhập mã giảm giá"
                                            value={selectedVoucher}
                                            onChange={(e) => setSelectedVoucher(e.target.value.toUpperCase())}
                                            className="flex-1"
                                        />
                                        <Button
                                            variant="outline"
                                            className="border-pink-200 text-pink-600 hover:bg-pink-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                                        >
                                            Áp dụng
                                        </Button>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Mã khả dụng: FREESHIP, DISCOUNT50K</div>
                                </div>

                                {/* Coins */}
                                <div className="mt-4 flex items-center gap-2">
                                    <Checkbox id="use-coins" checked={useCoin} onCheckedChange={(checked) => setUseCoin(checked)} />
                                    <Label htmlFor="use-coins" className="flex items-center gap-1 cursor-pointer">
                                        <Coins className="w-4 h-4 text-yellow-500" />
                                        <span>Sử dụng 20.000 xu</span>
                                    </Label>
                                </div>

                                {/* Place Order Button */}
                                <Button
                                    className="w-full mt-6 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white py-6 text-lg font-semibold"
                                    disabled={loading || !isAddressValid() || selectedItems.length === 0}
                                    onClick={handlePlaceOrder}
                                >
                                    {loading ? "Đang xử lý..." : `Đặt hàng ngay (${selectedTotals.itemCount} sản phẩm)`}
                                </Button>

                                {/* Back to Cart Button */}
                                <Button
                                    variant="outline"
                                    className="w-full mt-3 border-pink-200 text-pink-600 hover:bg-pink-50"
                                    onClick={handleBackToCart}
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Thay đổi sản phẩm
                                </Button>

                                {/* Security Notice */}
                                <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>
                                        Thông tin của bạn được bảo mật an toàn. Chúng tôi cam kết bảo vệ thông tin cá nhân và thanh toán của
                                        bạn.
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccess && successData && <OrderSuccessModal orderData={successData} onClose={handleModalClose} />}
        </div>
    )
}

