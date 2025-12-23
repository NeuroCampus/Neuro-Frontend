# NeuroCampus – Unified AI Campus Operating System

<div align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-green?style=for-the-badge" alt="Production Ready"/>
  <img src="https://img.shields.io/badge/AI--Powered-Intelligent-blue?style=for-the-badge" alt="AI-Powered"/>
  <img src="https://img.shields.io/badge/Cloud--Native-Scalable-orange?style=for-the-badge" alt="Cloud-Native"/>
  <br/>
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=flat-square&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/Django-Backend-092E20?style=flat-square&logo=django" alt="Django"/>
  <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe" alt="Stripe"/>
</div>

---

## 🚀 Overview

**NeuroCampus** is a next-generation, AI-powered, unified campus operating system designed to automate, optimize, and intelligently manage academic, administrative, and placement-oriented workflows in educational institutions. Built with an AI-first architecture, NeuroCampus integrates face recognition attendance, BLE-based presence detection, complete college management, CO/PO attainment automation, AI interviews, coding analytics, proctoring, payments, surveillance, and predictive insights into a single scalable platform.

This project is designed and developed as an industry-level, production-ready system, suitable for real-world deployment in colleges, universities, and training institutions.

---

## 🎯 Key Highlights

- 🤖 **AI Face Recognition Attendance** (single-snap whole-class)
- 📡 **BLE (Bluetooth Low Energy) Attendance**
- 🏫 **Complete College Management System (CMS)**
- 📊 **Automated CO / PO Attainment & Academic Analytics**
- 🎤 **AI-Powered Interview Simulator** (Real-time HR & Technical)
- 💻 **AI Coding Platform with Analytics & Leaderboards**
- 👁️ **AI Proctoring** (Online & Offline Exams)
- 💳 **Stripe-based Secure Payment Integration**
- 🔒 **AI Surveillance & Campus Safety**
- 📈 **Predictive Student Performance Analytics**
- ☁️ **Fully Cloud-Deployed, Scalable & Secure**

---

## 🎯 Problem Statement

Traditional campus systems rely heavily on manual processes and fragmented software, leading to inefficiency, inaccuracies, poor analytics, and limited insight into student performance and placement readiness. There is a lack of a unified, intelligent platform that automates attendance, academics, assessments, interviews, coding evaluations, payments, and analytics. NeuroCampus addresses this gap by providing a single AI-driven campus operating system that automates end-to-end campus operations with high accuracy, scalability, and intelligence.

---

## 🏗️ System Architecture Overview

NeuroCampus follows a modern cloud-native, modular architecture:

| Component | Technology | Deployment |
|-----------|------------|------------|
| **Frontend** | React (TypeScript) | Vercel |
| **Backend** | Django + Django REST Framework | Render |
| **Database** | PostgreSQL (Managed) | Render |
| **AI/ML** | Computer Vision, NLP, ML Prediction Models | Cloud |
| **Payments** | Stripe API | Stripe |
| **Storage** | Cloud Object Storage | AWS S3 / Cloudinary |
| **Security** | JWT Auth, Role-Based Access, SSL | Integrated |

---

## 🧩 Core Modules

### 1️⃣ AI Face Recognition Attendance
- Single photo → whole class attendance
- High-accuracy face detection & recognition
- Liveness detection & proxy prevention
- Confidence-based matching with manual override
- Attendance analytics & anomaly detection

### 2️⃣ BLE (Bluetooth Low Energy) Attendance
- IoT-based presence detection
- Suitable for labs, auditoriums, outdoor classes
- Secure device verification
- Can be combined with face attendance for higher accuracy

### 3️⃣ College Management System (CMS)
- Student & faculty management
- Courses, subjects & timetable
- Attendance & internal marks
- Leave management workflow
- Notifications & reports
- Role-based access (Admin / Faculty / Student)

### 4️⃣ CO / PO Attainment Automation
- Automated CO mapping with assessments
- CO-wise, course-wise & program-wise reports
- Attainment calculation & visualization
- Early prediction of outcome gaps
- AI-driven academic insights

### 5️⃣ AI Interview Simulator
- Real-time AI-driven HR & technical interviews
- Voice-based and camera-based interaction
- Communication, confidence & emotion analysis
- Eye contact & facial expression tracking
- Detailed interview performance report

### 6️⃣ AI Coding Platform & Analytics
- Coding rounds similar to HackerRank / LeetCode
- Multi-language support (Python, Java, C++, JS)
- Real-time code execution
- Time & space complexity analysis
- Code quality & optimization suggestions
- Plagiarism detection
- Job-readiness score

### 7️⃣ Leaderboard & Ranking System
- Skill-based & performance-based ranking
- Coding, interview & academic leaderboards
- Department-wise and batch-wise analytics
- Placement-readiness insights

### 8️⃣ AI Proctoring System
- Multiple face detection
- Eye gaze & head movement tracking
- Mobile device detection
- Audio & behavior monitoring
- Anti-cheating analytics & logs

### 9️⃣ Payments & Finance (Stripe Integration)
- Secure online fee payments
- Automatic receipt generation
- Payment verification via webhooks
- Transaction history & reconciliation
- Fraud/anomaly detection (AI-assisted)

### 🔟 AI Surveillance & Campus Safety
- Unknown person detection
- Crowd density monitoring
- Abnormal behavior & intrusion alerts
- Campus-wide safety analytics

### 1️⃣1️⃣ Analytics & Prediction Engine
- Attendance trend analysis
- At-risk student identification
- Dropout & failure prediction
- Academic performance forecasting
- Automated alerts & recommendations

---

## 🛠️ Tech Stack

### Frontend
- **React** - Modern UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Vercel** - Frontend hosting and deployment

### Backend
- **Django** - High-level Python web framework
- **Django REST Framework** - Powerful API toolkit
- **Python 3.11+** - Programming language
- **Render** - Backend hosting

### Database
- **PostgreSQL** - Advanced open-source relational database
- **Redis** - In-memory data structure store (caching)

### AI / ML
- **Computer Vision** - Face recognition, object detection
- **NLP** - Interview analysis, text processing
- **ML Prediction Models** - Performance forecasting, anomaly detection
- **OpenCV, dlib** - Computer vision libraries

### Payments
- **Stripe API** - Secure payment processing
- **Webhooks** - Real-time payment notifications

### DevOps & Deployment
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipelines
- **Render** - Cloud hosting platform
- **AWS S3 / Cloudinary** - File storage

---

## ☁️ Deployment Configuration

| Component | Details |
|-----------|---------|
| **Backend Hosting** | Render Standard Web Service |
| **Resources** | 1 vCPU, 2 GB RAM |
| **Database** | PostgreSQL (5 GB Managed) |
| **Availability** | Always-On |
| **Security** | HTTPS, SSL, JWT |
| **CI/CD** | GitHub Integration |
| **Monthly Cost** | ~USD 32 |
| **Frontend Hosting** | Vercel (Free Tier) |

---

## 🔐 Security Features

- 🔒 **Encrypted Database Connections** - SSL/TLS encryption
- 🛡️ **JWT Authentication** - Secure token-based auth
- 👥 **Role-Based Access Control** - Granular permissions
- 🔐 **Encrypted Biometric Data** - Secure face encodings
- 💳 **Secure Payment Processing** - PCI-compliant Stripe integration
- 📊 **Audit Logs & Monitoring** - Comprehensive activity tracking
- 🚨 **Real-time Threat Detection** - AI-powered anomaly detection

---

## 📊 Target Users

- 🎓 **Colleges & Universities** - Complete campus digitization
- 🤖 **AI & ML Departments** - Advanced research platforms
- 💼 **Placement Cells** - Automated recruitment workflows
- 🏢 **Training Institutions** - Scalable learning management
- 📚 **EdTech Platforms** - Next-gen educational technology

---

## 🎓 Academic & Industry Value

- 🚀 **Real-world AI Deployment** - Production-grade AI systems
- 🧠 **Comprehensive AI Coverage** - Computer Vision, NLP, ML, Cloud & Security
- 💡 **Startup-grade Architecture** - Scalable, maintainable codebase
- 🏭 **Industry-ready Solution** - Enterprise-level educational platform
- 📖 **Research & Incubation Ready** - Suitable for final-year projects, theses, and startup incubation

---

## 🏁 Conclusion

NeuroCampus is not just a project—it is a complete AI-driven digital transformation platform for educational institutions. By combining intelligent automation, analytics, assessments, and placement readiness into one unified system, NeuroCampus significantly reduces manual workload, improves accuracy, enhances student outcomes, and prepares campuses for the future of AI-powered education.

---

## 👨‍💻 Developed By

<div align="center">

### **Primary Developer**
**Ritesh N**  
[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-blue?style=for-the-badge)](https://riteshn.vercel.app/)  
*Lead Architect & Full-Stack Developer*

### **Co-Developer**
**Pannaga Ja**  
[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-green?style=for-the-badge)](https://pannagaja.vercel.app/)  
*AI/ML Engineer & Backend Specialist*

---

**Department of Computer Science & Engineering (AI & ML)**  
*NeuroCampus Project Team*

</div>

---

<div align="center">

**🌟 Star this repository to support our work! 🌟**

*Empowering Education Through Artificial Intelligence*

</div>
