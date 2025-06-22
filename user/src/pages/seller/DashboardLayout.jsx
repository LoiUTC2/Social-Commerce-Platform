import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import HeaderSeller from '../../components/Header/HeaderSeller';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

const navItems = [
  { path: '/seller', label: 'Tổng quan' },
  { path: '/seller/orders', label: 'Quản lý đơn hàng' },
  { path: '/seller/customers', label: 'Quản lí khách hàng' },
  { path: '/seller/products', label: 'Quản lí sản phẩm' },
  { path: '/seller/support', label: 'Hỗ trợ khách hàng' },
  { path: '/seller/flash-sale', label: 'Marketing' },
  { path: '/seller/store', label: 'Thiết lập cửa hàng' },
];

export default function DashboardLayout() {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-10">
        <HeaderSeller />
      </div>
      {/* Khoảng trống để tránh nội dung bị đè bởi header */}
      <div className="h-16"></div> {/* Điều chỉnh chiều cao này tương ứng với chiều cao của header */}

      <div className="flex flex-1 pt-2">
        {/* Sidebar */}
        <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r p-4 shadow transition-all duration-300 ease-in-out relative h-[calc(100vh-4rem)] sticky top-16`}>

          {/* Nút thu gọn/mở rộng */}
          <button
            className="absolute -right-3 top-4 bg-pink-500 text-white rounded-full p-1 shadow-md z-10"
            onClick={toggleSidebar}
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <div className="flex items-center justify-between mb-4">
            {/* Link trở về trang chủ */}
            <Link
              to="/"
              className="flex items-center text-pink-600 hover:text-pink-700 transition-colors font-medium"
            >
              <Home size={18} className="mr-1" />
              {!isSidebarCollapsed && <span>Về trang chủ</span>}
            </Link>
          </div>

          {!isSidebarCollapsed && (
            <h2 className="font-bold text-lg mb-4 text-gray-800">QUẢN LÍ CỬA HÀNG</h2>
          )}

          {/* <div className="overflow-y-auto h-[calc(100%-4rem)]"> */}
            {navItems.map(item => {
              // Xử lý riêng cho tab "Tổng quan"
              const isActive =
                location.pathname === item.path ||
                (item.path === '/seller' && location.pathname === '/seller');

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 rounded hover:bg-pink-100 mb-1 ${isActive ? 'bg-pink-500 text-white' : 'text-gray-700'
                    } ${isSidebarCollapsed ? 'text-center' : ''}`}
                  title={item.label}
                >
                  {isSidebarCollapsed ? (
                    // Hiển thị chữ cái đầu tiên khi thu gọn
                    <span className="font-bold">{item.label.charAt(0)}</span>
                  ) : (
                    item.label
                  )}
                </NavLink>
              );
            })}
          {/* </div> */}
        </aside>

        {/* Nội dung */}
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}