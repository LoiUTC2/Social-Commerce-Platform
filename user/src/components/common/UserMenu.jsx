import React from 'react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { switchUserRole } from '../../services/authService';

const UserMenu = () => {
    const { user, isAuthenticated, sellerSubscribed, isSeller, userDataSwitchAfter, setShowLoginModal, logout } = useAuth();
    const navigate = useNavigate();

    const handleSwitchUserRole = async () => {
        const res = await switchUserRole();
        toast.success(isSeller ? ("Kích hoạt tài khoản người mua (user) thành công") : ("Kích hoạt tài khoản người bán (seller) thành công"));
        userDataSwitchAfter(res);
    };

    const handleLogin = () => {
        setShowLoginModal(true);
    };

    const handleLogout = () => {
        toast.success("Đăng xuất thành công!!");
        logout();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                    <User className="text-gray-700" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56 mt-2 mr-4">
                {isAuthenticated ? (
                    <>
                        <DropdownMenuItem onClick={() => navigate('/profile')}>
                            Thông tin tài khoản
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/orders')}>
                            Đơn mua
                        </DropdownMenuItem>

                        {sellerSubscribed ? (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSwitchUserRole}>
                                    {isSeller ? ("Chuyển đổi tài khoản sang người mua (user)") : ("Chuyển đổi tài khoản sang người bán (seller)")}  
                                </DropdownMenuItem>
                                {isSeller && (
                                    <DropdownMenuItem onClick={() => navigate('/seller')}>
                                        Trang quản lý cửa hàng
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                            </>
                        ) : <DropdownMenuItem onClick={() => navigate('/orders')}>
                            Đăng kí kênh người bán
                        </DropdownMenuItem>}

                        <DropdownMenuItem onClick={handleLogout}>
                            Đăng xuất
                        </DropdownMenuItem>
                    </>
                ) : (
                    <>
                        <DropdownMenuItem onClick={handleLogin}>
                            Đăng nhập
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/auth/register')}>
                            Đăng ký
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserMenu;
