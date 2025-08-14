// frontend/src/components/UserDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserDashboard = () => {
  const [videos, setVideos] = useState([]);
  const [file, setFile] = useState({});
  const [answers, setAnswers] = useState({});

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

  const uploadAnswer = async (videoId) => {
    const formData = new FormData();
    formData.append('file', file[videoId]);

    try {
      const res = await axios.post(`http://localhost:5000/videos/${videoId}/answers`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      // Refresh answers
      fetchAnswers(videoId);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnswers = async (videoId) => {
    try {
      const res = await axios.get(`http://localhost:5000/videos/${videoId}/answers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAnswers({ ...answers, [videoId]: res.data });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>User Dashboard</h2>
      <ul>
        {videos.map(video => (
          <li key={video._id}>
            <h3>{video.title}</h3>
            <p>{video.description}</p>
            <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">Watch Video</a>
            <input type="file" onChange={e => setFile({ ...file, [video._id]: e.target.files[0] })} accept=".jpg,.png,.pdf" />
            <button onClick={() => uploadAnswer(video._id)}>Upload Answer</button>
            <button onClick={() => fetchAnswers(video._id)}>View My Answers</button>
            {answers[video._id] && (
              <ul>
                {answers[video._id].map(answer => (
                  <li key={answer._id}>
                    <a href={answer.fileUrl} target="_blank" rel="noopener noreferrer">View Uploaded Answer</a>
                    <h4>Comments:</h4>
                    <ul>
                      {answer.comments.map((com, idx) => (
                        <li key={idx}>{com.comment}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserDashboard;