import { Card, CardContent } from '../../components/ui/card';

export default function RightSidebar() {
  return (
    <div className="space-y-4">
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
      <Card>
        <CardContent className="p-4">
          <p className="font-semibold mb-2">Sự kiện & Thông báo</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>🎉 Sale 4.4 giảm 70%</li>
            <li>🛍️ Miễn phí vận chuyển toàn quốc</li>
            <li>🎁 Tặng voucher 50k cho thành viên mới</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}