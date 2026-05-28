# SkinVision AI — Complete Setup Guide
### Step-by-step instructions to run the full project on any PC or Laptop

---

## 📋 Project Overview

SkinVision AI is a clinical-grade skin condition detection app with 3 parts:

| Part | Technology | What it does |
|------|-----------|--------------|
| **Backend** | Python + FastAPI | AI model, image analysis API |
| **Web App** | React + Vite + Express | Browser-based web application |
| **Mobile App** | React Native + Expo SDK 51 | Android APK |

---

## 🖥️ Prerequisites — Install These First

### 1. Node.js (v18 or above)
- Download: https://nodejs.org/en/download
- Choose **"LTS" version** → Windows Installer (.msi)
- Install with default settings
- Verify: Open terminal → `node --version` → should show `v18.x.x` or higher

### 2. Python (3.10 to 3.12 recommended)
- Download: https://www.python.org/downloads/
- **Important:** During install, check ✅ **"Add Python to PATH"**
- Verify: `python --version` → should show `3.10.x` / `3.11.x` / `3.12.x`

> ⚠️ Python 3.13+ may have issues with TensorFlow. Use 3.12 if possible.

### 3. Git
- Download: https://git-scm.com/downloads
- Install with default settings
- Verify: `git --version`

### 4. VS Code (recommended editor)
- Download: https://code.visualstudio.com/

---

## 📁 Step 1 — Get the Project Files

### Option A — From a ZIP file
1. Extract the ZIP to a folder, e.g. `D:\skinvision`
2. Open terminal and go to that folder:
   ```
   cd D:\skinvision
   ```

### Option B — From Git repository
```bash
git clone https://github.com/YOUR_USERNAME/skinvision.git
cd skinvision
```

---

## 🐍 Step 2 — Set Up the Backend (Python API)

Open a terminal and run:

```bash
# Go to backend folder
cd backend

# Create a virtual environment (keeps packages isolated)
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install all required packages
pip install -r requirements.txt
```

### Find your PC's local IP address
You need this to connect the mobile app to the backend.

**Windows:**
```
ipconfig
```
Look for **"IPv4 Address"** under your WiFi adapter (e.g. `192.168.1.5`)

**Mac/Linux:**
```
ifconfig | grep "inet "
```

### Start the backend server
```bash
# Make sure you're in the backend folder with venv activated
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

✅ Backend is running at `http://YOUR_IP:8000`

Test it: Open browser → `http://localhost:8000/health` → should show `{"status":"ok"}`

---

## 🌐 Step 3 — Set Up the Web Application

Open a **new terminal** (keep backend terminal running):

```bash
# Go back to the root project folder
cd D:\skinvision

# Install Node packages
npm install

# Start the web app
npm run dev
```

You should see:
```
[express] serving on port 5000
```

✅ Web app is running at `http://localhost:5000`

Open your browser and go to `http://localhost:5000`

---

## 📱 Step 4 — Set Up the Mobile App

### 4a. Install dependencies

Open a **new terminal**:

```bash
# Go to mobile folder
cd D:\skinvision\mobile

# Install packages
npm install
```

### 4b. Update the backend IP address

Open `mobile/eas.json` in VS Code and update the IP:
```json
"preview": {
  "env": {
    "EXPO_PUBLIC_API_URL": "http://YOUR_IP_ADDRESS:8000"
  }
}
```
Replace `YOUR_IP_ADDRESS` with the IP you found in Step 2.

Also check `mobile/constants/api.ts` — make sure it reads from the env variable.

### 4c. Test in browser (web preview)

```bash
cd mobile
npx expo start --web --port 8083
```

Open browser → `http://localhost:8083`

---

## 📦 Step 5 — Build the Android APK

### 5a. Create a free Expo account
Go to https://expo.dev → Sign Up (free account)

### 5b. Install EAS CLI and login

```bash
cd mobile

# Login to your Expo account
npx eas login
```
A browser window will open — log in with your Expo account.

### 5c. Initialize the project

```bash
npx eas project:init
```
Press Enter to create a new project. This updates `app.json` with your project ID.

### 5d. Build the APK

```bash
npx eas build --platform android --profile preview
```

When asked:
- **"Generate a new Android Keystore?"** → type `y` → Enter

Wait **10–15 minutes**. When done, you'll see:
```
✔ Build finished
🤖 Android APK
https://expo.dev/artifacts/eas/XXXX.apk
```

### 5e. Install on your Android phone
1. Copy the download link
2. Open it on your Android phone's browser
3. Download the APK file
4. Tap the downloaded file → **Install**
5. If "Install from unknown sources" appears → Settings → Allow → Install

---

## 🔥 Daily Usage — Quick Start

Every time you want to use the project, run these **3 terminals**:

### Terminal 1 — Backend
```bash
cd D:\skinvision\backend
venv\Scripts\activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2 — Web App
```bash
cd D:\skinvision
npm run dev
```

### Terminal 3 — Mobile (only if testing browser preview)
```bash
cd D:\skinvision\mobile
npx expo start --web --port 8083
```

---

## ❌ Common Errors & Fixes

### "Module not found" or "Cannot find package"
```bash
# Web app:
cd D:\skinvision && npm install

# Mobile:
cd D:\skinvision\mobile && npm install

# Backend:
cd D:\skinvision\backend && pip install -r requirements.txt
```

### Backend starts but AI model not loading
- The model file must be in `backend/model/` folder
- Check the backend terminal for error messages
- The app still works in demo mode without the model

### APK can't connect to backend
- Make sure your phone and PC are on the **same WiFi network**
- Check the IP address in `eas.json` is correct
- On Windows: Allow port 8000 in Windows Firewall
  - Search "Windows Firewall" → Advanced Settings → Inbound Rules → New Rule → Port → TCP → 8000 → Allow

### "Invalid UUID appId" during EAS build
```bash
# Remove old projectId from app.json, then:
npx eas project:init
```

### Expo web shows blank screen
```bash
# Clear cache and restart:
cd mobile
npx expo start --web --port 8083 --clear
```

### Python not recognized in terminal
- Reinstall Python and check ✅ "Add Python to PATH" during installation
- Or run: `py -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload`

---

## 📁 Project File Structure

```
skinvision/
├── backend/                 ← Python FastAPI AI backend
│   ├── main.py              ← Main API server
│   ├── model/               ← AI model files (.h5 / .tflite)
│   ├── requirements.txt     ← Python packages list
│   └── skinvision.db        ← SQLite database
│
├── client/                  ← React web frontend (src files)
├── server/                  ← Express.js web server
├── mobile/                  ← React Native mobile app
│   ├── app/                 ← Screens (login, tabs, result)
│   │   ├── (tabs)/          ← Tab screens
│   │   │   ├── index.tsx    ← Scan screen
│   │   │   ├── history.tsx  ← Scan history
│   │   │   ├── telederm.tsx ← TeleDerm doctor share
│   │   │   ├── more.tsx     ← Care & resources
│   │   │   └── profile.tsx  ← Patient profile
│   │   ├── login.tsx        ← Login screen
│   │   ├── register.tsx     ← Register screen
│   │   └── result.tsx       ← Scan result screen
│   ├── utils/
│   │   └── auth.ts          ← Authentication (login/register/logout)
│   ├── constants/
│   │   └── api.ts           ← API endpoints
│   ├── app.json             ← Expo app config
│   └── eas.json             ← EAS build config
│
└── SETUP_GUIDE.md           ← This file
```

---

## 🛠️ Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile UI | React Native | 0.74.5 |
| Mobile Framework | Expo SDK | 51 |
| Mobile Routing | Expo Router | v3.5 |
| Web Frontend | React + Vite | 18.3 + 7.3 |
| Web Backend | Express.js | 4.21 |
| AI Backend | FastAPI + Uvicorn | Python |
| AI Model | EfficientNetB3 | TensorFlow |
| Database | SQLite | via FastAPI |
| Build Service | Expo EAS | Cloud |

---

## 📞 Quick Reference

| Service | URL |
|---------|-----|
| Web App | http://localhost:5000 |
| Backend API | http://localhost:8000 |
| API Health Check | http://localhost:8000/health |
| Mobile Preview | http://localhost:8083 |
| Expo Dashboard | https://expo.dev/accounts/dhanushzara |
| EAS Builds | https://expo.dev/accounts/dhanushzara/projects/skinvision-ai/builds |

---

*SkinVision AI v2.0.0 — Built with EfficientNetB3 · FastAPI · Expo SDK 51 · React 18*
