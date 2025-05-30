import React, { useState } from 'react';
import RegisterForm from './RegisterForm';
import { useAuth } from 'react-oidc-context';
import './AuthTabs.css';

export default function AuthTabs() {
    const [activeTab, setActiveTab] = useState('signup');
    const auth = useAuth();

    if (auth.isLoading) return <p>Loading auth...</p>;
    if (auth.error) return <p>Error: {auth.error.message}</p>;

    return (
        <div className="auth-tabs-container">
            <div className="tab-header">
                <div
                    className={`tab-button ${activeTab === 'signup' ? 'active' : ''}`}
                    onClick={() => setActiveTab('signup')}
                >
                    Sign Up
                </div>
                <div
                    className="tab-button"
                    onClick={() => auth.signinRedirect()}
                >
                    Login
                </div>
            </div>

            <div className="tab-content">
                {activeTab === 'signup' && <RegisterForm />}
            </div>
        </div>
    );
}

//without check email before login

/*import React, { useState } from 'react';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';  // 👈 הוספת ה-LoginForm
import './AuthTabs.css';

export default function AuthTabs() {
  const [activeTab, setActiveTab] = useState('signup');

  return (
    <div className="auth-tabs-container">
      <div className="tab-header">
        <div
          className={`tab-button ${activeTab === 'signup' ? 'active' : ''}`}
          onClick={() => setActiveTab('signup')}
        >
          Sign Up
        </div>
        <div
          className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => setActiveTab('login')}
        >
          Login
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'signup' && <RegisterForm />}
        {activeTab === 'login' && <LoginForm />}
      </div>
    </div>
  );
}
*/

