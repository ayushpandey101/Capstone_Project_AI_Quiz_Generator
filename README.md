# 🎓 TheodoraQ - AI-Powered Quiz Platform

<div align="center">

![TheodoraQ](https://img.shields.io/badge/TheodoraQ-AI%20Quiz%20Platform-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb)

**A comprehensive learning management platform with AI-powered quiz generation and advanced proctoring capabilities**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Tech Stack](#-tech-stack) • [Documentation](#-documentation)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-features)
- [Technology Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Security Features](#-security-features)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**TheodoraQ** is a modern, full-stack Learning Management System (LMS) designed for educational institutions and online learning platforms. It combines cutting-edge AI technology with robust proctoring capabilities to deliver a secure, efficient, and engaging quiz-taking experience.

### Why TheodoraQ?

- 🤖 **AI-Powered**: Leverages Google's Gemini AI for intelligent quiz generation
- 🔒 **Secure**: Advanced anti-cheating mechanisms with real-time proctoring
- 📊 **Analytics-Rich**: Comprehensive insights into student performance and integrity
- 🎨 **Modern UI**: Built with Material-UI for a sleek, responsive design
- ⚡ **Fast & Scalable**: Optimized performance with React and Node.js

---

## ✨ Features

### 🎯 For Educators (Admin)

#### Quiz Management
- **AI-Powered Quiz Generation**
  - Generate quizzes using Google Gemini AI
  - Support for multiple question types: MCQ, True/False, Short Answer
  - Image support for questions and options with automatic compression
  - Customizable difficulty levels and weightage
  
- **Content Library**
  - Centralized quiz repository
  - Easy quiz assignment to multiple classes
  - Bulk editing and management
  - Import/Export functionality

#### Class Management
- Create and manage multiple classes
- Student roster management with CSV import
- Real-time class analytics dashboard
- Assignment tracking and grading

#### Advanced Analytics
- **Performance Metrics**
  - Individual student performance tracking
  - Class-wide statistics and trends
  - Question-level difficulty analysis
  - Score distribution visualization

- **Integrity Monitoring**
  - AI proctoring violation reports
  - Tab switching and window focus tracking
  - Fullscreen exit detection
  - Detailed cheat activity logs with timestamps

- **Detailed Reports**
  - Student submission history
  - Time-on-task analysis
  - Question-by-question breakdowns
  - Exportable reports (PDF/CSV)

### 👨‍🎓 For Students (Candidates)

#### Quiz Taking Experience
- **Smart Interface**
  - Clean, distraction-free quiz interface
  - Real-time countdown timer with visual alerts
  - Progress indicator showing completion status
  - Instant feedback (when enabled)

- **AI Proctoring System**
  - Camera and microphone monitoring
  - Face detection using TensorFlow.js and MediaPipe
  - Real-time violation detection
  - Browser tab switching alerts
  - Fullscreen enforcement

- **Accessibility Features**
  - Multiple question type support
  - Image zoom for better visibility
  - Mobile-responsive design
  - Keyboard navigation support

#### Student Dashboard
- Personal performance analytics
- Assignment deadlines and notifications
- Class leaderboards
- Submission history

### 🔐 Authentication & Security

- Google OAuth 2.0 integration
- JWT-based authentication with secure httpOnly cookies
- Role-based access control (Admin/Candidate)
- Password encryption with bcrypt
- Protected routes and API endpoints
- Email verification system

---

## 🛠 Tech Stack

### Frontend

```json
{
  "framework": "React 19.1.1",
  "routing": "React Router DOM 7.9.6",
  "ui-library": "Material-UI (MUI) 7.3.5",
  "styling": "Emotion + Tailwind CSS 4.1",
  "charts": "Chart.js 4.5.1 + React-ChartJS-2",
  "ai-proctoring": "TensorFlow.js 4.22 + Face-API.js",
  "http-client": "Axios 1.13.2",
  "date-handling": "date-fns 4.1.0",
  "build-tool": "Vite 7.1.7"
}
```

### Backend

```json
{
  "runtime": "Node.js",
  "framework": "Express.js 4.21",
  "database": "MongoDB 8.19 (Mongoose ODM)",
  "authentication": "Passport.js + JWT + Google OAuth 2.0",
  "ai-integration": "Google Gemini AI",
  "file-uploads": "Multer 2.0",
  "email": "Nodemailer 7.0",
  "validation": "Express-Validator 7.0",
  "security": "bcryptjs + cookie-parser"
}
```

### DevOps & Tools

- **Version Control**: Git & GitHub
- **Package Manager**: npm
- **Development**: Nodemon, ESLint
- **Environment Management**: dotenv
- **Image Processing**: Canvas API (client-side compression)

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Admin     │  │  Candidate   │  │     Auth     │      │
│  │   Features   │  │   Features   │  │   System     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │   API Layer    │                        │
│                    │  (Axios/JWT)   │                        │
│                    └───────┬────────┘                        │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Express Server │
                    │   (REST API)    │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼─────┐      ┌──────▼──────┐    ┌──────▼──────┐
    │ MongoDB  │      │ Google APIs │    │   Multer    │
    │ Database │      │ (AI/OAuth)  │    │ (Uploads)   │
    └──────────┘      └─────────────┘    └─────────────┘
```

### Key Components

1. **Frontend Architecture**
   - Component-based architecture with React
   - Context API for global state management
   - Protected routes with role-based access
   - Responsive layouts with Material-UI

2. **Backend Architecture**
   - RESTful API design
   - MVC pattern (Models, Controllers, Routes)
   - Middleware for authentication and validation
   - Modular service layer

3. **Database Schema**
   - Users (Admins & Candidates)
   - Classes & Enrollments
   - Quizzes & Questions
   - Assignments & Submissions
   - Analytics & Proctoring Data

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager
- **Google Cloud Account** (for OAuth and Gemini AI)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/ayushpandey101/TheodoraQ.git
cd TheodoraQ
```

2. **Install Frontend Dependencies**

```bash
npm install
```

3. **Install Backend Dependencies**

```bash
cd backend
npm install
cd ..
```

### Environment Setup

#### Frontend Environment Variables

Create a `.env` file in the root directory:

```env
# Frontend Environment Variables (Vite requires VITE_ prefix)

# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Backend API URL
VITE_API_URL=http://localhost:5000/api
```

#### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/theodoraq
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/theodoraq

# JWT Secret (use a strong, random string)
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=TheodoraQ <your_email@gmail.com>

# Session Secret
SESSION_SECRET=your_session_secret_here
```

### Getting API Keys

#### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API** and **People API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen
6. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
7. Copy **Client ID** and **Client Secret**

#### 2. Google Gemini AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **Get API Key**
3. Create a new API key
4. Copy the key to your `.env` file

#### 3. Email Setup (Gmail)

1. Enable 2-Step Verification on your Google Account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use this password in `EMAIL_PASSWORD`

---

## 🎮 Usage

### Running the Application

#### Development Mode

1. **Start MongoDB** (if running locally)

```bash
mongod
```

2. **Start Backend Server**

```bash
cd backend
npm run dev
```

The backend server will run on `http://localhost:5000`

3. **Start Frontend Development Server** (in a new terminal)

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

4. **Access the Application**

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

#### Production Build

1. **Build Frontend**

```bash
npm run build
```

2. **Start Backend in Production**

```bash
cd backend
npm start
```

### Default User Roles

After initial setup, you can create users via Google OAuth. Set user roles in the MongoDB database:

```javascript
// In MongoDB, update user role
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

---

## 📁 Project Structure

```
TheodoraQ/
├── backend/                      # Backend Node.js application
│   ├── config/                   # Configuration files
│   │   ├── database.js          # MongoDB connection
│   │   ├── email.js             # Email configuration
│   │   ├── multer.js            # File upload settings
│   │   └── passport.js          # OAuth strategies
│   ├── controllers/             # Request handlers
│   │   ├── analyticsController.js
│   │   ├── assignmentController.js
│   │   ├── authController.js
│   │   ├── candidateController.js
│   │   ├── classController.js
│   │   ├── googleAuthController.js
│   │   └── quizController.js
│   ├── middleware/              # Custom middleware
│   │   ├── authMiddleware.js   # JWT authentication
│   │   └── uploadMiddleware.js # File upload handling
│   ├── models/                  # Mongoose schemas
│   │   ├── Assignment.js
│   │   ├── Class.js
│   │   ├── Quiz.js
│   │   └── User.js
│   ├── routes/                  # API routes
│   │   ├── analyticsRoutes.js
│   │   ├── assignmentRoutes.js
│   │   ├── authRoutes.js
│   │   ├── candidateRoutes.js
│   │   ├── classRoutes.js
│   │   └── quizRoutes.js
│   ├── utils/                   # Utility functions
│   │   ├── emailService.js
│   │   └── jwtUtils.js
│   ├── uploads/                 # File uploads storage
│   ├── .env                     # Environment variables
│   ├── package.json
│   └── server.js               # Entry point
│
├── src/                         # Frontend React application
│   ├── assets/                  # Static assets
│   │   └── logos/
│   ├── components/              # Reusable components
│   │   └── Loader.jsx
│   ├── contexts/                # React Context providers
│   ├── core/                    # Core services
│   │   └── services/
│   │       └── api.js          # API service layer
│   ├── features/                # Feature-based modules
│   │   ├── admin/              # Admin features
│   │   │   ├── components/
│   │   │   ├── layouts/
│   │   │   └── pages/
│   │   ├── auth/               # Authentication
│   │   │   ├── components/
│   │   │   ├── contexts/
│   │   │   └── hooks/
│   │   └── candidate/          # Student features
│   │       ├── components/
│   │       ├── layouts/
│   │       └── pages/
│   ├── pages/                   # Standalone pages
│   ├── router/                  # Routing configuration
│   │   └── AppRoutes.jsx
│   ├── shared/                  # Shared components
│   │   └── components/
│   ├── utils/                   # Frontend utilities
│   │   ├── imageCompression.js
│   │   └── ProctoringSys.js   # AI proctoring system
│   ├── App.jsx                 # Root component
│   ├── main.jsx                # Entry point
│   └── theme.js                # MUI theme configuration
│
├── public/                      # Public assets
├── .env                         # Frontend environment variables
├── .env.example                # Environment template
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 📡 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | Register new user | ❌ |
| POST | `/auth/login` | Login with email/password | ❌ |
| GET | `/auth/google` | Initiate Google OAuth | ❌ |
| GET | `/auth/google/callback` | Google OAuth callback | ❌ |
| POST | `/auth/logout` | Logout user | ✅ |
| GET | `/auth/profile` | Get user profile | ✅ |

### Quiz Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/quiz` | Get all quizzes | Admin |
| POST | `/quiz/generate` | Generate quiz with AI | Admin |
| GET | `/quiz/:id` | Get quiz details | Admin/Candidate |
| PUT | `/quiz/:id` | Update quiz | Admin |
| DELETE | `/quiz/:id` | Delete quiz | Admin |

### Class Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/classes` | Get all classes | Admin |
| POST | `/classes` | Create new class | Admin |
| GET | `/classes/:id` | Get class details | Admin/Candidate |
| PUT | `/classes/:id` | Update class | Admin |
| DELETE | `/classes/:id` | Delete class | Admin |
| POST | `/classes/:id/students` | Add students | Admin |

### Assignment Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/assignments` | Create assignment | Admin |
| GET | `/assignments/:id` | Get assignment | Admin/Candidate |
| POST | `/assignments/:id/submit` | Submit assignment | Candidate |
| GET | `/assignments/:id/submissions` | Get submissions | Admin |

### Analytics Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/analytics/class/:id` | Class analytics | Admin |
| GET | `/analytics/student/:id` | Student analytics | Admin/Candidate |
| GET | `/analytics/integrity/:assignmentId` | Integrity report | Admin |

---

## 🔒 Security Features

### Authentication & Authorization

- **JWT Tokens**: Secure, stateless authentication with httpOnly cookies
- **Google OAuth 2.0**: Industry-standard OAuth implementation
- **Password Hashing**: bcrypt with salt rounds for password security
- **Role-Based Access Control**: Separate admin and candidate permissions
- **Protected Routes**: Frontend and backend route protection

### Anti-Cheating Mechanisms

#### AI Proctoring
- **Face Detection**: Real-time face tracking using TensorFlow.js
- **Multiple Face Detection**: Alerts when multiple people are detected
- **No Face Detection**: Alerts when student leaves the frame
- **Looking Away Detection**: Monitors eye gaze direction

#### Browser Monitoring
- **Tab Switch Detection**: Tracks when student switches browser tabs
- **Window Focus Loss**: Monitors when quiz window loses focus
- **Fullscreen Enforcement**: Forces fullscreen mode during quiz
- **Copy/Paste Prevention**: Disables clipboard operations
- **Right-Click Disabled**: Prevents context menu access

#### Data Integrity
- **Violation Logging**: All integrity violations stored with timestamps
- **Proctoring Reports**: Detailed reports for educator review
- **Warning System**: Progressive warnings before penalties

### Data Protection

- **Input Validation**: Express-validator for all inputs
- **XSS Prevention**: Sanitized user inputs
- **CORS Configuration**: Controlled cross-origin requests
- **Environment Variables**: Sensitive data in environment files
- **Secure File Uploads**: Validated and sanitized file uploads

---

## 🎨 Features in Detail

### AI Quiz Generation

TheodoraQ uses Google's Gemini AI to generate high-quality quiz questions:

```javascript
// Example: Generate quiz with specific parameters
{
  "topic": "JavaScript Fundamentals",
  "difficulty": "Medium",
  "numberOfQuestions": 10,
  "questionTypes": ["mcq", "true-false", "short-answer"],
  "includeImages": true
}
```

**Capabilities:**
- Context-aware question generation
- Multiple difficulty levels
- Support for images in questions
- Automatic answer generation
- Distractor options for MCQs

### Image Compression

Automatic client-side image compression optimizes storage:

- **Question Images**: Compressed to ≤400KB
- **Option Images**: Compressed to ≤250KB
- **Profile Pictures**: Compressed to ≤200KB
- Quality preservation with iterative compression
- Aspect ratio maintained

### Real-Time Analytics

Comprehensive analytics dashboard provides:

- **Performance Metrics**: Average scores, completion rates
- **Time Analytics**: Time spent per question, total time
- **Difficulty Analysis**: Question performance tracking
- **Trend Analysis**: Performance over time
- **Integrity Scores**: Violation frequency and severity

### Responsive Design

- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interface
- Optimized for tablets and phones

---

## 🧪 Testing

### Running Tests

```bash
# Frontend tests
npm test

# Backend tests
cd backend
npm test
```

### Test Coverage

- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for React components
- E2E tests for critical user flows

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI** for intelligent quiz generation
- **TensorFlow.js** for browser-based ML capabilities
- **Material-UI** for beautiful UI components
- **MongoDB** for robust data storage
- **React Team** for the amazing framework

---

## 📞 Support

For support, email support@theodoraq.com or create an issue in the repository.

---

## 🗺 Roadmap

### Planned Features

- [ ] Video proctoring with recording
- [ ] Live quiz sessions with real-time participation
- [ ] Gamification with badges and leaderboards
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced analytics with ML insights
- [ ] Integration with popular LMS platforms
- [ ] Automated grading for essays
- [ ] Peer review system
- [ ] Discussion forums

---

<div align="center">

**Built with ❤️ for educators and learners worldwide**

⭐ Star this repo if you find it helpful!

</div>
