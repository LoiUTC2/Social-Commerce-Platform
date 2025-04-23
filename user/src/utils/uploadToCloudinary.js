import axios from 'axios';

export const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'social_commerce_upload'); // Thay bằng upload preset bạn tạo
    formData.append('cloud_name', 'dsst228u9'); // Cloud name của bạn

    const res = await axios.post('https://api.cloudinary.com/v1_1/dsst228u9/upload', formData);
    return res.data.secure_url; // Link ảnh/video đã upload
};