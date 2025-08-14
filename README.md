````markdown
# 📚 Community of Learners Platform

## 📖 Overview
The **Community of Learners** platform is a MERN stack web application designed to connect **admins** and **students** in a collaborative learning environment.  
- **Admins** can post learning videos and review answers submitted by students.  
- **Students** can upload answers (Image/PDF) for each video and receive **feedback/comments** from admins.  

This platform ensures structured learning, interactive feedback, and easy content management for both roles.

---

## 🚀 Features
### **Admin**
- Register/Login using **Email OTP** authentication.
- Post new learning videos with title, description, and video URL.
- View list of students and their submissions for each video.
- Comment on student answers to provide feedback.

### **User**
- Register/Login using **Email OTP** authentication.
- Browse and watch videos posted by admins.
- Upload answers in **Image (.jpg/.png)** or **PDF** format.
- View own submissions and read admin feedback.

---

## 🛠 Tech Stack
- **Frontend:** React.js, Vite  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB (Mongoose ODM)  
- **Authentication:** JWT + Email OTP (Nodemailer)  
- **File Uploads:** Multer + (AWS S3 / Local Storage)  

---

## 📦 Installation & Setup

### 1️⃣ **Clone the Repository**
```bash
git clone <your-repo-url>
````

### 2️⃣ **Frontend Setup (React.js)**

```bash
cd frontend
npm install
npm run dev
```

This will start the frontend development server (default: [http://localhost:5173](http://localhost:5173)).

### 3️⃣ **Backend Setup (Node.js + Express)**

```bash
cd NodeBackend
npm install
nodemon index.js
```

This will start the backend server (default: [http://localhost:5000](http://localhost:5000)).

### ⚙ Environment Variables

Create a `.env` file in the **backend** folder with the following:

```bash
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_app_password
```

---

## 📸 Screenshots


