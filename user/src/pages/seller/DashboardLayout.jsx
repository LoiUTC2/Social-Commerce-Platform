import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/seller', label: 'Tổng quan' },
  { path: '/seller/orders', label: 'Quản lý đơn hàng' },
  { path: '/seller/customers', label: 'Quản lí khách hàng' },
  { path: '/seller/products', label: 'Quản lí sản phẩm' },
  { path: '/seller/support', label: 'Hỗ trợ khách hàng' },
  { path: '/seller/marketing', label: 'Marketing' },
  { path: '/seller/store', label: 'Thiết lập cửa hàng' },
];

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-4 space-y-3 shadow">
        <h2 className="font-bold text-lg mb-4">QUẢN LÍ CỬA HÀNG</h2>
        {navItems.map(item => {
          // Xử lý riêng cho tab "Tổng quan"
          const isActive =
            location.pathname === item.path ||
            (item.path === '/seller' && location.pathname === '/seller');

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded hover:bg-blue-100 ${
                isActive ? 'bg-blue-500 text-white' : 'text-gray-700'
              }`}
            >
              {item.label}
            </NavLink>
          );
        })}
      </aside>

      {/* Nội dung */}
      <main className="flex-1 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
