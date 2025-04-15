import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';

import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import ForgotPasswordModal from './ForgotPasswordModal';
import { useState } from 'react';


export default function LoginModal() {
  const { showLoginModal, setShowLoginModal, login } = useAuth();
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    const mockUser = { name: 'Demo User' };
    login(mockUser);
  };

  return (
    <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đăng nhập để tiếp tục</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Email" />
          <Input type="password" placeholder="Mật khẩu" />
          <Button onClick={handleLogin} className="w-full">Đăng nhập</Button>

            {/* Quên mật khẩu */}
            <p className="text-right text-sm text-blue-600 cursor-pointer hover:underline" onClick={() => setShowForgot(true)}>
            Quên mật khẩu?
            </p>
            <ForgotPasswordModal open={showForgot} onClose={() => setShowForgot(false)} />


          {/* Hoặc đăng nhập bằng */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" className="flex-1 flex items-center gap-2 justify-center">
              <FcGoogle /> Google
            </Button>
            <Button variant="outline" className="flex-1 flex items-center gap-2 justify-center">
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

