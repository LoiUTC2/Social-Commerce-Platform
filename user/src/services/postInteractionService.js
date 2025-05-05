import api from '../utils/api';

//Like bài viết
export const likePost = async (postId) => {
  const res = await api.post(`/postInteraction/${postId}/like`);
  return res.data;
};

// Lấy danh sách người đã like bài viết
export const getPostLikes = async (postId) => {
  const res = await api.get(`/postInteraction/${postId}/likes`);
  return res.data;
};

// Like bình luận
export const likeComment = async (commentId) => {
  const res = await api.post(`/postInteraction/comment/${commentId}/like`);
  return res.data;
};

// Bình luận hoặc trả lời bình luận
export const commentOrReply = async (postId, text, parentId = null) => {
  const res = await api.post(`/postInteraction/${postId}/comment`, {
    text,
    parentId,
  });
  return res.data;
};

// Lấy danh sách bình luận của bài viết
export const getCommentsByPost = async (postId, sortBy = 'top') => {
  const res = await api.get(`/postInteraction/${postId}/comments?sortBy=${sortBy}&page=1&limit=5`);
  return res.data;
};

//Share bài viết
export const sharePost = async (postId, content, privacy = 'public') => {
  const res = await api.post(`/postInteraction/${postId}/share`, {
    content,
    privacy,
  });
  return res.data;
};

// Lấy danh sách người chia sẻ bài viết (nếu cần)
export const getPostShares = async (postId) => {
  const res = await api.get(`/postInteraction/${postId}/shares?page=1&limit=5`);
  return res.data;
};


////////////mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmTESTmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm
export const sharePost1 = async (postId, content) => {
  try {
    const response = await fetch(`/postInteraction/${postId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }), // Gửi nội dung người dùng nhập khi chia sẻ
      credentials: 'include', // Đảm bảo gửi cookie xác thực
    });

    if (!response.ok) {
      throw new Error('Lỗi khi chia sẻ bài viết');
    }

    return await response.json();
  } catch (error) {
    console.error('Lỗi chia sẻ bài viết:', error);
    throw error;
  }
};

export const getPostShares1 = async (postId) => {
  try {
    const response = await fetch(`/postInteraction/${postId}/shares`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Lỗi khi lấy danh sách chia sẻ');
    }

    return await response.json();
  } catch (error) {
    console.error('Lỗi lấy danh sách chia sẻ:', error);
    throw error;
  }
};