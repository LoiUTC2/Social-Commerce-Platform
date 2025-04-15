import DarkModeToggle from '../components/common/DarkModeToggle';
import { Outlet } from 'react-router-dom';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 dark:bg-zinc-900 transition-colors px-4">
      {/* Nút dark mode ở góc trên */}
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      <Outlet />
      {/* Nội dung chính (form login/register) */}
      {/* <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg w-full max-w-md">
        {children}
      </div> */}
    </div>
  );
}
