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

const UserMenu = ({ isSeller = true }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // TODO: Xử lý logout
        console.log("Logging out...");
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                    <User className="text-gray-700" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56 mt-2 mr-4">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                    Thông tin tài khoản
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/orders')}>
                    Đơn mua
                </DropdownMenuItem>

                {isSeller && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/shop/switch')}>
                            Chuyển đổi tài khoản
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/shop/manage')}>
                            Trang quản lý cửa hàng
                        </DropdownMenuItem>
                    </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    Đăng xuất
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserMenu;
