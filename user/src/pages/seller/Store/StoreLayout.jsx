import { NavLink, Outlet, useLocation } from 'react-router-dom';

const tabItems = [
    { path: '/seller/store/basic', label: 'Thông tin cửa hàng' },
    { path: '/seller/store/business', label: 'Thông tin doanh nghiệp' },
    { path: '/seller/store/seller', label: 'Thông tin người bán' },
];

export default function StoreLayout() {
    const location = useLocation();

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Thiết lập cửa hàng</h1>

            {/* Tab Navigation */}
            <div className="border-b mb-6">
                <div className="flex space-x-4">
                    {tabItems.map((tab) => {
                        const isActive = location.pathname === tab.path;

                        return (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${isActive
                                        ? 'border-pink-500 text-pink-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab.label}
                            </NavLink>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div>
                <Outlet />
            </div>
        </div>
    );
}