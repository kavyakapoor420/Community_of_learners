// frontend/src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [videos, setVideos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axios.get('http://localhost:5000/videos', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setVideos(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchVideos();
  }, []);

  const postVideo = async () => {
    try {
      const res = await axios.post(
        'http://localhost:5000/admin/videos',
        { title, description, videoUrl },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setVideos([...videos, res.data]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
      <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
      <input type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Video URL" />
      <button onClick={postVideo}>Post Video</button>
      <h3>Videos</h3>
      <ul>
        {videos.map(video => (
          <li key={video._id}>
            {video.title} - <a href={`/admin/videos/${video._id}/answers`}>View Answers</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminDashboard;