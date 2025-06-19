import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', // hoặc domain backend của bạn
    withCredentials: true, // QUAN TRỌNG: để nhận cookie (access, refresh token)
});

// Thêm token vào header cho mọi request, khỏi cần nữa, vì đã lưu AC trong Cookie và nó tự gửi cùng vs req
api.interceptors.request.use((config) => {
    // const token = localStorage.getItem('accessToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
});

//Gửi CSRF token trong header, Chống CSRF hiệu quả hơn.
api.interceptors.request.use((config) => {
    const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrfToken='))?.split('=')[1];
    if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
});

// Interceptor xử lý khi token hết hạn
api.interceptors.response.use(
    response => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Gọi refresh-token để lấy accessToken mới
                const res = await api.post('/auth/refresh-token');
                // const newAccessToken = res.accessToken;

                // Cập nhật token mới vào localStorage
                // localStorage.setItem('accessToken', newAccessToken); //Khỏi cần nữa vì server tự gửi vào Cookie rồi

                // Gắn token mới vào request cũ rồi gửi lại
                // originalRequest.headers.Authorization = `Bearer ${newAccessToken}`; //cái này có hay ko cũng đc, vì Cookie tự gửi

                return api(originalRequest);
            } catch (refreshError) {
                console.error('Làm mới token thất bại:', refreshError);
                // localStorage.removeItem('accessToken');
                toast.error('Phiên của bạn đã hết hạn. Vui lòng đăng nhập lại.');

                // Gửi tín hiệu để mở LoginModal thay vì redirect ngay
                if (window.openLoginModal) {
                    window.openLoginModal(); // Gọi hàm để mở modal (định nghĩa trong AuthContext)
                } else {
                    // Nếu không có hàm openLoginModal, fallback sang redirect
                    if (window.location.pathname !== '/auth/login') {
                        alert('Phiên của bạn đã hết hạn. Vui lòng đăng nhập lại.');
                        window.location.href = '/auth/register';
                    }
                }
            }
        }

        return Promise.reject(error);
    }
);
export default api;
