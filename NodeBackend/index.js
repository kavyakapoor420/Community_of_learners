const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your-super-secret-jwt-key-12345';
const MONGODB_URI1 = 'mongodb://localhost:27017/learning-community';
const MONGODB_URI='mongodb+srv://kavyakapoor413:Helloworld@cluster01.4zpagwq.mongodb.net/KavyaGPT?retryWrites=true&w=majority&appName=Cluster01'

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));


if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

mongoose.connect(MONGODB_URI);

// Email transporter (using Gmail - replace with your credentials)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kavyakapoor413@gmail.com',
    pass: 'orkjxqkaleecifqu',
  },
});

// Schemas
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    otp: {
        code: String,
        expiresAt: Date
    }
});

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postedAt: { type: Date, default: Date.now }
});

const answerSchema = new mongoose.Schema({
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    comments: [{
        comment: String,
        commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        commentedAt: { type: Date, default: Date.now }
    }]
});

const User = mongoose.model('User', userSchema);
const Video = mongoose.model('Video', videoSchema);
const Answer = mongoose.model('Answer', answerSchema);

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || 
            file.mimetype === 'image/jpeg' || 
            file.mimetype === 'image/png' || 
            file.mimetype === 'image/jpg') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Helper function to generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send email
const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: 'your-email@gmail.com',
            to: to,
            subject: subject,
            text: text
        });
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

// Authentication APIs
app.post('/auth/request-otp', async (req, res) => {
    try {
        const { email, name, role } = req.body;

        if (!email || !name) {
            return res.status(400).json({ error: 'Email and name are required' });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        let user = await User.findOne({ email });
        
        if (user) {
            user.otp = { code: otp, expiresAt };
            user.name = name;
            if (role) user.role = role;
        } else {
            user = new User({
                name,
                email,
                role: role || 'user',
                otp: { code: otp, expiresAt }
            });
        }

        await user.save();

        const emailSent = await sendEmail(
            email,
            'OTP for Learning Community',
            `Your OTP is: ${otp}. It will expire in 5 minutes.`
        );

        if (!emailSent) {
            return res.status(500).json({ error: 'Failed to send OTP email' });
        }

        res.json({ message: 'OTP sent successfully to your email' });
    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const user = await User.findOne({ email });

        if (!user || !user.otp) {
            return res.status(400).json({ error: 'Invalid email or OTP not requested' });
        }

        if (user.otp.code !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (new Date() > user.otp.expiresAt) {
            return res.status(400).json({ error: 'OTP has expired' });
        }

        // Clear OTP after successful verification
        user.otp = undefined;
        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin APIs
app.post('/admin/videos', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, description, videoUrl } = req.body;

        if (!title || !description || !videoUrl) {
            return res.status(400).json({ error: 'Title, description, and video URL are required' });
        }

        const video = new Video({
            title,
            description,
            videoUrl,
            postedBy: req.user.userId
        });

        await video.save();

        res.status(201).json({
            message: 'Video posted successfully',
            video: {
                id: video._id,
                title: video.title,
                description: video.description,
                videoUrl: video.videoUrl,
                postedAt: video.postedAt
            }
        });
    } catch (error) {
        console.error('Post video error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/admin/videos/:id/answers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const videoId = req.params.id;

        const answers = await Answer.find({ videoId })
            .populate('userId', 'name email')
            .populate('comments.commentedBy', 'name email')
            .sort({ uploadedAt: -1 });

        res.json({ answers });
    } catch (error) {
        console.error('Get answers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/admin/answers/:id/comment', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const answerId = req.params.id;
        const { comment } = req.body;

        if (!comment) {
            return res.status(400).json({ error: 'Comment is required' });
        }

        const answer = await Answer.findById(answerId);

        if (!answer) {
            return res.status(404).json({ error: 'Answer not found' });
        }

        answer.comments.push({
            comment,
            commentedBy: req.user.userId,
            commentedAt: new Date()
        });

        await answer.save();

        const updatedAnswer = await Answer.findById(answerId)
            .populate('comments.commentedBy', 'name email');

        res.json({
            message: 'Comment added successfully',
            answer: updatedAnswer
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User APIs
app.get('/videos', authenticateToken, async (req, res) => {
    try {
        const videos = await Video.find()
            .populate('postedBy', 'name email')
            .sort({ postedAt: -1 });

        res.json({ videos });
    } catch (error) {
        console.error('Get videos error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/videos/:id/answers', authenticateToken, upload.single('answerFile'), async (req, res) => {
    try {
        const videoId = req.params.id;

        if (!req.file) {
            return res.status(400).json({ error: 'File is required' });
        }

        // Check if video exists
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const answer = new Answer({
            videoId,
            userId: req.user.userId,
            fileUrl: `/uploads/${req.file.filename}`
        });

        await answer.save();

        res.status(201).json({
            message: 'Answer uploaded successfully',
            answer: {
                id: answer._id,
                fileUrl: answer.fileUrl,
                uploadedAt: answer.uploadedAt
            }
        });
    } catch (error) {
        console.error('Upload answer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/videos/:id/answers', authenticateToken, async (req, res) => {
    try {
        const videoId = req.params.id;

        const answers = await Answer.find({
            videoId,
            userId: req.user.userId
        }).populate('comments.commentedBy', 'name email')
          .sort({ uploadedAt: -1 });

        res.json({ answers });
    } catch (error) {
        console.error('Get user answers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all videos for admin dashboard
app.get('/admin/videos', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const videos = await Video.find({ postedBy: req.user.userId })
            .sort({ postedAt: -1 });

        res.json({ videos });
    } catch (error) {
        console.error('Get admin videos error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
    }
    res.status(500).json({ error: error.message });
});

// Add this route with your other admin routes
app.get('/admin/videos/:id/students', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const videoId = req.params.id;

        const answers = await Answer.find({ videoId })
            .populate('userId', 'name email')
            .sort({ uploadedAt: -1 });

        const studentsMap = new Map();
        
        answers.forEach(answer => {
            const studentId = answer.userId._id.toString();
            if (!studentsMap.has(studentId) || 
                studentsMap.get(studentId).uploadedAt < answer.uploadedAt) {
                studentsMap.set(studentId, {
                    name: answer.userId.name,
                    email: answer.userId.email,
                    uploadedAt: answer.uploadedAt
                });
            }
        });

        const students = Array.from(studentsMap.values());
        res.json({ students });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
   
});

