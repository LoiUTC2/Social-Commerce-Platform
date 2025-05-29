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
import avtAcount from '../../assets/anh-avatar-trang-tron.jpg';
import avtMale from '../../assets/avatar-mac-dinh-nam.jpg';
import avtFemale from '../../assets/avatar-mac-dinh-nu.jpg';
import avtOther from '../../assets/avatar-mac-dinh-lgbt.jpg';

const UserMenu = () => {
    const { user, setUser, isAuthenticated, sellerSubscribed, isSeller, switchRole, setShowLoginModal, logout } = useAuth();
    const navigate = useNavigate();

    const handleSwitchUserRole = async () => {
        try {
            const result = await switchRole();
            if (result.success) {
                toast.success((isSeller ? "Kích hoạt tài khoản người mua (user) thành công" : "Kích hoạt tài khoản người bán (seller) thành công"));
            } else {
                toast.error(result.error || "Có lỗi xảy ra khi chuyển đổi vai trò");
            }
        } catch (error) {
            console.error('Lỗi khi chuyển đổi vai trò:', error);
            toast.error("Có lỗi xảy ra khi chuyển đổi vai trò");
        }
    };

    //Hàm này dùng để reload lại trang sau khi thực hiện thao tác
    // const handleSwitchUserRole = async () => {
    //     try {
    //         const result = await switchRole();

    //         if (result.success) {
    //             toast.success((isSeller ? "Kích hoạt tài khoản người mua (user) thành công" : "Kích hoạt tài khoản người bán (seller) thành công"));

    //             // Option 1: Refresh ngay lập tức
    //             // window.location.reload();

    //             // Option 2: Delay để user thấy message
    //             setTimeout(() => {
    //                 window.location.reload();
    //             }, 1000);


    //             // Option 3: Redirect đến trang phù hợp với role mới
    //             // setTimeout(() => {
    //             //     if (result.currentRole === 'seller') {
    //             //         navigate('/seller');
    //             //     } else {
    //             //         navigate('/');
    //             //     }
    //             // }, 1000);

    //         } else {
    //             toast.error(result.error || "Có lỗi xảy ra khi chuyển đổi vai trò");

    //             // Refresh để đảm bảo UI consistency
    //             setTimeout(() => {
    //                 window.location.reload();
    //             }, 1500);
    //         }
    //     } catch (error) {
    //         console.error('Lỗi khi chuyển đổi vai trò:', error);
    //         toast.error("Có lỗi xảy ra khi chuyển đổi vai trò");

    //         // Refresh khi có lỗi
    //         setTimeout(() => {
    //             window.location.reload();
    //         }, 1500);
    //     }
    // };

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
                <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md">
                    <img
                        src={user?.avatar ||
                            (user?.gender?.toLowerCase() === "male" ? avtMale
                                : user?.gender?.toLowerCase() === "female" ? avtFemale
                                    : user?.gender?.toLowerCase() === "other" ? avtOther : avtAcount)}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-gray-800">
                        {user?.fullName || 'Tài khoản'}
                    </span>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56 mt-2 mr-4">
                {isAuthenticated ? (
                    <>
                        <DropdownMenuItem onClick={() => navigate(`/feed/profile/${user?.slug}`)}>
                            Trang cá nhân
                        </DropdownMenuItem>
                        {isSeller ? (
                            <DropdownMenuItem onClick={() => navigate('/seller/store')}>
                                Thiết lập cửa hàng
                            </DropdownMenuItem>
                        ) : (<DropdownMenuItem onClick={() => navigate('/feed/setting-account')}>
                            Thông tin tài khoản
                        </DropdownMenuItem>)
                        }

                        <DropdownMenuSeparator /> {/* này là dấu gạch đen chia cắt*/}
                        <DropdownMenuItem onClick={() => navigate('/feed/orders')}>
                            Đơn mua
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />

                        {sellerSubscribed ? (
                            <>
                                {isSeller && (
                                    <DropdownMenuItem onClick={() => navigate('/seller')}>
                                        Trang quản lý cửa hàng
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={handleSwitchUserRole}>
                                    {isSeller ? ("Chuyển đổi tài khoản sang người mua (user)") : ("Chuyển đổi tài khoản sang người bán (seller)")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        ) : (user?.shopId ?
                            <DropdownMenuItem>
                                Yêu cầu đăng kí shop của bạn đang đợi duyệt
                            </DropdownMenuItem>
                            :
                            <DropdownMenuItem onClick={() => navigate('/auth/registerShop')}>
                                Đăng kí kênh người bán
                            </DropdownMenuItem>
                        )
                        }
                        <DropdownMenuItem onClick={handleLogout}>
                            Đăng xuất
                        </DropdownMenuItem>
                    </>
                ) : (
                    <>
                        <DropdownMenuItem onClick={handleLogin}>
                            Đăng nhập
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/auth?type=${'register'}`)}>
                            Đăng ký
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserMenu;
