import AuthLayout from '../../layouts/AuthLayout';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import logo from 'assets/image-removebg-preview (9).png'
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal';


export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(false);
  const navigate = useNavigate();
  const [showForgot, setShowForgot] = useState(false);
  const handleRegister = () => {
    // ... validate form
    navigate('/survey');

  };
  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-100 dark:bg-zinc-900 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-zinc-800 rounded-xl shadow-lg overflow-hidden">
        {/* LEFT: Info HULO */}
        <div className="hidden lg:flex flex-col justify-center items-center p-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white space-y-4">
          <h2 className="text-3xl font-bold">Chào mừng đến với HULO</h2>
          <p className="text-sm text-white/90 text-center max-w-sm">
            Nền tảng thương mại xã hội đầu tiên tại Việt Nam – kết nối, chia sẻ và mua sắm thông minh với AI.
          </p>
          <img
            src={logo}
            alt="HULO"
            className="rounded-lg shadow-lg"
          />
        </div>

        {/* RIGHT: Auth Form */}
        <div className="p-8 flex flex-col justify-center space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">
              {isLogin ? 'Đăng nhập vào HULO' : 'Tạo tài khoản HULO'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              {isLogin
                ? 'Chào mừng bạn quay trở lại!'
                : 'Đăng ký để bắt đầu hành trình mua sắm và kết nối!'}
            </p>
          </div>

          {/* FORM */}
          <form className="space-y-4">
            {!isLogin && <Input placeholder="Họ và tên" />}
            <Input type="email" placeholder="Email" />
            <Input type="password" placeholder="Mật khẩu" />
            {!isLogin && <Input type="password" placeholder="Xác nhận mật khẩu" />}

            <Button className="w-full">{isLogin ? 'Đăng nhập' : 'Đăng ký'}</Button>

            {isLogin && (
              <p className="text-right text-sm text-blue-600 cursor-pointer hover:underline" onClick={() => setShowForgot(true)}> 
                Quên mật khẩu?
              </p>
            )}
            <ForgotPasswordModal open={showForgot} onClose={() => setShowForgot(false)} />
          </form>

          {/* Toggle Form */}
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? 'Bạn chưa có tài khoản?' : 'Bạn đã có tài khoản?'}{' '}
            <span
              className="text-blue-600 font-medium cursor-pointer hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </span>
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>© 2025 HULO – Nền tảng thương mại xã hội thông minh.</p>
        <p>
          <a href="#">Giới thiệu</a> · <a href="#">Chính sách bảo mật</a> ·{' '}
          <a href="#">Điều khoản</a> · <a href="#">Liên hệ</a>
        </p>
      </footer>
    </div>
  );
}

