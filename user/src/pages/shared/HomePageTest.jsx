import React from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Search, ShoppingCart, User, Home, MessageCircle, Store } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Navbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-md mb-4">
        <div className="flex items-center gap-2">
          <Home className="text-blue-600" />
          <span className="font-bold text-xl text-blue-600">SocialShop</span>
        </div>
        <Input placeholder="Tìm kiếm sản phẩm, bài viết, hashtag..." className="w-1/2" />
        <div className="flex items-center gap-4">
          <ShoppingCart />
          <MessageCircle />
          <User />
        </div>
      </div>

      {/* Tabs: Social / Marketplace */}
      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList className="flex w-full justify-center bg-white p-2 rounded-2xl shadow">
          <TabsTrigger value="feed" className="flex items-center gap-2 px-4 py-2 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Home size={18} /> Bảng Tin
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2 px-4 py-2 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Store size={18} /> Sàn TMĐT
          </TabsTrigger>
        </TabsList>

        {/* TAB: BẢNG TIN */}
        <TabsContent value="feed">
          <div className="grid grid-cols-12 gap-4 mt-4">
            {/* Sidebar left */}
            <div className="col-span-2 hidden lg:block">
              <Card>
                <CardContent className="p-4">
                  <p className="font-semibold mb-2">Nhóm cộng đồng</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>#Đồ_công_nghệ</li>
                    <li>#Thời_trang</li>
                    <li>#Mẹ_và_bé</li>
                    <li>#FlashSale</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Newsfeed */}
            <div className="col-span-12 lg:col-span-7 space-y-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((id) => (
                <Card key={id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <img src="https://i.pravatar.cc/40" className="rounded-full w-10 h-10" />
                      <div>
                        <p className="font-semibold">Shop ABC</p>
                        <p className="text-xs text-gray-500">2 giờ trước</p>
                      </div>
                    </div>
                    <p className="mb-2">🌟 Giày sneaker mới về! Giảm giá 30% trong hôm nay! 🛍️</p>
                    <img src="https://source.unsplash.com/random/600x400?sneakers" className="rounded-xl w-full object-cover mb-2" />
                    <div className="flex justify-between items-center">
                      <Button variant="outline">Xem chi tiết</Button>
                      <Button>Mua ngay</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Sidebar right */}
            <div className="col-span-3 hidden xl:block space-y-4">
              <Card>
                <CardContent className="p-4">
                  <p className="font-semibold mb-2">Gợi ý sản phẩm</p>
                  <ul className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <li key={i} className="flex items-center gap-2">
                        <img src={`https://source.unsplash.com/random/40x40?product${i}`} className="rounded" />
                        <div>
                          <p className="text-sm font-medium">Sản phẩm {i}</p>
                          <p className="text-xs text-gray-500">Giá: {100 * i}.000đ</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="font-semibold mb-2">Top gian hàng</p>
                  <ul className="text-sm space-y-1 text-blue-600">
                    <li>🌟 SneakerZone</li>
                    <li>🎒 BaloStore</li>
                    <li>👚 FashionHouse</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB: SÀN TMĐT */}
        <TabsContent value="marketplace">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <img src={`https://source.unsplash.com/random/300x200?item${i}`} className="w-full h-40 object-cover rounded-xl mb-2" />
                  <p className="font-medium">Sản phẩm nổi bật {i}</p>
                  <p className="text-sm text-gray-500">Giá: {(i + 1) * 120}.000đ</p>
                  <Button className="w-full mt-2">Mua ngay</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
