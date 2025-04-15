import { Home, ShoppingCart, MessageCircle, User } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import DarkModeToggle from './DarkModeToggle';
import { Outlet } from 'react-router-dom';

export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="w-full shadow-md bg-white z-50 px-6 py-3 flex items-center justify-between">
      {/* Logo & Tab Menu */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 cursor-pointer">
          <Home className="text-blue-600" />
          <span className="text-xl font-bold text-blue-600 tracking-tight">SocialShop</span>
        </div>

        {/* Tab Menu trong Header */}
        <nav className="hidden md:flex gap-2 ml-4">
          <Button
            variant={activeTab === 'feed' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('feed')}
          >
            Bảng Tin
          </Button>
          <Button
            variant={activeTab === 'marketplace' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('marketplace')}
          >
            Sàn TMĐT
          </Button>
        </nav>
      </div>

      {/* Search */}
      <div className="flex-1 mx-6 hidden md:block">
        <Input
          placeholder="Tìm kiếm sản phẩm, bài viết, hashtag..."
          className="w-full rounded-full px-4"
        />
      </div>

      {/* Icon Actions */}
      <div className="flex items-center gap-4">
        <Button size="icon" variant="ghost">
          <ShoppingCart className="w-5 h-5" />
        </Button>
        <Button size="icon" variant="ghost">
          <MessageCircle className="w-5 h-5" />
        </Button>
        <Button size="icon" variant="ghost">
          <User className="w-5 h-5" />
        </Button>
        <DarkModeToggle/>
      </div>
      <Outlet/>
    </header>
  );
}
