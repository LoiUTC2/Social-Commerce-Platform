import api from '../utils/api';

export const loginUser = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  const { accessToken, user } = res.data;

  // Lưu accessToken vào localStorage
  localStorage.setItem('accessToken', accessToken);

  return { accessToken, user };
};
export const refreshTokenApi = async () => {
  try {
    const response = await api.post('/auth/refresh-token');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logoutApi = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};