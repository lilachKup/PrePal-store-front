import React, { useState } from 'react';
import {
  CognitoUserPool,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';
import './RegisterForm.css';

const poolData = {
  UserPoolId: 'us-east-1_cs31KzbTS',
  ClientId: '797di13hgmlrd5lthlpkelbgll'
};

const userPool = new CognitoUserPool(poolData);

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // const [address, setAddress] = useState('');
  // const [storeName, setStoreName] = useState('');
  // const [storeHours, setStoreHours] = useState('');

  const handleRegister = () => {
    if (!email || !password || !phoneNumber /* || !address || !storeName || !storeHours */) {
      setMessage("❌ All fields must be filled");
      return;
    }

    if (!/^\d{9}$/.test(phoneNumber)) {
      setMessage("❌ Invalid phone number (must be 9 digits)");
      return;
    }

    const attributes = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'phone_number', Value: `+972${phoneNumber}` }),
      // new CognitoUserAttribute({ Name: 'custom:address', Value: address }),
      // new CognitoUserAttribute({ Name: 'custom:store_name', Value: storeName }),
      // new CognitoUserAttribute({ Name: 'custom:store_opening_hours', Value: storeHours })
    ];

    userPool.signUp(email, password, attributes, null, (err, result) => {
      if (err) {
        console.error(err);
        setMessage('❌ ' + err.message);
      } else {
        console.log('✔️ Registered successfully', result);
        setMessage('✔️ Registered successfully!');
        setRegistrationSuccess(true);
        setTimeout(() => {
          window.location.href = `/confirm?email=${encodeURIComponent(email)}`;
        }, 500);
      }
    });
  };

  return (
    <div className="register-form">
      <h2 className="form-title">Store Sign Up</h2>

      <label>Email:</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" />

      <label>Password:</label>
      <div className="password-container">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input password-input"
        />
        <span
          className="toggle-password"
          onClick={() => setShowPassword(!showPassword)}
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "🙈" : "👁" }
        </span>
      </div>

      {/* <label>Address:</label>
      <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" />

      <label>Store name:</label>
      <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="form-input" />

      <label>Opening hours:</label>
      <input type="text" value={storeHours} onChange={(e) => setStoreHours(e.target.value)} className="form-input" /> */}

      <label>Phone number:</label>
      <div className="phone-container">
        <span className="phone-prefix">+972</span>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
          maxLength={9}
          className="form-input phone-input"
        />
      </div>

      <button onClick={handleRegister} className="submit-btn">Sign Up</button>
      <p className="form-message">{message}</p>

      {registrationSuccess && (
        <p className="form-message">✔️ Please check your email to confirm</p>
      )}
    </div>
  );
}
