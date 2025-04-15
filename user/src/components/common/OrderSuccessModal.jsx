import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function OrderSuccessModal({ show, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // khi mở modal → set visible để kích hoạt animation
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
    }
  }, [show]);

  if (!show) return null;

  const handleOverlayClick = () => onClose();
  const handleModalClick = (e) => e.stopPropagation();

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-white rounded-xl p-6 max-w-md w-full shadow-lg text-center space-y-4 transform transition-all duration-300 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={handleModalClick}
      >
        <CheckCircle className="text-green-500 w-12 h-12 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-800">Đặt hàng thành công!</h2>
        <p className="text-sm text-gray-600">Cảm ơn bạn đã tin tưởng HULO Marketplace.</p>
        <p className="text-sm text-gray-600">
          Mã đơn hàng: <span className="font-medium text-blue-600">#HULO{Math.floor(Math.random() * 100000)}</span>
        </p>
        <div className="flex justify-center gap-3 mt-4">
          <Button onClick={onClose}>Về trang chủ</Button>
          <Button variant="outline">Xem đơn hàng</Button>
        </div>
      </div>
    </div>
  );
}

