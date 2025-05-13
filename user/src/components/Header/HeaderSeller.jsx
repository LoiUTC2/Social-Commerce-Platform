import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShoppingCart, MessageCircle, User, Bell, Package, Settings, HelpCircle, BarChart2 } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import DarkModeToggle from '../../components/common/DarkModeToggle';
import { useNavigate } from 'react-router-dom';
import HeaderChatIcon from '../chat/HeaderChatIcon';
import UserMenu from '../common/UserMenu';
import { useAuth } from '../../contexts/AuthContext';

const HeaderSeller = () => {
    const {user} = useAuth();
    const navigate = useNavigate();

    return (
        <div className="bg-gradient-to-r from-pink-50 to-white px-6 py-4 shadow flex items-center justify-between border-b-2 border-pink-100">
            {/* Bên trái: Logo + Tabs */}
            <div className="flex items-center gap-8">
                <div className="flex items-center">
                    <Link to="/" className="text-3xl font-bold text-pink-600">HULO</Link>
                    <span className="ml-2 bg-pink-600 text-white text-xs px-2 py-1 rounded-md font-medium">Seller</span>
                </div>
                <nav className="flex items-center gap-4 text-gray-700 font-medium text-sm">
                    <Link to="/seller" className="flex items-center gap-1 hover:text-pink-500">
                        <BarChart2 size={18} /> Tổng quan
                    </Link>
                    <Link to="/seller/products" className="flex items-center gap-1 hover:text-pink-500">
                        <Package size={18} /> Sản phẩm
                    </Link>
                    <Link to="/seller/orders" className="flex items-center gap-1 hover:text-pink-500">
                        <ShoppingCart size={18} /> Đơn hàng
                    </Link>
                    <Link to="/seller/marketing" className="flex items-center gap-1 hover:text-pink-500">
                        📈 Marketing
                    </Link>
                </nav>
            </div>

            {/* Giữa: Thanh tìm kiếm */}
            <div className="flex-grow flex justify-center px-6">
                <div className="relative w-full max-w-[800px]">
                    <Input
                        placeholder="Tìm kiếm sản phẩm, đơn hàng..."
                        className="pr-10 border-pink-200 focus:border-pink-400"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm">🔍</span>
                </div>
            </div>

            {/* Bên phải: Icon thao tác */}
            <div className="flex items-center gap-5 text-gray-600">
                <Link to="/seller/notifications" className="relative">
                    <Bell className="cursor-pointer hover:text-pink-500" />
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">3</span>
                </Link>
                <Link to="/seller/chat">
                    <MessageCircle className="cursor-pointer hover:text-pink-500" />
                </Link>
                <Link to="/seller/settings">
                    <Settings className="cursor-pointer hover:text-pink-500" />
                </Link>
                <Link to="/marketplace" className="text-xs font-medium text-pink-600 border border-pink-200 rounded-md px-3 py-1.5 hover:bg-pink-50">
                    Chế độ mua sắm
                </Link>
                <UserMenu className="cursor-pointer hover:text-pink-500" />
                <DarkModeToggle />
            </div>
        </div>
    );
};

const HeaderSellerPreview = () => {
    return (
        <div className="w-full shadow-lg rounded-lg overflow-hidden border border-gray-200">
            <HeaderSeller />
            {/* <div className="bg-gray-50 p-8 flex justify-center items-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="grid grid-cols-4 gap-6 w-full max-w-5xl">
                        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center justify-center border border-pink-100">
                            <div className="text-pink-600 font-semibold text-lg mb-1">128</div>
                            <div className="text-gray-500 text-sm">Tổng đơn hàng</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center justify-center border border-pink-100">
                            <div className="text-pink-600 font-semibold text-lg mb-1">24</div>
                            <div className="text-gray-500 text-sm">Đang xử lý</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center justify-center border border-pink-100">
                            <div className="text-pink-600 font-semibold text-lg mb-1">82</div>
                            <div className="text-gray-500 text-sm">Sản phẩm</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center justify-center border border-pink-100">
                            <div className="text-pink-600 font-semibold text-lg mb-1">231</div>
                            <div className="text-gray-500 text-sm">Khách hàng</div>
                        </div>
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default HeaderSellerPreview;