import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter as Router } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <Router>
          <App />
        </Router>
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);