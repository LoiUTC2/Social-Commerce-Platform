import React from 'react';
import { Route } from 'react-router-dom';
import ChatPage from '../pages/chat/ChatPage';
import MainLayout from '../layouts/MainLayout';

const ChatRoutes = (
  <Route element={<MainLayout />}>
    <Route path="/messages" element={<ChatPage />} />
  </Route>
);

export default ChatRoutes;
