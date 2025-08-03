<!-- PROJECT BANNER -->
<p align="center">
  <img src="public/placeholder.svg" alt="Neuro Campus Banner" width="400"/>
</p>

<h1 align="center">🚀 NEURO CAMPUS: Academic Management System</h1>
<p align="center"><b>Starlight Technology</b> | <i>Futuristic, AI-powered campus automation</i></p>

---

## ✨ Overview

**Neuro Campus** is a next-generation academic management system, blending AI, face recognition, and automation for seamless campus operations. Built with a modern React frontend and a robust Django backend, it empowers admins, HODs, faculty, and students with real-time notifications, analytics, and smart attendance.

---

## 🌟 Features
- 🔐 Secure authentication (multi-role: Admin, HOD, Faculty, Student)
- 🧑‍🎓 Student enrollment with face recognition (dlib + OpenCV)
- 📸 Automated attendance via facial recognition
- 📊 Real-time statistics, dashboards, and analytics
- 📨 Notifications & announcements (role-based, with email)
- 📝 Leave management (faculty & student)
- 📅 Timetable, marks, and study material management
- 📈 Export to Google Sheets & PDF
- 🤖 AI-powered PDF Q&A (Gemini integration)
- 🦾 Modern, responsive UI (React + Tailwind)
- 🛡️ JWT authentication, OTP support

---

## 🖼️ Screenshots & Demo

> _Add your own screenshots, GIFs, or demo videos here!_

<p align="center">
  <img src="public/placeholder.svg" alt="Demo Screenshot" width="300"/>
  <br/>
  <i>Futuristic dashboard, real-time stats, and face recognition in action!</i>
</p>

---

## 🛠️ Tech Stack

| Frontend         | Backend         | AI/ML & Cloud         |
|------------------|----------------|----------------------|
| React (Vite)     | Django 4.2     | dlib, OpenCV         |
| TypeScript       | Django REST    | Google Sheets API    |
| Tailwind CSS     | JWT, OTP, CORS | Gemini (GenAI)       |
| Recharts, jsPDF  | PostgreSQL/SQLite | FAISS, PyMuPDF   |

---

## ⚡ Quickstart

### 1️⃣ Backend Setup

```bash
# Clone the repo
$ git clone <your-repo-url>
$ cd advancedsoftware/django_backend

# Create and activate virtual environment
$ python3.11 -m venv venv
$ source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
$ pip install -r requirements.txt
```

#### Download Face Recognition Models
- [shape_predictor_68_face_landmarks.dat](http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2)
- [dlib_face_recognition_resnet_model_v1.dat](http://dlib.net/files/dlib_face_recognition_resnet_model_v1.dat.bz2)
- _Extract and place both files in the `django_backend/` directory._

#### Google Sheets Integration
- Create a service account in [Google Cloud Console](https://console.cloud.google.com/).
- Download the credentials JSON and rename to `credentials.json`.
- Place it in `django_backend/`.

#### Environment Variables
Create a `.env` file in `django_backend/` with:
```env
GENAI_API_KEY=your_gemini_api_key_here
# Add any other required keys here
```

#### Migrate Database & Create Admin
```bash
$ python manage.py makemigrations
$ python manage.py migrate
$ python manage.py createsuperuser  # Follow prompts to set admin credentials
```

#### Run the Backend
```bash
$ python manage.py runserver
```

---

### 2️⃣ Frontend Setup

```bash
# From project root
$ npm install
$ npm run dev
```
- Access the frontend at [http://localhost:5173](http://localhost:5173)

---

## 👤 User Roles & Login
- **Admin**: Full access, user/branch management
- **HOD**: Branch-level management, analytics, notifications
- **Faculty**: Attendance, marks, proctoring, leave
- **Student**: Dashboard, attendance, study material

#### Default Login (example)
| Role    | Username   | Password   |
|---------|------------|------------|
| Admin   | admin      | (set by you) |
| HOD     | hoduser    | (set by you) |
| Faculty | faculty1   | (set by you) |
| Student | 1AM22CI    | CI@2024     |

- _Create users via Django admin or registration._

---

## 🚀 Usage Guide
1. **Login** as your role
2. **Navigate** to your dashboard
3. **Enroll students** with face recognition (admin/faculty)
4. **Take attendance** (faculty)
5. **View analytics** (HOD/admin)
6. **Send/receive notifications**
7. **Export reports** (PDF/Sheets)
8. **Ask AI** about uploaded PDFs (Gemini Q&A)

> _Enjoy a seamless, automated campus experience!_

---

## 🧩 Major Backend Dependencies
- Django, djangorestframework, django-cors-headers
- dlib, opencv-python, numpy, Pillow
- google-api-python-client, google-auth, google-auth-oauthlib
- reportlab, pandas, openpyxl
- djangorestframework-simplejwt, python-decouple, django-otp, pyotp
- django-email-utils, gunicorn, psycopg2-binary

---

## 📝 Contributing
- Fork, branch, and PR your features/bugfixes
- Write clean, well-documented code
- Use issues for bugs/feature requests

---

## ❓ FAQ
- **Q: I get a dlib/OpenCV error on install?**
  - A: Ensure you have CMake and system build tools installed. See [dlib install guide](http://dlib.net/compile.html).
- **Q: How do I get a Google API key?**
  - A: [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
- **Q: Where do I put my .env and credentials.json?**
  - A: Both go in `django_backend/`
- **Q: How do I reset my admin password?**
  - A: `python manage.py changepassword admin`

---

## 💬 Support & Contact
- _For help, open an issue or email: **support@neurocampus.ai**_
- _Join our Discord: [Invite Link](#)_

---

## 🖤 Futuristic Design
- Modern UI, dark mode, and animated transitions
- Add your own screenshots, GIFs, or demo videos in the demo section above!
- Customizable with your own branding (replace `public/placeholder.svg` and `favicon.ico`)

---

<p align="center">
  <img src="public/placeholder.svg" alt="Futuristic Footer" width="200"/>
  <br/>
  <b>Starlight Technology • Neuro Campus</b>
</p>
