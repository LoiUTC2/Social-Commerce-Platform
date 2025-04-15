import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShoppingCart, MessageCircle, User, Bell } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import DarkModeToggle from '../../components/common/DarkModeToggle';
import { useNavigate } from 'react-router-dom';
import HeaderChatIcon from '../chat/HeaderChatIcon';

const HeaderMain = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white px-6 py-4 shadow flex items-center justify-between">
      {/* Bên trái: Logo + Tabs */}
      <div className="flex items-center gap-8">
        <Link to="/" className="text-3xl font-bold text-pink-600">HULO</Link>
        <nav className="flex items-center gap-4 text-gray-700 font-medium text-sm">
          <Link to="/feed" className="flex items-center gap-1 hover:text-pink-500">
            <Home size={18} /> Bảng Tin
          </Link>
          <Link to="/marketplace" className="flex items-center gap-1 hover:text-pink-500">
            🛒 Sàn TMĐT
          </Link>
        </nav>
      </div>

      {/* Giữa: Thanh tìm kiếm */}
      <div className="flex-grow flex justify-center px-6">
        <div className="relative w-full max-w-[1000px]">
          <Input
            placeholder="Tìm kiếm sản phẩm, bài viết..."
            className="pr-10"
          />
          <span className="absolute right-3 top-2.5 text-gray-400 text-sm">🔍</span>
        </div>
      </div>

      {/* Bên phải: Icon thao tác */}
      <div className="flex items-center gap-5 text-gray-600">
        <Bell className="cursor-pointer hover:text-pink-500" />
        <ShoppingCart className="cursor-pointer hover:text-pink-500" />
        <HeaderChatIcon className="cursor-pointer hover:text-pink-500"/>
        <User className="cursor-pointer hover:text-pink-500" />
        <DarkModeToggle />
      </div>
    </div>
  );
};

export default HeaderMain;

