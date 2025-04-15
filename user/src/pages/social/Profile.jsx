import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import FeedItem from '../../components/feed/FeedItem';
import ProductCard from '../../components/marketplace/ProductCard';


export default function Profile() {
  const isSeller = true; // giả định là người bán

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl space-y-4">
        {/* Header thông tin cá nhân */}
        <Card>
          <CardContent className="p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
            <img
              src="https://i.pravatar.cc/100"
              className="w-24 h-24 rounded-full border"
            />
            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-bold">Shop SneakerZone</h2>
              <p className="text-sm text-gray-500">Thành viên từ 2023 • 25k người theo dõi</p>
              <p className="text-sm text-gray-700">
                👋 Chào bạn! Mình là người yêu công nghệ và đam mê kinh doanh online.
              </p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline">Nhắn tin</Button>
                <Button>+ Theo dõi</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs nội dung */}
        <Tabs defaultValue="posts" className="space-y-2">
          <TabsList className="flex bg-white shadow rounded-xl p-1 w-fit mx-auto">
            <TabsTrigger value="posts">📝 Bài viết</TabsTrigger>
            <TabsTrigger value="saved">🔖 Đã lưu</TabsTrigger>
            {isSeller && <TabsTrigger value="products">🛒 Sản phẩm</TabsTrigger>}
          </TabsList>

          <TabsContent value="posts" className="space-y-4 pt-4">
            {[1, 2].map(id => <FeedItem key={id} id={id} />)}
          </TabsContent>

          <TabsContent value="saved" className="pt-4">
            <p className="text-gray-600 text-center">Bạn chưa lưu bài viết nào.</p>
          </TabsContent>

          {isSeller && (
            <TabsContent value="products" className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => <ProductCard key={i} i={i} />)}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
