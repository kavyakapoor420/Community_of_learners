// frontend/src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('request');
  const [token, setToken] = useState('');

  const requestOtp = async () => {
    try {
      await axios.post('http://localhost:5000/auth/request-otp', { email });
      setStep('verify');
    } catch (err) {
      console.error(err);
    }
  };

  const verifyOtp = async () => {
    try {
      const res = await axios.post('http://localhost:5000/auth/verify-otp', { email, otp });
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      // Redirect based on role
      if (res.data.user.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/user';
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {step === 'request' ? (
        <>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
          <button onClick={requestOtp}>Request OTP</button>
        </>
      ) : (
        <>
          <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="OTP" />
          <button onClick={verifyOtp}>Verify OTP</button>
        </>
      )}
    </div>
  );
};

export default Login;