import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { registerUser, loginUser } from '../../services/authService';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

import logo from 'assets/Đi bộ (1).png'

const AuthPage = () => {
  const navigate = useNavigate();
  // const { tabType = 'login' } = useParams(); // Lấy type từ route param

  const [searchParams, setSearchParams] = useSearchParams();
  const tabType = searchParams.get('type') || 'login'; // Lấy type từ query param

  const { login } = useAuth();

  // State cho form đăng ký
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    gender: '',
    dateOfBirth: '',
    phone: '',
  });

  // State cho form đăng nhập
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Handle tab change, dùng cho lấy useParams()
  // const handleTabChange = (value) => {
  //   navigate(`/auth/${value}`);
  //   console.log('type:', value)
  // };

  // Cập nhật query param khi tab thay đổi
  const handleTabChange = (value) => {
    setSearchParams({ type: value });
  };

  // Handle input changes
  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleGenderChange = (value) => {
    setRegisterData({ ...registerData, gender: value });
  };

  // Handle form submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await registerUser(registerData);
      toast.success('Đăng ký thành công!');
      login(response.accessToken, response.user);
      setIsLoading(false);
      setIsDialogOpen(true);
    } catch (error) {
      setIsLoading(false);
      toast.error(error.message || 'Đăng ký thất bại, vui lòng thử lại.');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await loginUser(loginData.email, loginData.password);
      toast.success('Đăng nhập thành công!');
      login(response.accessToken, response.user);
      setIsLoading(false);
      navigate('/');
    } catch (error) {
      setIsLoading(false);
      toast.error(error.message || 'Đăng nhập thất bại, vui lòng thử lại.');
    }
  };

  // Handle dialog choice for seller registration
  const handleSellerChoice = (wantsToBeSeller) => {
    setIsDialogOpen(false);
    if (wantsToBeSeller) {
      navigate('/auth/registerSeller');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="relative w-full max-w-full min-h-[calc(100vh-104px)] flex items-center justify-center bg-gradient-to-br from-pink-400 via-white to-pink-100 overflow-hidden">
      {/* Overlay để làm nổi bật nội dung */}
      <div className="absolute inset-0 bg-black/10 z-0" />

      {/* Nội dung chính */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-8 py-8">
        {/* Phần giới thiệu HULO */}
        <div className="w-full md:w-1/2 text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 animate-fade-in">
            Chào mừng đến với HULO
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 mb-6 max-w-md mx-auto md:mx-0 animate-fade-in animation-delay-200">
            Nền tảng mạng xã hội thương mại điện tử, nơi bạn kết nối với cộng đồng, mua sắm dễ dàng và xây dựng gian hàng của riêng mình!
          </p>
          <img
            src={logo}
            alt="HULO Community"
            className="rounded-lg shadow-lg w-full max-w-md mx-auto md:mx-0 animate-fade-in animation-delay-400"
          />
          <Button
            variant="link"
            className="mt-4 text-pink-500 hover:text-pink-600"
            onClick={() => navigate('/')}
          >
            Khám phá HULO mà không cần đăng nhập
          </Button>
        </div>

        {/* Form đăng nhập/đăng ký */}
        <div className="w-full md:w-1/2 bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6">
          <Tabs value={tabType} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Đăng Nhập</TabsTrigger>
              <TabsTrigger value="register">Đăng Ký</TabsTrigger>
            </TabsList>

            {/* Form đăng nhập */}
            <TabsContent value="login">
              <form className="space-y-4 mt-4" onSubmit={handleLoginSubmit}>
                <div className="space-y-1">
                  <Label htmlFor="loginEmail" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Email
                  </Label>
                  <Input
                    id="loginEmail"
                    name="email"
                    type="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    required
                    placeholder="Nhập email"
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="loginPassword" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Mật Khẩu
                  </Label>
                  <Input
                    id="loginPassword"
                    name="password"
                    type="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                    placeholder="Nhập mật khẩu"
                    className="w-full"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-pink-500 hover:bg-pink-600"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xử lý...' : 'Đăng Nhập'}
                </Button>
              </form>
            </TabsContent>

            {/* Form đăng ký */}
            <TabsContent value="register">
              <form className="space-y-4 mt-4" onSubmit={handleRegisterSubmit}>
                <div className="space-y-1">
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Họ và Tên
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={registerData.fullName}
                    onChange={handleRegisterChange}
                    required
                    placeholder="Nhập họ và tên"
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    required
                    placeholder="Nhập email"
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Mật Khẩu
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    required
                    placeholder="Nhập mật khẩu"
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="gender" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Giới Tính
                  </Label>
                  <Select onValueChange={handleGenderChange} value={registerData.gender} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Nam</SelectItem>
                      <SelectItem value="female">Nữ</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Ngày Sinh
                  </Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={registerData.dateOfBirth}
                    onChange={handleRegisterChange}
                    required
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Số Điện Thoại
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={registerData.phone}
                    onChange={handleRegisterChange}
                    required
                    placeholder="Nhập số điện thoại"
                    className="w-full"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-pink-500 hover:bg-pink-600"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xử lý...' : 'Đăng Ký'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog hỏi về đăng ký người bán */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Bạn có muốn đăng ký làm người bán?
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              Trở thành người bán để quảng bá sản phẩm, quản lý gian hàng và tiếp cận khách hàng dễ dàng!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => handleSellerChoice(false)}
            >
              Không, tiến hành đăng nhập
            </Button>
            <Button
              onClick={() => handleSellerChoice(true)}
              className="bg-pink-500 hover:bg-pink-600"
            >
              Có, đăng ký người bán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Animation cho background */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent)] animate-pulse-slow" />
      </div>
    </div>
  );
};

export default AuthPage;