// frontend/src/components/VideoAnswers.js (for admin to view and comment on answers)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const VideoAnswers = () => {
  const { id } = useParams();
  const [answers, setAnswers] = useState([]);
  const [comment, setComment] = useState({});

  useEffect(() => {
    const fetchAnswers = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/admin/videos/${id}/answers`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setAnswers(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAnswers();
  }, [id]);

  const addComment = async (answerId) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/admin/answers/${answerId}/comment`,
        { comment: comment[answerId] },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setAnswers(answers.map(ans => (ans._id === answerId ? res.data : ans)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Answers for Video</h2>
      <ul>
        {answers.map(answer => (
          <li key={answer._id}>
            <p>User: {answer.userId.name}</p>
            <a href={answer.fileUrl} target="_blank" rel="noopener noreferrer">View Answer</a>
            <h4>Comments:</h4>
            <ul>
              {answer.comments.map((com, idx) => (
                <li key={idx}>{com.comment} by {com.commentedBy.name}</li>
              ))}
            </ul>
            <input
              type="text"
              value={comment[answer._id] || ''}
              onChange={e => setComment({ ...comment, [answer._id]: e.target.value })}
              placeholder="Add comment"
            />
            <button onClick={() => addComment(answer._id)}>Comment</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VideoAnswers;