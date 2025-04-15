import React from 'react';
import { useParams } from 'react-router-dom';
import './PostDetail.css'; // Tùy chọn nếu bạn muốn style riêng

const PostDetail = () => {
  const { postId } = useParams();

  // Tạm thời dùng dữ liệu giả
  const post = {
    id: postId,
    author: 'Nguyễn Văn A',
    avatar: 'https://i.pravatar.cc/150?img=3',
    content: 'Đây là nội dung chi tiết của bài viết. Có thể có ảnh, video, sản phẩm đính kèm...',
    image: 'https://source.unsplash.com/random/800x500',
    product: {
      name: 'Áo Hoodie Unisex',
      price: 299000,
      id: 'sp123',
    },
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-4 rounded shadow-md mt-6">
      <div className="flex items-center space-x-4 mb-4">
        <img src={post.avatar} alt="avatar" className="w-10 h-10 rounded-full" />
        <span className="font-semibold">{post.author}</span>
      </div>
      <p className="mb-3">{post.content}</p>
      {post.image && <img src={post.image} alt="post" className="w-full rounded-lg mb-4" />}

      {/* Nếu có sản phẩm gắn kèm */}
      {post.product && (
        <div className="bg-gray-100 p-4 rounded-lg mt-4">
          <h4 className="text-lg font-bold mb-1">{post.product.name}</h4>
          <p className="text-red-500 font-semibold">{post.product.price.toLocaleString()}₫</p>
          <button
            className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              // Redirect tới trang chi tiết sản phẩm
              window.location.href = `/products/${post.product.id}`;
            }}
          >
            Xem sản phẩm
          </button>
        </div>
      )}
    </div>
  );
};

export default PostDetail;