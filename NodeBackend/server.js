const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const app = express();
const port = 5000;

const JWT_SECRET='abcd'


app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads folder if not exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

mongo_uri='mongodb://localhost:27017/learning-community'
// MongoDB connection
mongoose.connect(mongo_uri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kavyakapoor413@gmail.com',
    pass: 'orkjxqkaleecifqu',
  },
});

// Models
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  role: { type: String, enum: ['admin', 'user'], required: true },
  otp: {
    code: String,
    expiresAt: Date,
  },
});

const User = mongoose.model('User', userSchema);

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  videoUrl: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postedAt: { type: Date, default: Date.now },
});

const Video = mongoose.model('Video', videoSchema);

const answerSchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  comments: [
    {
      comment: { type: String, required: true },
      commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      commentedAt: { type: Date, default: Date.now },
    },
  ],
});

const Answer = mongoose.model('Answer', answerSchema);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /^(image\/(jpg|jpeg|png)|application\/pdf)$/;
  if (!file.mimetype.match(allowedTypes)) {
    return cb(new Error('Invalid file type. Only JPG, PNG, PDF allowed.'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

// Auth middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Admin access only' });
  next();
};

// Authentication APIs
// backend/server.js
app.post('/auth/request-otp', async (req, res) => {
  const { email, name, role } = req.body;

  if (!email) return res.status(400).json({ msg: 'Email is required' });
  if (name && role) {
    // Register mode
    if (!name) return res.status(400).json({ msg: 'Name is required for registration' });
    if (!['admin', 'user'].includes(role)) return res.status(400).json({ msg: 'Invalid role. Must be admin or user' });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists with this email' });

    user = new User({ email, name, role });
  } else {
    // Login mode
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found for login' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  user.otp = { code: otp, expiresAt };
  await user.save();

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    });
    res.json({ msg: 'OTP sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error sending OTP' });
  }
});

app.post('/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) return res.status(400).json({ msg: 'Email and OTP required' });

  const user = await User.findOne({ email });
  if (!user || !user.otp || user.otp.code !== otp || user.otp.expiresAt < new Date()) {
    return res.status(400).json({ msg: 'Invalid or expired OTP' });
  }

  user.otp = undefined;
  await user.save();

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

// Admin APIs
app.post('/admin/videos', auth, adminAuth, async (req, res) => {
  const { title, description, videoUrl } = req.body;

  if (!title || !videoUrl) return res.status(400).json({ msg: 'Title and video URL required' });

  const video = new Video({ title, description, videoUrl, postedBy: req.user.id });
  await video.save();

  res.json(video);
});

app.get('/admin/videos/:id/answers', auth, adminAuth, async (req, res) => {
  const { id } = req.params;

  const answers = await Answer.find({ videoId: id }).populate('userId', 'name email');
  res.json(answers);
});

app.post('/admin/answers/:id/comment', auth, adminAuth, async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  if (!comment) return res.status(400).json({ msg: 'Comment required' });

  const answer = await Answer.findById(id);
  if (!answer) return res.status(404).json({ msg: 'Answer not found' });

  answer.comments.push({ comment, commentedBy: req.user.id });
  await answer.save();

  res.json(answer);
});

// User APIs
app.get('/videos', auth, async (req, res) => {
  const videos = await Video.find().populate('postedBy', 'name');
  res.json(videos);
});

app.post('/videos/:id/answers', auth, upload.single('file'), async (req, res) => {
  const { id } = req.params;

  if (!req.file) return res.status(400).json({ msg: 'File required' });

  const video = await Video.findById(id);
  if (!video) return res.status(404).json({ msg: 'Video not found' });

  const fileUrl = `/uploads/${req.file.filename}`;
  const answer = new Answer({ videoId: id, userId: req.user.id, fileUrl });
  await answer.save();

  res.json(answer);
});

app.get('/videos/:id/answers', auth, async (req, res) => {
  const { id } = req.params;

  const answers = await Answer.find({ videoId: id, userId: req.user.id }).populate('comments.commentedBy', 'name');
  res.json(answers);
});

// Add this in server.js after the other routes
app.get('/auth/verify-token', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ role: user.role });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));