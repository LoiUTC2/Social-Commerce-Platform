import React from 'react';
import imageShop1 from '../../assets/avtshop1.png'
import imageShop2 from '../../assets/avatarshop2.png'
import imageShop3 from '../../assets/avtshop3.png'

export default function TopShops() {
  const shops = [
    { name: 'SneakerZone', img: imageShop1 },
    { name: 'BaloStore', img: imageShop2 },
    { name: 'FashionHouse', img: imageShop3 },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-lg font-semibold text-blue-600 mb-4">🏪 Shop Uy Tín</h2>
      <div className="flex gap-5 overflow-x-auto justify-center">
        {shops.map((shop, i) => (
          <div key={i} className="flex flex-col items-center gap-3 min-w-[150px]">
            <img src={shop.img} alt={shop.name} className="w-10 h-10 rounded-full object-cover" />
            <p className="text-sm font-medium">{shop.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
