import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';

export function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 border-r border-gray-200">
        <Sidebar />
      </div>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}