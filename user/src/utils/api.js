import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // hoặc domain backend của bạn
  withCredentials: true, // QUAN TRỌNG: để nhận cookie (access, refresh token)
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
        const newAccessToken = res.data.accessToken;

        // Cập nhật token mới vào localStorage
        localStorage.setItem('accessToken', newAccessToken);

        // Gắn token mới vào request cũ rồi gửi lại
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Làm mới token thất bại:', refreshError);

        localStorage.removeItem('accessToken');
        window.location.href = '/auth/login'; // Hoặc mở LoginModal nếu bạn dùng modal
      }
    }

    return Promise.reject(error);
  }
);
export default api;
