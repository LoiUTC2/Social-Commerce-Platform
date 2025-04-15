import { Outlet, Link } from 'react-router-dom';

export default function SocialLayout() {
  return (
    <div>
      <nav>
        <Link to="/feed">Bảng tin</Link>
        <Link to="/profile/me">Trang cá nhân</Link>
        <Link to="/marketplace">🛒 Sàn TMĐT</Link>
      </nav>
      <hr />
      <Outlet />
    </div>
  );
}
