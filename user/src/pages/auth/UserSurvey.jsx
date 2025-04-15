import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { useNavigate } from 'react-router-dom';

const surveyData = {
  purposes: [
    'Mua sắm cá nhân',
    'Mở shop bán hàng',
    'Tìm ưu đãi và mã giảm giá',
    'Khám phá sản phẩm mới',
  ],
  interests: ['Thời trang', 'Điện tử', 'Đời sống', 'Mẹ & bé', 'Sách', 'Thực phẩm', 'Thể thao'],
};

export default function UserSurvey() {
  const [selectedPurposes, setSelectedPurposes] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const navigate = useNavigate();

  const toggle = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = () => {
    const payload = {
      purposes: selectedPurposes,
      interests: selectedInterests,
    };

    console.log('Thông tin khảo sát:', payload);
    // Gửi dữ liệu về backend để AI xử lý cá nhân hóa

    navigate('/'); // hoặc navigate đến trang chủ, hoặc feed
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-900 px-4">
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl max-w-2xl w-full p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
          Cá nhân hóa trải nghiệm của bạn 🎯
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 text-sm">
          HULO muốn hiểu rõ hơn về bạn để đề xuất nội dung và sản phẩm phù hợp nhất.
        </p>

        {/* MỤC ĐÍCH */}
        <div>
          <p className="font-semibold mb-2">Bạn đến với HULO để?</p>
          <div className="flex flex-wrap gap-3">
            {surveyData.purposes.map((item) => (
              <label key={item} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedPurposes.includes(item)}
                  onCheckedChange={() => toggle(item, selectedPurposes, setSelectedPurposes)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* SỞ THÍCH */}
        <div>
          <p className="font-semibold mb-2">Bạn quan tâm đến các lĩnh vực nào?</p>
          <div className="flex flex-wrap gap-3">
            {surveyData.interests.map((item) => (
              <label key={item} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedInterests.includes(item)}
                  onCheckedChange={() => toggle(item, selectedInterests, setSelectedInterests)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button onClick={handleSubmit}>Bắt đầu trải nghiệm HULO</Button>
        </div>
      </div>
    </div>
  );
}
