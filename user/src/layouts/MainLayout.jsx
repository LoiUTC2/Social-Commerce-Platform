import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import MiniChatBox from '../components/chat/chatMini/MiniChatBox';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-gray-50 px-4 py-2">
        <Outlet />
        {/* <MiniChatBox/> */}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
