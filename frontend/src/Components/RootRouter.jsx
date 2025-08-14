import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RootRouter = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const checkUserRole = async () => {
    if (token) {
      try {
        const res = await axios.get('http://localhost:5000/auth/verify-token', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/user');
        }
      } catch (err) {
        console.error(err);
        localStorage.removeItem('token');
      }
    }
  };

  React.useEffect(() => {
    checkUserRole();
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Welcome to the Learning Community Platform</h1>
      <p>Join our community to access educational videos and submit your answers!</p>
      <div style={{ marginTop: '20px' }}>
        <Link to="/login">
          <button style={{ margin: '10px', padding: '10px 20px' }}>Login</button>
        </Link>
        <Link to="/register">
          <button style={{ margin: '10px', padding: '10px 20px' }}>Register</button>
        </Link>
      </div>
      {token && (
        <div style={{ marginTop: '20px' }}>
          <p>Already logged in? Go to your dashboard:</p>
          <Link to="/admin">
            <button style={{ margin: '10px', padding: '10px 20px' }}>Admin Dashboard</button>
          </Link>
          <Link to="/user">
            <button style={{ margin: '10px', padding: '10px 20px' }}>User Dashboard</button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default RootRouter;