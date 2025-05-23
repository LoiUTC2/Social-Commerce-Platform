import api from '../utils/api';

// Đăng ký người dùng
export const registerUser = async (formData) => {
  const response = await api.post('/auth/register', formData);
  return response.data;
};

export const loginUser = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  const { accessToken, user } = res.data.data;
  // console.log("api:", res.data.data); 
  return { accessToken ,user };

  // Lưu accessToken vào localStorage
  // localStorage.setItem('accessToken', accessToken); // tại vì có lưu trong cookie rồi (ở dưới server lưu rồi), nên bây h ko cần lưu vào Storage nữa

  // Lưu user vào localStorage, này là cách lưu full các thuộc tính của oject user á, như là: email, fullName, ...
  // for (const [key, value] of Object.entries(user)) {
  //   localStorage.setItem(`user_${key}`, typeof value === 'object' ? JSON.stringify(value) : value);
  // }

    // return { accessToken, user };

  //Mà ko cần lưu vào Storage nữa, tại vì Storage nhanh nên mới dùng
  //Để bảo mật thì đang dùng lưu trong AC (accessToken), RF (refreshToken) trong Cookie only https kết hợp lưu AC trong memory (Context).

};
export const refreshTokenApi = async () => {
  try {
    const response = await api.post('/auth/refresh-token'); //trả về accessToken mới
    // localStorage.setItem('accessToken', response.data); //Ko cần lưu vào Storage nữa, vì đã lưu vào Cookie
    const { accessToken, user } = response.data; // Destruct ngay trong authService
    return { accessToken, user };
  } catch (error) {
    throw error;
  }
};

export const logoutApi = async () => {
  const response = await api.post('/auth/logout');
  // localStorage.removeItem('accessToken');
  return response.data;
};

//Chuyển đổi tài khoản
export const switchUserRole = async () => { 
  const response = await api.post('/shops/switch-role');
  return response.data.data;
};

// Lấy thông tin người dùng hiện tại (đã đăng nhập)
export const getCurrentUser = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

// Lấy thông tin User theo slug
export const getUserBySlug = async (slug) => {
    const res = await api.get(`/auth/slug/${slug}`);
    return res.data;
};

// Cập nhật thông tin cá nhân
export const updateProfile = async (profileData) => {
  const res = await api.put('/auth/me', profileData);
  return res.data;
};

