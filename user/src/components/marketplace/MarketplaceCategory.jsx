import React from 'react';
import thoiTrang from '../../assets/ThoiTrang.png'
import dienThoai from '../../assets/Dienthoai.png'
import doGiaDung from '../../assets/DoGiaDung.png'
import myPham from '../../assets/MyPham.png'
import theThao from '../../assets/TheThao.png'
import MAyTinh from '../../assets/MAyTinh.png'
import meBe from '../../assets/EmBe.png'
import sach from '../../assets/Sach.png'

const categories = [
  { name: 'Thời trang', image: thoiTrang },
  { name: 'Điện thoại', image: dienThoai},
  { name: 'Đồ gia dụng', image: doGiaDung },
  { name: 'Mỹ phẩm', image: myPham },
  { name: 'Thể thao', image: theThao },
  { name: 'Máy tính', image: MAyTinh },
  { name: 'Mẹ & bé', image: meBe },
  { name: 'Sách', image: sach },
];

export default function MarketplaceCategory() {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">📚 Danh mục nổi bật</h2>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
        {categories.map((cat, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center text-sm hover:scale-105 cursor-pointer transition"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden mb-2 shadow">
              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
            </div>
            <span className="text-gray-700">{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
