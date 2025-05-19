import React, { useState } from 'react';
import {
  CognitoUserPool,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';
import './RegisterForm.css';
import { useAuth } from 'react-oidc-context';


const poolData = {
  UserPoolId: 'us-east-1_cs31KzbTS',
  ClientId: '797di13hgmlrd5lthlpkelbgll'
};

const userPool = new CognitoUserPool(poolData);

const hoursOptions = [
  '', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00'
];

export default function RegisterForm() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [storeName, setStoreName] = useState('');
  const [showLoginButton, setShowLoginButton] = useState(false);
  const [openingHours, setOpeningHours] = useState({
    Sunday: { open: '', close: '', closed: false },
    Monday: { open: '', close: '', closed: false },
    Tuesday: { open: '', close: '', closed: false },
    Wednesday: { open: '', close: '', closed: false },
    Thursday: { open: '', close: '', closed: false },
    Friday: { open: '', close: '', closed: false },
    Saturday: { open: '', close: '', closed: false }
  });

  const handleHoursChange = (day, updated) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: updated
    }));
  };

  const handleRegister = () => {
    const storeHours = Object.entries(openingHours)
      .map(([day, { open, close, closed }]) =>
        closed ? `${day}: Closed` : `${day}: ${open}–${close}`
      ).join(', ');

    if (!email || !password || !phoneNumber || !city || !street || !storeName || !houseNumber || !zipCode || !storeHours) {
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
      new CognitoUserAttribute({ Name: 'name', Value: storeName })
    ];

    userPool.signUp(email, password, attributes, null, async (err, result) => {
      if (err) {
        console.error(err);
        setMessage('❌ ' + err.message);

        if (err.code === 'UsernameExistsException') {
          setShowLoginButton(true);
        }
      } else {
        console.log('✔️ Registered successfully', result);
        setMessage('✔️ Registered successfully!');
        setRegistrationSuccess(true);

        try {
          await createMarketInDB({
            store_id: result.userSub,
            name: storeName,
            address: `${city}, ${street}, ${houseNumber}`,
            email,
            storeHours
          });

          console.log("🏪 Market created successfully in DB");

          setTimeout(() => {
            window.location.href = `/confirm?email=${encodeURIComponent(email)}`;
          }, 500);
        } catch (err) {
          console.error("❌ Error creating market in DB:", err);
          setMessage("❌ Failed to create market. Please try again.");
        }
      }
    });
  };

  const createMarketInDB = async ({ store_id, name, address, email, storeHours }) => {
    try {
      const coordinatesFromAddress = await getCoordinatesFromAddress(address);
      //let check = await fetch ("https://zukr2k1std.execute-api.us-east-1.amazonaws.com/dev/location?address=Aza 25, Tel Aviv");
      //console.log(check);
      //check = await check.json();
      const res = await fetch("https://5uos9aldec.execute-api.us-east-1.amazonaws.com/dev/createNewMarket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id,
          name,
          location: address,
          email,
          store_hours: storeHours,

          store_coordinates: `${coordinatesFromAddress.lat},${coordinatesFromAddress.lon}`
          //coordinates: `${check.lat},${check.lon}`
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create market");
      }

      console.log("🏪 Market successfully created in DB");
    } catch (err) {
      console.error("❌ Error creating market in DB:", err);
      throw err;
    }
  };
  const getCoordinatesFromAddress = async (address) => {
    const response = await fetch(`https://zukr2k1std.execute-api.us-east-1.amazonaws.com/dev/location?address=${address}`);
    if (!response.ok) {
      throw new Error("Failed to fetch coordinates");
    }
    const data = await response.json();
    console.log(data);
    return data;
  }

  const handleLoginButton = () => {
    auth.signinRedirect();
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
        <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? "🙈" : "👁"}
        </span>
      </div>

      <label>Phone number:</label>
      <div className="phone-container">
        <span className="phone-prefix">+972</span>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
          maxLength={9}
          className="phone-input"
        />
      </div>

      {/*<label>Address:</label>
      <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" />
      */}
      <label>City:</label>
      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="form-input" />

      <label>Street:</label>
      <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className="form-input" />

      <label>House Number:</label>
      <input type="text" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} className="form-input" />

      <label>Store name:</label>
      <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="form-input" />

      {/*<label>Opening hours:</label>*/}
      <div className="opening-hours-box">
        <h3>Opening Hours</h3>
        {Object.entries(openingHours).map(([day, { open, close, closed }]) => (
          <div key={day} className="day-hours-row">
            <label>{day}:</label>
            <select
              value={open}
              onChange={(e) => handleHoursChange(day, { open: e.target.value, close, closed })}
              disabled={closed}
              className="form-select"
            >
              {hoursOptions.map((hour) => (
                <option key={hour} value={hour}>{hour}</option>
              ))}
            </select>
            <span>to</span>
            <select
              value={close}
              onChange={(e) => handleHoursChange(day, { open, close: e.target.value, closed })}
              disabled={closed}
              className="form-select"
            >
              {hoursOptions.map((hour) => (
                <option key={hour} value={hour}>{hour}</option>
              ))}
            </select>
            <label style={{ marginLeft: '10px' }}>
              <input
                type="checkbox"
                checked={closed}
                onChange={(e) => handleHoursChange(day, { open: '', close: '', closed: e.target.checked })}
              /> Closed
            </label>
          </div>
        ))}

      </div>

      <button onClick={handleRegister} className="submit-btn">Sign Up</button>

      <p className="form-message">{message}</p>

      {showLoginButton && (
        <div style={{ textAlign: 'center', marginTop: '5px' }}>
          <button
            className="login-btn"
            onClick={handleLoginButton}>
            Log In
          </button>
        </div>
      )}

      {registrationSuccess && (
        <p className="form-message">✔️ Please check your email to confirm</p>
      )}
    </div>
  );
}
