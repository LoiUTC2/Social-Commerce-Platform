import { switchUserRole } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import React, { useState } from 'react';
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShopApprovalPendingModal } from '../../components/common/ShopApprovalPendingModal';
const HeaderTop = () => {
  const { sellerSubscribed, sellerStatusPending, isSeller, switchRole } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSellerChannelClick = async (e) => {
    e.preventDefault();
    try {
      // Trường hợp 1: Đã là seller
      if (isSeller) {
        navigate('/seller');
        return;
      }

      // Trường hợp 2: Đã đăng ký nhưng đang chờ duyệt
      if (sellerStatusPending) {
        setIsModalOpen(true);
        return;
      }

      // Trường hợp 3: Chưa đăng ký seller
      if (!sellerSubscribed) {
        navigate('/auth?type=register');
        return;
      }

      // Trường hợp đã đăng ký nhưng chưa kích hoạt role seller
      await switchRole();
      toast.success("Kích hoạt tài khoản người bán thành công");
      navigate('/seller');

    } catch (error) {
      toast.error("Có lỗi xảy ra khi chuyển đổi tài khoản");
      console.error(error);
    }
  };

  return (
    <div className="bg-gray-100 text-sm text-gray-600 px-4 py-2 flex justify-between items-center">
      <div className="space-x-4">
        <a
          href="#"
          onClick={handleSellerChannelClick}
          className="hover:underline"
        >
          {sellerSubscribed ? "Kênh người bán" : "Tạo kênh người bán"}
        </a>
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

      <ShopApprovalPendingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default HeaderTop;
