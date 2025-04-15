import React from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useState } from 'react';
import OrderSuccessModal from '../../components/common/OrderSuccessModal';

export default function CheckoutPage() {
    const [useCoin, setUseCoin] = useState(true);
    const [selectedShipping, setSelectedShipping] = useState('ghn');
    const [selectedPayment, setSelectedPayment] = useState('cod');
    const [showSuccess, setShowSuccess] = useState(false);

    const cart = [
        {
        name: 'Áo Hoodie Local Brand',
        image: 'https://source.unsplash.com/300x200/?hoodie',
        quantity: 2,
        price: 199000,
        },
            {
            name: 'Giày sneaker trắng',
            image: 'https://source.unsplash.com/300x200/?sneaker',
            quantity: 1,
            price: 459000,
            },
    ];

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = 30000;
    const discount = 50000;
    const coinDiscount = useCoin ? 20000 : 0;
    const total = subtotal + shippingFee - discount - coinDiscount;

    return (
        <div className="min-h-screen p-4 space-y-6 bg-gray-100">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">🧾 Thanh Toán</h1>

        {/* Sản phẩm */}
        <Card>
            <CardContent className="p-4 space-y-4">
            <h2 className="text-lg font-semibold mb-2">🛍️ Sản phẩm</h2>
            {cart.map((item, i) => (
                <div key={i} className="flex gap-4 items-center border-b pb-3">
                <img src={item.image} alt={item.name} className="w-24 h-20 object-cover rounded" />
                <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                </div>
                <p className="font-semibold text-red-500">{(item.price * item.quantity).toLocaleString()}đ</p>
                </div>
            ))}
            </CardContent>
        </Card>

        {/* Địa chỉ động */}
        <Card>
            <CardContent className="p-4 space-y-2 text-sm text-gray-700">
            <h2 className="text-lg font-semibold">📍 Địa chỉ nhận hàng</h2>
            <p><strong>Tên:</strong> Nguyễn Văn A</p>
            <p><strong>SĐT:</strong> 0901234567</p>
            <p><strong>Địa chỉ:</strong> 123 Đường ABC, Quận 1, TP. HCM</p>
            <Button variant="link" className="text-blue-600 px-0">Thay đổi địa chỉ</Button>
            </CardContent>
        </Card>

        {/* Voucher + coin + lời nhắn */}
        <Card>
            <CardContent className="p-4 space-y-3 text-sm">
            <h2 className="text-lg font-semibold">🎁 Ưu đãi & Lời nhắn</h2>

            <div className="flex justify-between items-center">
                <span>Chọn voucher:</span>
                <select className="border rounded px-2 py-1">
                <option value="">-- Không áp dụng --</option>
                <option value="voucher1">Giảm 50k đơn từ 300k</option>
                <option value="voucher2">Freeship toàn quốc</option>
                </select>
            </div>

            <div className="flex items-center gap-2">
                <input type="checkbox" checked={useCoin} onChange={() => setUseCoin(!useCoin)} />
                <label>Dùng 20.000đ từ xu</label>
            </div>

            <textarea placeholder="Lời nhắn cho Shop..." className="w-full border rounded p-2 text-sm" rows={3} />
            </CardContent>
        </Card>

        {/* Vận chuyển & Thanh toán */}
        <Card>
            <CardContent className="p-4 space-y-4 text-sm">
            <h2 className="text-lg font-semibold">🚚 Vận chuyển & 💳 Thanh toán</h2>

            <div>
                <p className="mb-1 font-medium">Phương thức vận chuyển:</p>
                <select value={selectedShipping} onChange={(e) => setSelectedShipping(e.target.value)} className="border rounded p-2 w-full">
                <option value="ghn">GHN - Giao tiêu chuẩn (30.000đ)</option>
                <option value="express">J&T - Giao nhanh (50.000đ)</option>
                </select>
            </div>

            <div>
                <p className="mb-1 font-medium">Phương thức thanh toán:</p>
                <select value={selectedPayment} onChange={(e) => setSelectedPayment(e.target.value)} className="border rounded p-2 w-full">
                <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                <option value="bank">Chuyển khoản ngân hàng</option>
                <option value="momo">Ví MoMo</option>
                </select>
            </div>
            </CardContent>
        </Card>

        {/* Tổng kết & đặt hàng */}
        <Card>
            <CardContent className="p-4 space-y-3 text-sm text-gray-700">
            <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span>{shippingFee.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between">
                <span>Voucher giảm</span>
                <span className="text-green-600">-{discount.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between">
                <span>Xu giảm</span>
                <span className="text-green-600">-{coinDiscount.toLocaleString()}đ</span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-base">
                <span>Tổng cộng</span>
                <span className="text-red-500">{total.toLocaleString()}đ</span>
            </div>

            <Button className="w-full mt-4" onClick={() => setShowSuccess(true)}>
                ✅ Đặt hàng
            </Button>

            </CardContent>
        </Card>

        <OrderSuccessModal show={showSuccess} onClose={() => setShowSuccess(false)} />

        </div>
    );
}

