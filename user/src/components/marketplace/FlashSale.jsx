import React from 'react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import image from '../../assets/cappuccino-cafe-cua-y.jpg'

export default function FlashSale() {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-red-600">🔥 Flash Sale</h2>
        <Button variant="link" className="text-sm text-blue-600">Xem tất cả</Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" onClick={()=>navigate(`/marketplace/products/${5}`)}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="text-sm text-center">
            <img
              src={image}
              className="w-full h-24 object-cover rounded mb-2"
            />
            <p>Sản phẩm {i + 1}</p>
            <p className="text-red-500 font-semibold">{(i + 1) * 89}.000đ</p>
          </div>
        ))}
      </div>
    </div>
  );
}
