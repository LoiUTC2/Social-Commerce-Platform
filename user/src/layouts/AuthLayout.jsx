import { Outlet } from 'react-router-dom';
import AuthHeader from '../components/Header/AuthHeader';
import AuthFooter from '../components/Footer/AuthFooter';

export default function AuthLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-zinc-900 transition-colors">
      <AuthHeader />

      <main className="flex-grow w-full">
        <Outlet />
      </main>

      <AuthFooter />
    </div>
  );
}
