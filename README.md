# ITreal — CompTIA Certification Training Platform

**ITreal** is a production-grade, gamified IT certification training platform built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Firebase** (Authentication, Firestore, and Cloud Storage). It provides students with modular curriculum objectives, practice question drills, timed exam simulations, minigames, study material PDF reading, and POPIA-compliant data management.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20 or v22 (v22 recommended)
- **npm**: v10+

### 2. Environment Setup
Copy `.env.example` to `.env` and fill in your Firebase project parameters:

```bash
cp .env.example .env
```

Define the following environment variables in `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_ID=ai-studio-051dde94-820b-4509-9197-5fcb33f887a2
```

### 3. Installation & Development

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000 with PDF proxy)
npm run dev
```

### 4. Production Build & Local Server

```bash
# Type check and build optimized bundle (Rollup code-split chunks under 500 kB)
npm run build

# Start production server (Node Express + TSX on PORT or 3000)
npm start
```

---

## 🔑 How to Create the First Admin

Administrative privileges are governed strictly by Firestore security rules through the `role` field on the user document.

1. Register an account on the platform using your email or Google Sign-In.
2. Note your user ID (`UID`) from the Firebase Authentication tab.
3. Open the **Firebase Console** and navigate to **Firestore Database**.
4. Select the database (`ai-studio-051dde94-820b-4509-9197-5fcb33f887a2`).
5. In the `users` collection, click on the document with your `UID`.
6. Edit or add the `role` field:
   - **Field name**: `role`
   - **Type**: `string`
   - **Value**: `admin`
7. Refresh the web application. The **Admin Hub** link will appear in your sidebar, granting access to course management, objectives, questions, announcements, vacancies, and reporting tools.

---

## 📦 Production Deployment

### Option A: Cloud Run (Johannesburg `africa-south1`)
The repository includes a production `Dockerfile` (Node 22 Slim) and `server.ts` configured for Cloud Run.

```bash
# 1. Build and deploy container image to Google Cloud Run
gcloud run deploy itreal-app \
  --source . \
  --region africa-south1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000
```

### Option B: Deploying Security Rules Only
To deploy Firestore and Cloud Storage rules without touching hosting:

```bash
# Deploy firestore rules (for named database in firebase.json) and storage rules
firebase deploy --only firestore:rules,storage
```

---

## 🔒 Security & POPIA Compliance

1. **South Africa POPIA Compliance**:
   - Explicit checkboxes on registration ("I accept the Terms and Privacy Policy" and "I am 18 or older, or I have my parent/guardian's permission").
   - First-time Google sign-in consent modal.
   - Comprehensive **Privacy Policy** and **Terms of Use** pages linked in landing footer, sidebar, and profile.
   - **Self-Service Deletion**: A "Delete my account and data" action in `Profile.tsx` that purges user records, subcollections (`testResults`, `notes`, `folders`, `files`, `todo`, `notifications`), leaderboard entries, and Firebase Auth credentials.
2. **Secure PDF Proxy (`/api/pdf-proxy`)**:
   - Validates that requests use HTTPS and only target `firebasestorage.googleapis.com` or `storage.googleapis.com`.
   - Rejects any third-party or spoofed domains with HTTP 403 Forbidden.
3. **Cross-Service Storage Security Rules (`storage.rules`)**:
   - Uploads to `/resources/`, `/course_content/{uid}/`, and `/question_images/{uid}/` are restricted to verified administrators via `firestore.get()`.
   - Students may only upload personal revision files to `/user_uploads/{their_uid}/`.

---

## 🗂️ Project Structure

```
├── components/          # Modular UI components
│   ├── admin/           # Lazy-loaded admin dashboard tabs & modals
│   ├── minigames/       # Lazy-loaded interactive arcade simulations
│   ├── questions/       # Question renderers & scoring engines
│   ├── PrivacyPolicy.tsx# POPIA privacy policy view
│   ├── TermsOfUse.tsx   # Terms of service view
│   ├── TestCenter.tsx   # Practice drills & exam simulations (lazy loaded)
│   └── PDFReader.tsx    # PDF reader with virtualized worker (lazy loaded)
├── animations/          # Shared motion & canvas animations
├── firebase.ts          # Environment-driven Firebase initialization
├── server.ts            # Express production & proxy server
├── vite.config.ts       # Vite config with manualChunks & PDF proxy plugin
├── storage.rules        # Storage security rules
├── firestore.rules      # Firestore security rules
└── DEPLOY.md            # Cloud Run deployment instructions
```
