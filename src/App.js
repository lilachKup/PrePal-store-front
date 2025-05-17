import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import StoreInventory from './Components/inventory/StoreInventory';
import AuthTabs from './Components/users/AuthTabs';
import CallbackPage from './CallbackPage';
import { useAuth } from 'react-oidc-context';
import ConfirmRegistration from "./Components/users/ConfirmRegistration";
import StoreOrder from './Components/orders/StoreOrder';


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
      <Route
          path="/inventory"
          element={
            auth.user?.profile ? (
                <StoreInventory
                    storeId={auth.user.profile.sub}
                    storeName={auth.user.profile.name}
                />
            ) : (
                <div>Loading...</div>
            )
          }
      />

      <Route path="/orders" element={<StoreOrder />} />


    </Routes>
  );
}

export default App;
