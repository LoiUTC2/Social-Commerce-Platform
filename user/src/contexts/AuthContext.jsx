import { createContext, useContext, useState, useEffect } from 'react';
import { logoutApi, refreshTokenApi } from '../services/authService'; 

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Kiểm tra trạng thái đăng nhập khi component mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Gọi API kiểm tra auth status từ cookie
                const response = await refreshTokenApi();

                if (response && response.user) {
                    setUser(response.user);
                }
            } catch (error) {
                console.error('Không thể khôi phục phiên đăng nhập:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = (token, userData) => {
        // Token đã được lưu trong httpOnly cookie từ server
        // Chỉ cần lưu thông tin user vào state
        setUser(userData);
        setShowLoginModal(false);
    };

    const logout = async () => {
        try {
            // Gọi API để xóa cookie phía server
            await logoutApi();
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