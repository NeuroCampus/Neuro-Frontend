STALIGHT TECHNOLOGY 

NEURO CAMPUS 


STEPS TO CLONE AND USE THE PROJECT 

```markdown
# Attendance System with Face Recognition

This project is a comprehensive attendance system that uses face recognition technology to automate student attendance tracking. It consists of a React frontend with Tailwind CSS and a Django backend.

## Table of Contents

1. [Features](#features)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Setup Instructions](#setup-instructions)
   - [Frontend Setup](#frontend-setup)
   - [Backend Setup](#backend-setup)
5. [Usage](#usage)
6. [Contributing](#contributing)
7. [License](#license)

## Features

- User authentication
- Student enrollment with face recognition
- Automated attendance taking using facial recognition
- Attendance statistics and reports
- Google Sheets integration for attendance records

## Project Structure

The project is divided into two main parts:

1. **Frontend (React + Tailwind CSS)**
   - User interface for all features
   - Webcam integration for capturing photos
   - Responsive design

2. **Backend (Django + REST API)**
   - Face recognition processing
   - Database for storing student information
   - Google Sheets API integration
   - PDF report generation

## Prerequisites

- Node.js (v14.x or later) and npm (v6.x or later) for the frontend
- Python 3.8+ for the backend
- dlib and OpenCV for face recognition
- Google API credentials for Sheets integration

## Setup Instructions

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
    cd django_backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

### Backend Setup

1. **Navigate to the Django backend directory**:
   ```bash
   cd django_backend
   ```

2. **Create a virtual environment**:
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Download face recognition models**:
   - Download `shape_predictor_68_face_landmarks.dat` and `dlib_face_recognition_resnet_model_v1.dat` from the [dlib website](http://dlib.net/).
   - Place them in the Django backend root directory.

5. **Set up Google API credentials**:
   - Create a service account in Google Cloud Console.
   - Download the credentials JSON file and rename it to `credentials.json`.
   - Place it in the Django backend root directory.

6. **Run migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

7. **Start the Django server**:
   ```bash
   python manage.py runserver
   ```

## Usage

1. **Access the frontend** at `http://localhost:5173`.
2. **Login with default credentials**:
   - Username: `1AM22CI`
   - Password: `CI@2024`
3. **Select semester, section, and subject**.
4. **Use the options** to enroll students, take attendance, or view statistics.

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create a new branch for your feature or bug fix.
2. **Write clean, well-documented code**.
3. **Submit a pull request** with a clear description of your changes.
4. **Report issues** using the GitHub issue tracker.

## License

This project is licensed under the [MIT License](LICENSE).
```

### Additional Tips:

- **Code Examples**: Provide code snippets for common tasks, such as making API requests or handling authentication.
- **FAQ Section**: Include a FAQ section to address common questions and issues.
- **Community and Support**: Mention any community channels (e.g., Slack, Discord) or support email for users to get help.

By incorporating these suggestions, your project documentation will be more comprehensive and user-friendly, making it easier for others to set up, use, and contribute to your project.
