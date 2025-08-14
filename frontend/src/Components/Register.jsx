import React, { useState } from 'react';
   import axios from 'axios';

   const Register = () => {
     const [email, setEmail] = useState('');
     const [name, setName] = useState('');
     const [role, setRole] = useState('user');
     const [otp, setOtp] = useState('');
     const [step, setStep] = useState('request');

     const requestOtp = async () => {
       if (!name || !email || !role) {
         alert('Please fill in all fields: Name, Email, and Role');
         return;
       }
       if (!/\S+@\S+\.\S+/.test(email)) {
         alert('Please enter a valid email');
         return;
       }
       console.log('Request payload:', { email, name, role });
       try {
         await axios.post('http://localhost:5000/auth/request-otp', { email, name, role });
         setStep('verify');
       } catch (err) {
         console.error(err);
         console.error(err.response?.data);
         alert(err.response?.data?.msg || 'Error requesting OTP');
       }
     };

     const verifyOtp = async () => {
       if (!otp) {
         alert('Please enter the OTP');
         return;
       }
       try {
         const res = await axios.post('http://localhost:5000/auth/verify-otp', { email, otp });
         localStorage.setItem('token', res.data.token);
         // Redirect based on role
         if (role === 'admin') {
           window.location.href = '/admin';
         } else {
           window.location.href = '/user';
         }
       } catch (err) {
         console.error(err);
         alert(err.response?.data?.msg || 'Error verifying OTP');
       }
     };

     return (
       <div style={{ textAlign: 'center', padding: '20px' }}>
         <h2>Register</h2>
         {step === 'request' ? (
           <>
             <input
               type="text"
               value={name}
               onChange={e => setName(e.target.value)}
               placeholder="Name"
               style={{ display: 'block', margin: '10px auto', padding: '5px' }}
             />
             <input
               type="email"
               value={email}
               onChange={e => setEmail(e.target.value)}
               placeholder="Email"
               style={{ display: 'block', margin: '10px auto', padding: '5px' }}
             />
             <select
               value={role}
               onChange={e => setRole(e.target.value)}
               style={{ display: 'block', margin: '10px auto', padding: '5px' }}
             >
               <option value="user">User</option>
               <option value="admin">Admin</option>
             </select>
             <button onClick={requestOtp} style={{ padding: '10px 20px' }}>
               Request OTP
             </button>
           </>
         ) : (
           <>
             <input
               type="text"
               value={otp}
               onChange={e => setOtp(e.target.value)}
               placeholder="OTP"
               style={{ display: 'block', margin: '10px auto', padding: '5px' }}
             />
             <button onClick={verifyOtp} style={{ padding: '10px 20px' }}>
               Verify OTP
             </button>
           </>
         )}
       </div>
     );
   };

   export default Register;