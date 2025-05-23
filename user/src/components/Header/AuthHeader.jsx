import React from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import DarkModeToggle from '../../components/common/DarkModeToggle';

const AuthHeader = () => {
    const navigate = useNavigate();
    // const { tabType = 'login' } = useParams(); // Lấy type từ route param

    const [searchParams] = useSearchParams();
    const tabType = searchParams.get('type') || 'register';

    // Hiển thị text dựa trên type
    const headerText = tabType === 'register' ? 'Đăng Ký' : 'Đăng Nhập';

    return (
        <header className="sticky top-0 z-50 bg-white dark:bg-zinc-800 shadow-sm">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="text-3xl font-bold text-pink-600">
                    HULO
                </Link>
                <span className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                    {headerText}
                </span>
                {/* Actions */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        className="text-gray-600 dark:text-gray-300 hover:text-pink-500"
                        onClick={() => navigate('/')}
                    >
                        Khám phá HULO
                    </Button>
                    <DarkModeToggle />
                </div>
            </div>
        </header>
    );
};

export default AuthHeader;