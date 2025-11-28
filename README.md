# AI Waste Management System

## Overview
A smart waste management system that uses AI to classify waste and manage cleanup tasks.

## Features
- **AI Classification**: Automatically detects "Clean" vs "Garbage" from images.
- **User Reporting**: Users can report waste by uploading images.
- **Worker Management**: Admins can manage workers and assign tasks.
- **QR Login**: Workers can login quickly using QR codes.
- **Real-time Notifications**: Admins receive alerts when workers login/logout.
- **Location Services**: Reports include geolocation data.

## Setup

### Prerequisites
- Docker & Docker Compose
- Node.js (for local frontend dev)
- Python 3.9+ (for local backend dev)

### Running with Docker
```bash
docker-compose up --build
```
- Frontend: http://localhost
- Backend API: http://localhost/api/docs

### Local Development

#### Backend
```bash
cd backend
python -m venv env
source env/bin/activate  # or env\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Usage

### Admin Dashboard
1. Login with an admin account.
2. Navigate to the Dashboard.
3. Use the "Manage Workers" section to create workers and generate QR tokens.
4. View real-time notifications for worker activity.

### Worker Login
1. On the Login page, click "Login with QR Code".
2. Enter the QR token provided by the admin.
