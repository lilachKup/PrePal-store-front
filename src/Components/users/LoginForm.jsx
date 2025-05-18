import React, { useState } from 'react';
import { useAuth } from 'react-oidc-context';

export default function LoginForm() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showResendButton, setShowResendButton] = useState(false);
  const [allowContinueLogin, setAllowContinueLogin] = useState(false);

  const handleCheckStatus = async () => {
    // הדמיה - בהמשך צריך לקרוא ל-API אמיתי ב-Lambda שלך
    if (email === "unconfirmed@example.com") {
      setMessage("❌ User exists but email is not confirmed.");
      setShowResendButton(true);
      setAllowContinueLogin(false);
    } else if (email === "confirmed@example.com") {
      setMessage("✔ User is confirmed. You can continue to login.");
      setShowResendButton(false);
      setAllowContinueLogin(true);
    } else {
      setMessage("❌ User not found.");
      setShowResendButton(false);
      setAllowContinueLogin(false);
    }
  };

  const handleResendCode = () => {
    // הדמיה
    setMessage("✔ Confirmation code resent. Check your email.");
  };

  const handleContinueToLogin = () => {
    auth.signinRedirect();
  };

  return (
    <div className="login-form">
      <h2 className="form-title">Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="form-input"
      />
      <button onClick={handleCheckStatus} className="submit-btn">Check Status</button>

      <p className="form-message">{message}</p>

      {showResendButton && (
        <button onClick={handleResendCode} className="login-btn">Resend Confirmation Code</button>
      )}

      {allowContinueLogin && (
        <button onClick={handleContinueToLogin} className="submit-btn">Continue to Login</button>
      )}
    </div>
  );
}
