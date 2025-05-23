import api from '../utils/api';

//Ghi nhân hành vi của user
export const recordInteraction = async (data) => {
    const response = await api.post('/interactions', data);
    return response.data;
};