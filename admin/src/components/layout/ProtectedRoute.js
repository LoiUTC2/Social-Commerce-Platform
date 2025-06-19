import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <div>Đang kiểm tra xác thực...</div>;
    if (!user || user.role !== 'admin') return <Navigate to="/login" />;

    return children;
}