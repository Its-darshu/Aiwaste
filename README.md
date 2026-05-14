# Aiwaste: AI-Powered Waste Management System

## 🎯 Objectives
The primary objective of Aiwaste is to automate the detection and management of public waste. We aimed to build a system where ordinary users can report areas needing cleaning, an AI quickly verifies whether the reported area is actually garbage or clean, and an automated pipeline assigns the verified garbage locations to cleanup workers. This creates a more responsive, transparent, and efficient municipal or campus waste management lifecycle.

## 💡 The Solution
Aiwaste integrates a web application with a deep learning classification model. 
When a user uploads a photo of a location, our backend orchestrates a call to our AI service. If the AI detects "Garbage", the location and image form a `Report` in our database. Administrators can monitor these reports in real-time, generate QR login codes for workers, and track the cleanup progress from "Pending" to "Cleaned".

## ⚙️ How the Whole System Works (Interview Flow)
If you are explaining the project flow during an interview, use this step-by-step breakdown:
1. **User Reporting:** A normal user navigates to the landing page, logs in, and uploads an image (and their location) to report waste.
2. **AI Inference:** The image is sent to the FastAPI backend, which passes it to the `ai_service`. The TensorFlow model (MobileNetV2) processes the image and returns a binary classification: `Garbage` or `Clean`.
3. **Database Logging:** If the image is classified as `Garbage`, a `Report` is generated in the database with status `PENDING`. If it's clean, the user is notified that the area does not require cleanup.
4. **Admin Orchestration:** The Admin views a real-time dashboard displaying all pending tasks, worker activities, and system logs. The admin can assign workers to tasks or generate secure QR Login tokens for workers.
5. **Worker Execution:** Workers use the QR token to quickly log into their dashboard. They see assigned tasks mapped with coordinates, travel to the location, clean it, and upload a "cleanup image" to mark the status as `CLEANED`.
6. **Closing the Loop:** The system maintains a full audit log in the `ActivityLog` sequence for transparency and metrics.

## 💻 Technologies Used
- **Frontend:** React 19, Vite, Tailwind CSS (proxied via Nginx)
- **Backend:** Python, FastAPI
- **Database:** SQLite with SQLAlchemy ORM
- **AI/Machine Learning:** TensorFlow, Keras (MobileNetV2 architecture)
- **Infrastructure:** Docker, Docker Compose, Nginx

## 🗄️ Database Architecture
We use a relational database structure driven by **SQLAlchemy ORM** against an **SQLite** database (`waste.db`). 
The core data models are:
- **User:** Manages multi-role auth (`user`, `worker`, `admin`) and securely stores hashed passwords and QR tokens.
- **Report & ReportMedia:** Holds the core data of the application. Captures the lat/lng coordinates, the original uploaded image (`complaint_id`), the worker assigned to it, and the timestamp and photo of the final cleanup.
- **ActivityLog:** Audits real-time actions (like logins, task creations) mapping timestamps, actions, and user IDs.

## 🧠 AI Models & Architecture
We used **Transfer Learning** to build a highly accurate, lightweight classifier.
- **Base Model:** `MobileNetV2` with weights pre-trained on ImageNet. Used as a feature extractor (the base model layers were frozen).
- **Custom Top Layers:** We passed the output through `GlobalAveragePooling2D`, added a 128-node `Dense` layer with `ReLU` activation, applied a `Dropout(0.2)` explicitly for regularization, and capped it with a 1-node `Dense` layer with a `sigmoid` activation.
- **Outcome:** A Binary Classifier where an output near 1 represents **Garbage** and near 0 represents **Clean**.

## 📊 Datasets Used
The dataset consists of thousands of images, curated entirely from Kaggle and balanced for binary classification:
1. **Garbage Data:** Downloaded from `farzadnekouei/trash-type-image-dataset` via Kaggle. Different classes of trash were combined into a unified 'Garbage' class.
2. **Clean Data:** Pulled from `puneet6060/intel-image-classification` (specifically filtering `street`, `forest`, `mountain`, and `glacier` folders) to serve as counter-examples for the classifier, constrained to match the sizing of the garbage dataset.

---

### Setup Instructions
```bash
# Run the entire stack via Docker
docker-compose up --build
```
- **Web App:** `http://localhost`
- **Backend API:** `http://localhost/api/docs`
