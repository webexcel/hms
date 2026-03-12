import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

export default function AppLayout() {
  return (
    <div className="wrapper">
      <Sidebar />
      <main className="main-content">
        <TopHeader />
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
