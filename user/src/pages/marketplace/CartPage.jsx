import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function CartPage() {
  const navigate = useNavigate();

  const [cart, setCart] = useState([
    {
      id: 1,
      name: 'Áo Hoodie Local Brand',
      image: 'https://source.unsplash.com/300x200/?hoodie',
      price: 199000,
      quantity: 2,
      checked: true,
    },
    {
      id: 2,
      name: 'Giày sneaker trắng',
      image: 'https://source.unsplash.com/300x200/?sneaker',
      price: 459000,
      quantity: 1,
      checked: true,
    },
  ]);
  const allChecked = cart.every((item) => item.checked);

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const toggleCheck = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleAll = () => {
    const updated = cart.map((item) => ({ ...item, checked: !allChecked }));
    setCart(updated);
  };
  
  const removeSelected = () => {
    const updated = cart.filter((item) => !item.checked);
    setCart(updated);
  };
  

  const subtotal = cart
    .filter((item) => item.checked)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen p-4 space-y-6 bg-gray-100">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">🛒 Giỏ Hàng</h1>

      {/* Chọn tất cả hoặc xóa tất cả sản phẩm */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-3 text-sm">
            <button onClick={toggleAll} className="text-blue-600 underline">
            {allChecked ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
            <button onClick={removeSelected} className="text-red-600 underline">
            Xoá sản phẩm đã chọn
            </button>
        </div>
        <p className="text-sm text-gray-500">Đã chọn: {cart.filter(i => i.checked).length}</p>
      </div>

      {/* Danh sách sản phẩm */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {cart.length === 0 && (
            <p className="text-center text-sm text-gray-500">Không có sản phẩm nào trong giỏ hàng.</p>
          )}
          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-4 border-b pb-3">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleCheck(item.id)}
              />
              <img src={item.image} alt={item.name} className="w-24 h-20 object-cover rounded" />
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-red-500 font-semibold">{item.price.toLocaleString()}đ</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, -1)}>-</Button>
                  <span>{item.quantity}</span>
                  <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, 1)}>+</Button>
                </div>
              </div>
              <div className="text-right space-y-2">
                <p className="font-semibold text-sm text-gray-600">
                  Tổng: {(item.price * item.quantity).toLocaleString()}đ
                </p>
                <Button size="sm" variant="destructive" onClick={() => removeItem(item.id)}>Xoá</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tổng tiền + thanh toán */}
      <Card>
        <CardContent className="flex flex-col md:flex-row justify-between items-center p-4 gap-4">
          <div className="text-sm text-gray-700">
            <span className="mr-2">Tổng cộng:</span>
            <span className="text-red-500 font-bold text-lg">{subtotal.toLocaleString()}đ</span>
          </div>
          <Button
            disabled={subtotal === 0}
            onClick={() => navigate(`/marketplace/checkout`)}
          >
            Tiến hành thanh toán
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
