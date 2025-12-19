import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

