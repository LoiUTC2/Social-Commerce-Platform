import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import DailySuggestions from '../../components/marketplace/DailySuggestions';
import { useNavigate } from 'react-router-dom';
import aoMTP from '../../assets/AoMTP.png'

export default function ProductDetail() {
  const { productId } = useParams();
  const [quantity, setQuantity] = useState(1);

  const navigate = useNavigate();


  const product = {
    name: `Sản phẩm demo #${productId}`,
    price: 399000,
    description: `Sản phẩm chất lượng cao, phù hợp mọi nhu cầu.`,
    // image: `https://source.unsplash.com/600x400/?product,${productId}`,
    image: aoMTP,
    sold: 134,
    rating: 4.2,
    reviews: [
      { name: 'Nguyễn Văn A', content: 'Sản phẩm rất tốt, giao hàng nhanh!', rating: 5 },
      { name: 'Trần Thị B', content: 'Hàng đẹp đúng như mô tả.', rating: 4 },
    ],
  };

  const shop = {
    name: 'Shop ABC',
    avatar: 'https://i.pravatar.cc/60',
    rating: 4.8,
    products: 320,
    followers: 13500,
    joined: '03/2022',
  };

  const handleIncrease = () => setQuantity((prev) => prev + 1);
  const handleDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="min-h-screen p-4 space-y-6 bg-gray-100">
      {/* Thông tin sản phẩm */}
      <Card>
        <CardContent className="p-6 flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/2">
            <img src={product.image} alt={product.name} className="w-full h-80 object-cover rounded-xl" />
          </div>
          <div className="flex-1 space-y-4">
            <h1 className="text-2xl font-semibold text-gray-800">{product.name}</h1>
            <p className="text-red-500 text-xl font-bold">{product.price.toLocaleString()}đ</p>
            <div className="flex items-center text-sm text-gray-500">
              <span className="mr-2">Đánh giá: {renderStars(product.rating)}</span> | <span className="ml-2">Đã bán: {product.sold}</span>
            </div>

            {/* Chọn số lượng */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm">Số lượng:</span>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-16 border rounded px-2 py-1"
              />
              {/* <div className="flex items-center border rounded overflow-hidden w-fit">
                <button onClick={handleDecrease} className="px-3 py-1 text-lg font-bold">-</button>
                <span className="px-4">{quantity}</span>
                <button onClick={handleIncrease} className="px-3 py-1 text-lg font-bold">+</button>
              </div> */}
            </div>

            <div className="flex gap-4 mt-4">
              <Button variant="outline">Thêm vào giỏ hàng</Button>
              <Button onClick={() => navigate(`/marketplace/cart`)}>Mua ngay</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Combo khuyến mãi */}
      <Card>
        <CardContent className="p-4">
          <p className="font-semibold text-gray-700 mb-2">🎁 Combo khuyến mãi</p>
          <ul className="list-disc list-inside text-sm text-gray-600">
            <li>Mua 2 giảm thêm 5%</li>
            <li>Freeship đơn từ 300K</li>
            <li>Voucher 50K cho khách mới</li>
          </ul>
        </CardContent>
      </Card>

      {/* Thông tin shop */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={shop.avatar} alt={shop.name} className="w-14 h-14 rounded-full object-cover" />
            <div>
              <p className="font-semibold text-lg">{shop.name}</p>
              <div className="text-sm text-gray-500">⭐ {shop.rating} | Sản phẩm: {shop.products} | Người theo dõi: {shop.followers.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Tham gia: {shop.joined}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Xem Shop</Button>
            <Button>Nhắn Tin</Button>
          </div>
        </CardContent>
      </Card>

      {/* Mô tả & chi tiết sản phẩm */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-gray-700">📝 Mô tả chi tiết</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {product.description} Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptates, facere.
          </p>
        </CardContent>
      </Card>

      {/* Đánh giá sản phẩm */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">📝 Đánh giá sản phẩm</h2>
          {product.reviews.map((r, i) => (
            <div key={i} className="border-b pb-3">
              <p className="font-medium">{r.name} <span className="text-yellow-500 ml-2">⭐ {r.rating}</span></p>
              <p className="text-sm text-gray-600">{r.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Gợi ý sản phẩm liên quan */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">🛍️ Có thể bạn cũng thích</h2>
        <DailySuggestions />
      </section>
    </div>
  );
}

