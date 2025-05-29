import React from 'react';
import AppRoutes from './routes';
import LoginModal from './components/auth/LoginModal';
import MainLayout from './layouts/MainLayout';
import { Toaster } from 'sonner'; 
import "./styles/sonner-custom.css"

function App() {
  return (
    <>
      {/* Sonner Toaster với theme tùy chỉnh */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand={false}
        duration={3000}
        toastOptions={{
          className: "sonner-toast",
        }}
      />

      {/*Nếu muốn toàn bộ các pages đều có mainLayout(có Header, Footer) thì bọc, không thì đi bọc từng file routes, muốn pages nào có thì bọc*/}
      {/* <MainLayout> */}
        <AppRoutes /> 
      {/* </MainLayout> */}
      
      <LoginModal /> {/* Luôn render, chỉ show khi cần */}
    </>
  );
}

export default App;
