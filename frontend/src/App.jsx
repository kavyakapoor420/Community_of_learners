// //npx shadcn@latest add button 

// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import RootRouter from './components/RootRouter';
// import Login from './components/Login';
// import Register from './components/Register';
// import AdminDashboard from './components/AdminDashboard';
// import UserDashboard from './components/UserDashboard';
// import VideoAnswers from './components/VideoAnswers';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<RootRouter />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//         <Route path="/admin" element={<AdminDashboard />} />
//         <Route path="/user" element={<UserDashboard />} />
//         <Route path="/admin/videos/:id/answers" element={<VideoAnswers />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;




import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentView, setCurrentView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Login/Register state
  const [authData, setAuthData] = useState({
    email: '',
    name: '',
    role: 'user',
    otp: ''
  });
  const [otpSent, setOtpSent] = useState(false);

  // Videos state
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [answers, setAnswers] = useState([]);

  // Admin state
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    videoUrl: ''
  });
  const [adminVideos, setAdminVideos] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (token) {
      const userData = parseJwt(token);
      if (userData) {
        setUser(userData);
        setCurrentView(userData.role === 'admin' ? 'admin-dashboard' : 'dashboard');
      }
    }
  }, [token]);

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  };

  const apiCall = async (url, options = {}) => {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiCall('/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: authData.email,
          name: authData.name,
          role: authData.role
        })
      });

      setOtpSent(true);
      setMessage('OTP sent to your email. Please check and enter below.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiCall('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: authData.email,
          otp: authData.otp
        })
      });

      setToken(response.token);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      setCurrentView(response.user.role === 'admin' ? 'admin-dashboard' : 'dashboard');
      setMessage('Login successful!');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setCurrentView('login');
    setOtpSent(false);
    setAuthData({ email: '', name: '', role: 'user', otp: '' });
  };

  const loadVideos = async () => {
    try {
      const response = await apiCall('/videos');
      setVideos(response.videos);
    } catch (error) {
      setError(error.message);
    }
  };

  const loadAdminVideos = async () => {
    try {
      const response = await apiCall('/admin/videos');
      setAdminVideos(response.videos);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCreateVideo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiCall('/admin/videos', {
        method: 'POST',
        body: JSON.stringify(newVideo)
      });

      setMessage('Video posted successfully!');
      setNewVideo({ title: '', description: '', videoUrl: '' });
      loadAdminVideos();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAnswer = async (videoId, file) => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('answerFile', file);

      const response = await fetch(`${API_BASE_URL}/videos/${videoId}/answers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      setMessage('Answer uploaded successfully!');
      loadUserAnswers(videoId);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserAnswers = async (videoId) => {
    try {
      const response = await apiCall(`/videos/${videoId}/answers`);
      setAnswers(response.answers);
    } catch (error) {
      setError(error.message);
    }
  };

  const loadVideoAnswers = async (videoId) => {
    try {
      const response = await apiCall(`/admin/videos/${videoId}/answers`);
      setSelectedAnswers(response.answers);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleAddComment = async (answerId) => {
    if (!commentText.trim()) return;

    setLoading(true);
    try {
      await apiCall(`/admin/answers/${answerId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ comment: commentText })
      });

      setCommentText('');
      setMessage('Comment added successfully!');
      // Reload answers to show new comment
      if (selectedVideo) {
        loadVideoAnswers(selectedVideo._id);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === 'dashboard' && user?.role === 'user') {
      loadVideos();
    } else if (currentView === 'admin-dashboard' && user?.role === 'admin') {
      loadAdminVideos();
    }
  }, [currentView, user]);

  const renderLogin = () => (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Learning Community</h2>
        {!otpSent ? (
          <form onSubmit={handleRequestOTP}>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={authData.name}
                onChange={(e) => setAuthData({...authData, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={authData.email}
                onChange={(e) => setAuthData({...authData, email: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Role:</label>
              <select
                value={authData.role}
                onChange={(e) => setAuthData({...authData, role: e.target.value})}
              >
                <option value="user">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label>Enter OTP:</label>
              <input
                type="text"
                value={authData.otp}
                onChange={(e) => setAuthData({...authData, otp: e.target.value})}
                maxLength="6"
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button type="button" onClick={() => setOtpSent(false)}>
              Back
            </button>
          </form>
        )}
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );

  const renderStudentDashboard = () => (
    <div className="dashboard">
      <div className="header">
        <h2>Welcome, {user?.name}!</h2>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {currentView === 'dashboard' && (
        <div className="videos-container">
          <h3>Available Videos</h3>
          <div className="videos-grid">
            {videos.map((video) => (
              <div key={video._id} className="video-card">
                <h4>{video.title}</h4>
                <p>{video.description}</p>
                <div className="video-actions">
                  <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                    Watch Video
                  </a>
                  <button onClick={() => {
                    setSelectedVideo(video);
                    setCurrentView('upload-answer');
                    loadUserAnswers(video._id);
                  }}>
                    Upload Answer
                  </button>
                </div>
                <small>Posted: {new Date(video.postedAt).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentView === 'upload-answer' && selectedVideo && (
        <div className="upload-container">
          <h3>Upload Answer for: {selectedVideo.title}</h3>
          <div className="upload-section">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                if (e.target.files[0]) {
                  handleUploadAnswer(selectedVideo._id, e.target.files[0]);
                }
              }}
            />
            <p>Accepted formats: PDF, JPG, PNG (Max: 10MB)</p>
          </div>

          <div className="answers-section">
            <h4>Your Previous Answers</h4>
            {answers.map((answer) => (
              <div key={answer._id} className="answer-card">
                <div className="answer-file">
                  <a href={`${API_BASE_URL}${answer.fileUrl}`} target="_blank" rel="noopener noreferrer">
                    View Answer
                  </a>
                  <small>Uploaded: {new Date(answer.uploadedAt).toLocaleDateString()}</small>
                </div>
                {answer.comments.length > 0 && (
                  <div className="comments-section">
                    <h5>Admin Feedback:</h5>
                    {answer.comments.map((comment, index) => (
                      <div key={index} className="comment">
                        <p>{comment.comment}</p>
                        <small>By: {comment.commentedBy?.name} on {new Date(comment.commentedAt).toLocaleDateString()}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={() => setCurrentView('dashboard')}>Back to Videos</button>
        </div>
      )}

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="dashboard">
      <div className="header">
        <h2>Admin Dashboard - {user?.name}</h2>
        <div className="admin-nav">
          <button 
            onClick={() => setCurrentView('admin-dashboard')}
            className={currentView === 'admin-dashboard' ? 'active' : ''}
          >
            My Videos
          </button>
          <button 
            onClick={() => setCurrentView('create-video')}
            className={currentView === 'create-video' ? 'active' : ''}
          >
            Create Video
          </button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {currentView === 'admin-dashboard' && (
        <div className="admin-videos">
          <h3>Your Posted Videos</h3>
          <div className="videos-grid">
            {adminVideos.map((video) => (
              <div key={video._id} className="video-card admin-video-card">
                <h4>{video.title}</h4>
                <p>{video.description}</p>
                <div className="video-actions">
                  <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                    View Video
                  </a>
                  <button onClick={() => {
                    setSelectedVideo(video);
                    setCurrentView('view-answers');
                    loadVideoAnswers(video._id);
                  }}>
                    View Answers
                  </button>
                </div>
                <small>Posted: {new Date(video.postedAt).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentView === 'create-video' && (
        <div className="create-video-container">
          <h3>Post New Video</h3>
          <form onSubmit={handleCreateVideo}>
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                value={newVideo.title}
                onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={newVideo.description}
                onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                rows="4"
                required
              />
            </div>
            <div className="form-group">
              <label>Video URL:</label>
              <input
                type="url"
                value={newVideo.videoUrl}
                onChange={(e) => setNewVideo({...newVideo, videoUrl: e.target.value})}
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Posting...' : 'Post Video'}
            </button>
          </form>
        </div>
      )}

      {currentView === 'view-answers' && selectedVideo && (
        <div className="answers-view">
          <h3>Answers for: {selectedVideo.title}</h3>
          {selectedAnswers.length === 0 ? (
            <p>No answers submitted yet.</p>
          ) : (
            <div className="answers-list">
              {selectedAnswers.map((answer) => (
                <div key={answer._id} className="admin-answer-card">
                  <div className="answer-header">
                    <h4>Student: {answer.userId?.name}</h4>
                    <small>Email: {answer.userId?.email}</small>
                    <small>Uploaded: {new Date(answer.uploadedAt).toLocaleDateString()}</small>
                  </div>
                  
                  <div className="answer-content">
                    <a href={`${API_BASE_URL}${answer.fileUrl}`} target="_blank" rel="noopener noreferrer">
                      View Answer File
                    </a>
                  </div>

                  <div className="comments-section">
                    <h5>Comments:</h5>
                    {answer.comments.map((comment, index) => (
                      <div key={index} className="existing-comment">
                        <p>{comment.comment}</p>
                        <small>By: {comment.commentedBy?.name} on {new Date(comment.commentedAt).toLocaleDateString()}</small>
                      </div>
                    ))}
                    
                    <div className="add-comment">
                      <textarea
                        placeholder="Add your feedback..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows="3"
                      />
                      <button 
                        onClick={() => handleAddComment(answer._id)}
                        disabled={loading || !commentText.trim()}
                      >
                        {loading ? 'Adding...' : 'Add Comment'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setCurrentView('admin-dashboard')}>Back to Videos</button>
        </div>
      )}

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );

  // Main render
  if (!token || !user) {
    return renderLogin();
  }

  if (user.role === 'admin') {
    return renderAdminDashboard();
  }

  return renderStudentDashboard();
}

export default App;