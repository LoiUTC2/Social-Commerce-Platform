import { createContext, useContext, useState, useEffect } from 'react';
import { logoutApi, refreshTokenApi } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [accessToken, setAccessToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);

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
                    setShowLoginModal(true);
                }
            } catch (error) {
                console.error('Không thể khôi phục phiên đăng nhập:', error);
                setShowLoginModal(true);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = (token, userData) => {
        // Token đã được lưu trong httpOnly cookie từ server
        // Chỉ cần lưu thông tin user vào state
        setAccessToken(token);
        setUser(userData);
        setShowLoginModal(false);
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
    const isSeller = user?.role === 'seller';
    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{
            accessToken,
            user,
            login,
            logout,
            showLoginModal,
            setShowLoginModal,
            loading,
            isAuthenticated,
            isSeller,
            isAdmin,
        }}>
            {loading ? <div>Loading...</div> : children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);