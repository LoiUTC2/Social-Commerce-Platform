import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner'; // Import toast từ sonner (cần cài đặt nếu chưa có)

import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import ForgotPasswordModal from './ForgotPasswordModal';
import { useState } from 'react';
import { loginUser } from '../../services/authService';

export default function LoginModal() {
  const { showLoginModal, setShowLoginModal, login } = useAuth();
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const res = await loginUser(email, password);
      console.log('Đăng nhập thành công:', res);
      
      // Lưu thông tin người dùng và token vào context
      login(res.accessToken, res.user);
      
      // Hiển thị thông báo thành công
      toast.success('Đăng nhập thành công!');

      // Đóng modal
      setShowLoginModal(false);
      
      // Reset form
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đăng nhập để tiếp tục</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="Email" 
            disabled={isLoading}
          />
          <Input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Mật khẩu" 
            disabled={isLoading}
          />
          <Button 
            onClick={handleLogin} 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Quên mật khẩu */}
          <p className="text-right text-sm text-blue-600 cursor-pointer hover:underline" onClick={() => setShowForgot(true)}>
            Quên mật khẩu?
          </p>
          <ForgotPasswordModal open={showForgot} onClose={() => setShowForgot(false)} />

          {/* Hoặc đăng nhập bằng */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" className="flex-1 flex items-center gap-2 justify-center" disabled={isLoading}>
              <FcGoogle /> Google
            </Button>
            <Button variant="outline" className="flex-1 flex items-center gap-2 justify-center" disabled={isLoading}>
              <FaFacebook className="text-blue-600" /> Facebook
            </Button>
          </div>

          {/* Chuyển sang đăng ký */}
          <p className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{' '}
            <span
              className="text-blue-600 cursor-pointer font-medium"
              onClick={() => {
                setShowLoginModal(false);
                navigate('/auth/register');
              }}
            >
              Đăng ký ngay
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}