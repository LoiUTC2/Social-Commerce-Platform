import { createContext, useContext, useState, useEffect } from 'react';
import { switchUserRole, logoutApi, refreshTokenApi } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [accessToken, setAccessToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Hàm để mở LoginModal
    const openLoginModal = () => {
        setShowLoginModal(true);
    };

    // Kiểm tra trạng thái đăng nhập khi component mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Gọi API kiểm tra auth status từ cookie
                const response = await refreshTokenApi();
                console.log("resRFT:", response)
                if (response && response.user && response.accessToken) {
                    setAccessToken(response.accessToken);
                    setUser(response.user);
                } else {
                    console.error('Không có thông tin user hoặc accessToken trong response');
                    // setShowLoginModal(true);
                }
            } catch (error) {
                console.error('Không thể khôi phục phiên đăng nhập:', error);
                setShowLoginModal(true);
            } finally {
                setLoading(false);
            }
        };
        window.openLoginModal = openLoginModal; // Gắn hàm openLoginModal vào window để api.js có thể gọi
        checkAuth();

        return () => {
            delete window.openLoginModal; // Xóa hàm khi component unmount
        };
    }, []);

    const login = (token, userData) => {
        // Token đã được lưu trong httpOnly cookie từ server
        // Chỉ cần lưu thông tin user vào state
        setAccessToken(token);
        setUser(userData);
        setShowLoginModal(false);
    };

    const userDataSwitchAfter = (userData) => {
        setUser(userData);
        console.log("UserData sau khi chuyển Account:", userData);
    };

    const logout = async () => {
        try {
            // Gọi API để xóa cookie phía server
            await logoutApi();
            setUser(null);
            setAccessToken(null);
        } catch (error) {
            console.error('Lỗi đăng xuất:', error);
        } finally {
            setUser(null);
        }
    };

    const isAuthenticated = !!user;
    const isSeller = user?.role === 'seller'; //người dùng hiện tại đang dùng tài khoản seller
    const isAdmin = user?.role === 'admin';
    const sellerSubscribed = !!user?.roles.includes("seller"); //kiểm tra xem người dùng đã đăng kí seller chưa

    return (
        <AuthContext.Provider value={{
            accessToken,
            user,
            login,
            logout,
            userDataSwitchAfter,
            showLoginModal,
            setShowLoginModal,
            loading,
            isAuthenticated,
            isSeller,
            isAdmin,
            sellerSubscribed,
        }}>
            {loading ? <div>Loading...</div> : children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);