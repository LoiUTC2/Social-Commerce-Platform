import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const HuloIntroduction = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleCtaClick = () => {
        if (isAuthenticated) {
            navigate('/explore'); // Placeholder route cho trang khám phá
            toast.success('Chào mừng bạn đến với HULO!');
        } else {
            navigate('/auth/register');
            toast.info('Vui lòng đăng ký để khám phá HULO!');
        }
    };

    return (
        <div className="relative min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-orange-400 via-white to-orange-100 overflow-hidden">
            {/* Overlay để làm nổi bật nội dung */}
            <div className="absolute inset-0 bg-black/10 z-0" />

            {/* Nội dung chính */}
            <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 animate-fade-in">
                    Chào mừng đến với HULO
                </h1>
                <p className="text-lg sm:text-xl text-gray-700 mb-6 max-w-2xl mx-auto animate-fade-in animation-delay-200">
                    Nền tảng mạng xã hội thương mại điện tử hàng đầu, nơi bạn kết nối với cộng đồng, mua sắm dễ dàng và xây dựng gian hàng của riêng mình!
                </p>
                <Button
                    onClick={handleCtaClick}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-3 rounded-full transition-transform transform hover:scale-105"
                >
                    {isAuthenticated ? 'Khám phá ngay' : 'Đăng ký ngay'}
                </Button>

                {/* Hình ảnh minh họa (placeholder) */}
                <div className="mt-12 flex justify-center">
                    <img
                        src="https://via.placeholder.com/600x300?text=HULO+Community"
                        alt="HULO Community"
                        className="rounded-lg shadow-lg max-w-full h-auto sm:max-w-md animate-fade-in animation-delay-400"
                    />
                </div>
            </div>

            {/* Animation cho background (tùy chọn) */}
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent)] animate-pulse-slow" />
            </div>
        </div>
    );
};

export default HuloIntroduction;