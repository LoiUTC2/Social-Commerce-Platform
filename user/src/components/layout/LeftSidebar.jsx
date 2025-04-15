import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

import { Users, Bookmark, UserCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import hoiYeuCN from '../../assets/hoiYeuCongnghe.png'
import hoimacDep from '../../assets/hoiMacDep.png'
import hoihanmade from '../../assets/hoiHanmade.png'

export default function LeftSidebar() {
  const [hoveredGroup, setHoveredGroup] = useState(null);

  const navigate = useNavigate();
  const groups = [
    {
      id: 1,
      name: 'Hội Yêu Công Nghệ',
      members: '120k',
      image: hoiYeuCN,
      joined: false,
    },
    {
      id: 2,
      name: 'Cộng đồng Mặc Đẹp',
      members: '85k',
      image: hoimacDep,
      joined: true,
    },
    {
      id: 3,
      name: 'Đồ Handmade Tinh Tế',
      members: '50k',
      image: hoihanmade,
      joined: false,
    },
  ];

  const user = {
    name: 'Nguyễn Văn A',
    avatar: 'https://i.pravatar.cc/60',
    role: 'seller', // hoặc 'user'
  };

  return (
    <div className="space-y-4">
      

      {/* PHẦN 2: TỪ KHÓA PHỔ BIẾN */}
      <Card>
  <CardContent className="p-4">
    <p className="font-semibold mb-2">🔍 Từ khóa phổ biến</p>
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
      <div>
        <p>#Đồ_công_nghệ</p>
        <p>#Thời_trang</p>
        <p>#FlashSale</p>
        <p>#Săn_voucher</p>
        <p>#Siêu_sale</p>
      </div>
      <div>
        <p>#Laptop</p>
        <p>#Phụ_kiện</p>
        <p>#Mỹ_phẩm</p>
        <p>#Ưu_đãi</p>
        <p>#Miễn_phí_ship</p>
      </div>
    </div>
  </CardContent>
</Card>

      {/* PHẦN 3: HỘI NHÓM */}
      <Card>
        <CardContent className="p-4">
          <p className="font-semibold mb-2">👥 Hội nhóm nổi bật</p>
          <ul className="space-y-2 text-sm text-gray-700">
            {groups.map(group => (
              <li
                key={group.id}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-100 transition"
                onMouseEnter={() => setHoveredGroup(group.id)}
                onMouseLeave={() => setHoveredGroup(null)}
              >
                <div className="flex items-center gap-2">
                  <img src={group.image} className="rounded-md w-8 h-8" />
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-xs text-gray-500">{group.members} thành viên</p>
                  </div>
                </div>

                {hoveredGroup === group.id && !group.joined && (
                  <Button size="sm" variant="outline">Tham gia</Button>
                )}

                {group.joined && hoveredGroup === group.id && (
                  <span className="text-xs text-green-600">Đã tham gia</span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* PHẦN 1: THÔNG TIN CÁ NHÂN */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <img
              src="https://i.pravatar.cc/60"
              alt="avatar"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="font-semibold text-base">Nguyễn Văn A</p>
              <p className="text-xs text-gray-500">Thành viên từ 2024</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-gray-700">
              <Users className="w-4 h-4" /> Bạn bè: <span className="font-medium">124</span>
            </p>
            <p className="flex items-center gap-2 text-gray-700">
              <UserCircle2 className="w-4 h-4" /> Hội nhóm tham gia: <span className="font-medium">8</span>
            </p>
            <p className="flex items-center gap-2 text-gray-700">
              <Bookmark className="w-4 h-4" /> Đã lưu: <span className="font-medium">12 bài viết</span>
            </p>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-2" onClick={()=> navigate(`/feed/profile`)}>Trang cá nhân</Button>
        </CardContent>
      </Card>
    </div>
  );
}

