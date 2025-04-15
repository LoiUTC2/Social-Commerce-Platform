import React from 'react';
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';

const HeaderTop = () => {
  return (
    <div className="bg-gray-100 text-sm text-gray-600 px-4 py-2 flex justify-between items-center">
      <div className="space-x-4">
        <a href="/seller" className="hover:underline">Kênh người bán</a>
        <a href="#" className="hover:underline">Tạo kênh người bán</a>
        <a href="#" className="hover:underline">Điều khoản dịch vụ</a>
        <a href="#" className="hover:underline">Hỗ trợ</a>
      </div>

      <div className="flex items-center gap-4">
        {/* Social icons */}
        <div className="flex gap-2 text-gray-500">
          <a href="#"><FaFacebookF className="hover:text-blue-600" /></a>
          <a href="#"><FaInstagram className="hover:text-pink-600" /></a>
          <a href="#"><FaTwitter className="hover:text-sky-500" /></a>
          <a href="#"><FaYoutube className="hover:text-red-600" /></a>
        </div>

        {/* Language Select */}
        <select
          defaultValue="vie"
          className="bg-white border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-pink-300"
        >
          <option value="vie">Tiếng Việt</option>
          <option value="eng">English</option>
        </select>
      </div>
    </div>
  );
};

export default HeaderTop;
