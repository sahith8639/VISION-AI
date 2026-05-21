# Vision AI - Intelligent Classroom Monitoring System

Vision AI is a professional, production-ready AI platform designed to transform online education. It combines high-performance WebRTC video streaming (Google Meet/Zoom style) with advanced Computer Vision to monitor student engagement and distractions in real-time.

---

## 🚀 Key Features

### 1. Real-time AI Monitoring
*   **Distraction Detection**: Automatically detects when students look away from the screen.
*   **Object Detection**: Identifies prohibited items like mobile phones using YOLOv8.
*   **Presence Tracking**: Notifies the teacher if a student leaves their seat or if multiple people are in the frame.
*   **Engagement Scoring**: Calculates a live attention score (0-100%) for every student.

### 2. Teacher Dashboard (Command Center)
*   **Live Video Grid**: Responsive grid displaying all joined students with low-latency WebRTC streams.
*   **Classroom Management**: Generate unique join codes, start/end sessions, and search for specific students.
*   **AI Insights Sidebar**: A real-time feed of distraction alerts and engagement trends.
*   **Media Controls**: Full control over teacher webcam/mic and the ability to monitor student media statuses.

### 3. Student Classroom
*   **Identity System**: Students join using their Full Name and Registration Number for accurate tracking.
*   **Pre-join Preview**: A "Green Room" where students can test their camera/mic before entering.
*   **Resilient Fallback**: Graceful "Join without Camera" or "Audio Only" modes if hardware fails or permissions are denied.
*   **Silent Monitoring**: AI analysis runs in the background, ensuring a natural learning environment.

### 4. Advanced Technology
*   **WebRTC & Socket.IO**: Robust signaling and peer-to-peer streaming architecture.
*   **Database Integration**: Persistent storage for users, classes, and engagement logs using MongoDB.
*   **Fully Responsive**: Glassmorphic, modern UI that works perfectly on Mobile, Tablet, and Desktop.

---

## 🛠️ Tech Stack

*   **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Recharts, Socket.IO Client.
*   **Backend**: FastAPI (Python), Motor (Async MongoDB), Socket.IO, Pydantic v2.
*   **AI/ML**: MediaPipe FaceMesh, OpenCV, YOLOv8 (Ultralytics).
*   **Database**: MongoDB Community Server.

---

## 💻 Getting Started

### Prerequisites
*   **Python 3.10+**
*   **Node.js (v18+)**
*   **MongoDB** (Local instance running on `localhost:27017`)

### 1. Clone & Setup Backend
```bash
git clone <your-repo-url>
cd "Analysis 1/backend"

# Create and activate virtual environment
python -m venv venv
source venv/bin/scripts/activate  # Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create pre-configured test accounts (Teacher & Student)
python seed_db.py

# Start the server
python main.py
```

### 2. Setup Frontend
```bash
cd "../frontend"

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🔑 Pre-Configured Credentials

Use these accounts to test the system immediately without registering:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Teacher** | `teacher@test.com` | `password123` |
| **Student** | `student@test.com` | `password123` |

---

## 📖 How to Use

1.  **Launch a Session**: Login as a **Teacher** and click **"Launch Class"** in the Live Class tab. Copy the 6-digit **Join Code**.
2.  **Join as Student**: Open a new browser window (incognito recommended for same-device testing). Login as a **Student** and go to the Live Class tab.
3.  **Authentication**: Enter your Name, Registration Number, and the **Join Code** from the teacher.
4.  **Hardware Check**: Use the preview screen to check your camera. If your camera is busy or missing, the system will allow you to join in "Audio Only" mode.
5.  **Monitor**: Once the student joins, they will appear instantly on the Teacher's video grid. AI alerts will begin appearing in the sidebar as the student interacts.

---

## ⚠️ Troubleshooting
*   **Camera Not Opening**: Ensure no other apps (Zoom, Teams, or another browser tab) are using your webcam.
*   **Database Connection**: Ensure MongoDB is running. The app connects to `mongodb://127.0.0.1:27017` and uses a database named `engagement-analysis`.
*   **404 Errors**: If a page is not found, stop the frontend terminal and run `Remove-Item -Recurse -Force .next` (PowerShell) or `rm -rf .next` (Bash), then restart with `npm run dev`.
