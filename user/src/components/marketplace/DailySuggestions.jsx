import React from 'react';
import { useNavigate } from 'react-router-dom';
import quaBong from '../../assets/QuaBong.png'

export default function DailySuggestions() {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-blue-600 mb-4">🎯 Gợi ý hôm nay</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="text-sm" onClick={()=>navigate(`/marketplace/products/${5}`)}>
            <img src={quaBong} className="w-full h-36 object-cover rounded mb-2" />
            <p>Sản phẩm gợi ý {i + 1}</p>
            <p className="text-gray-500 text-xs">Giá: {(i + 2) * 99}.000đ</p>
            <button className="w-full mt-1 py-1 border rounded hover:bg-gray-100">Mua ngay</button>
          </div>
        ))}
      </div>
    </div>
  );
}
