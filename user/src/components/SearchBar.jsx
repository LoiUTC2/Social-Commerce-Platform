import React from 'react';

const SearchBar = () => {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Tìm kiếm sản phẩm, bài viết..."
        className="border rounded-full px-4 py-1.5 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-400 w-64"
      />
      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        🔍
      </span>
    </div>
  );
};

export default SearchBar;
