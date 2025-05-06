import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import StoreInventory from './Components/inventory/StoreInventory';
import AuthTabs from './Components/users/AuthTabs';
import CallbackPage from './CallbackPage';
import { useAuth } from 'react-oidc-context';
import ConfirmRegistration from "./Components/users/ConfirmRegistration";


function App() {
  const auth = useAuth();
  const location = useLocation();

  // אם המשתמש כבר מחובר ומנסה להיכנס לדף ההתחברות, נעביר אותו ל-inventory
  if (auth.isAuthenticated && location.pathname === '/') {
    return <Navigate to="/inventory" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<AuthTabs />} />
      <Route path="/confirm" element={<ConfirmRegistration />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/inventory" element={<StoreInventory />} />
    </Routes>
  );
}

export default App;
