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

// Lấy danh sách like của bình luận
export const getCommentLikes = async (commentId, page = 1, limit = 10) => {
  const res = await api.get(`/postInteraction/comment/${commentId}/likes`, {
    params: { page, limit }
  });
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
export const getCommentsByPost = async (postId, sortBy = 'top', page = 1, limit = 5) => {
  const res = await api.get(`/postInteraction/${postId}/comments?sortBy=${sortBy}&page=${page}&limit=${limit}`);
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

