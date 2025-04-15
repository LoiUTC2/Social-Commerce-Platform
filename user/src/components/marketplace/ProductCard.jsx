import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import React from 'react';
import { Star } from 'lucide-react';
import product from '../../assets/Orange Phoenix Animal Gaming Logo.png'
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ image, name, price, rating, reviewCount, onBuy, onAddToCart }) {
  const navigate = useNavigate();
  return (
    <Card className="hover:shadow-lg transition duration-200" onClick={()=>navigate(`/marketplace/products/${5}`)}>
      <CardContent className="p-4">
        <img
          src={product}
          alt={name}
          className="w-full h-40 object-cover rounded-xl mb-3"
        />
        <p className="text-sm font-semibold line-clamp-2 mb-1">{name}Sản phẩm VIPPRO</p>
        <p className="text-sm text-red-500 font-medium mb-2">{price} 600000</p>

        {/* Rating */}
        <div className="flex items-center text-yellow-500 text-xs mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              fill={i < Math.round(rating) ? '#facc15' : 'none'}
              stroke="#facc15"
              className={i < rating ? 'fill-yellow-400' : 'fill-none'}
            />
          ))}
          <span className="ml-1 text-gray-500">({reviewCount}12)</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="flex-grow text-base px-6 py-3" onClick={onBuy}>Mua ngay</Button>
          <Button variant="outline" className="text-sm px-4 py-2" onClick={onAddToCart}>Thêm vào giỏ hàng</Button>
        </div>
      </CardContent>
    </Card>
  );
}

