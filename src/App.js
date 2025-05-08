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


    if (auth.isAuthenticated && location.pathname === '/') {
        const marketId = auth.user?.profile?.sub;
        return <Navigate to={`/store/${marketId}`} replace />;
    }


    return (
    <Routes>
      <Route path="/" element={<AuthTabs />} />
      <Route path="/confirm" element={<ConfirmRegistration />} />
      <Route path="/callback" element={<CallbackPage />} />
        <Route path="/inventory" element={<StoreInventory storeId={auth.user?.profile?.sub} />} />

    </Routes>
  );
}

export default App;
