# CabSync — Web Platform

<p align="center">
  <img width="120" alt="ic_cabsync_logo" src="https://github.com/user-attachments/assets/1bf40e57-3be8-4edc-8485-f521d99d2e83" />
</p>

<p align="center">
  <strong>A modern ride-sharing & carpooling platform connecting travelers heading in the same direction.</strong>
</p>

<p align="center">
  <a href="https://cabsync.netlify.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-cabsync.netlify.app-FFD100?style=for-the-badge&logo=netlify&logoColor=black" alt="Live Demo" />
  </a>
  &nbsp;
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  &nbsp;
  <img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  &nbsp;
  <img src="https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white" alt="Netlify" />
</p>

---

## 📖 Overview

CabSync is a full-stack web application that allows users to post and join shared cab/auto rides. Hosts publish their planned routes with available seats and a fare, while passengers can browse, request to join, and chat with fellow riders — all in real time.

This repository contains the **Web Platform** (React/Vite). The companion **Android App** lives in the `Cabsync-App` sibling directory and shares the same Firebase backend.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Email/password signup & login, Google OAuth, password reset |
| 🏠 **Dashboard** | Central hub for upcoming rides, pending requests, and quick actions |
| 🗺️ **Browse Rides** | Search by pickup, destination, date, and time with smart matching |
| 🚗 **Post a Ride** | Hosts publish routes, set seats, fare, AC preference, and car model |
| 📋 **Ride Details** | Live seat count, passenger list, fare split calculator, join requests |
| ✅ **Request System** | Passengers request → Host approves/rejects → both get notified |
| 💬 **Real-time Chat** | Per-ride group chat using Firestore live listeners |
| 📨 **Push Notifications** | FCM-powered push notifications via a Netlify serverless function |
| 👤 **Public Profiles** | View any user's ride history, ratings, and trust indicators |
| ⭐ **Rating & Reviews** | Mutual post-ride rating system to build community trust |
| 🛡️ **Admin Dashboard** | Manage users, rides, and reports; ban/unban accounts |
| 📜 **Ride History** | Archive of all completed and cancelled rides |
| 📱 **Fully Responsive** | Mobile-first layout that works on every screen size |
| 🌙 **Theme Support** | Light and dark mode with system preference detection |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [React 19](https://react.dev/) |
| **Build Tool** | [Vite 8](https://vitejs.dev/) |
| **Routing** | [React Router v7](https://reactrouter.com/) |
| **Styling** | [Tailwind CSS v3](https://tailwindcss.com/) + custom "Sunflower Fields" design system |
| **UI Components** | [Material-UI (MUI)](https://mui.com/) + custom Tailwind components |
| **Icons** | [Lucide React](https://lucide.dev/) + Google Material Symbols |
| **Auth & Database** | [Firebase Authentication](https://firebase.google.com/products/auth) + [Firestore](https://firebase.google.com/products/firestore) |
| **Push Notifications** | [Firebase Cloud Messaging (FCM)](https://firebase.google.com/products/cloud-messaging) |
| **Serverless Backend** | [Netlify Functions](https://docs.netlify.com/functions/overview/) (Node.js) |
| **Hosting** | [Netlify](https://netlify.com/) |

---

## 🎨 Design System — "Sunflower Fields"

CabSync uses a custom design system with a strict 60-30-10 color rule:

| Role | Color | Hex |
|---|---|---|
| **60% Dominant** | Primary Background | `#FFFFFF` |
| **60% Dominant** | Structural Separator | `#D6D6D6` |
| **30% Secondary** | Primary Text | `#202020` |
| **30% Secondary** | Secondary Text | `#333533` |
| **10% Accent** | Brand Yellow (primary) | `#FFD100` |
| **10% Accent** | Brand Yellow (hover) | `#FFEE32` |

**Typography:** [Inter](https://fonts.google.com/specimen/Inter) — Clean, highly legible, modern sans-serif.

---

## 📁 Project Structure

```
CabSync-Website/
│
├── netlify/
│   └── functions/
│       └── sendPush.js          # Serverless function: FCM push notification relay
│
├── public/
│   └── _redirects               # Netlify SPA redirect rule
│
├── src/
│   ├── components/
│   │   ├── ui/                  # Low-level UI primitives
│   │   ├── BannedScreen.jsx     # Shown to banned/restricted users
│   │   ├── Footer.jsx           # Site-wide footer
│   │   ├── Navbar.jsx           # Top navigation bar
│   │   ├── ProtectedRoute.jsx   # Auth guard wrapper for private routes
│   │   ├── RestrictedArea.jsx   # Admin-only area guard
│   │   └── RideCard.jsx         # Reusable ride listing card
│   │
│   ├── context/
│   │   ├── AppContext.jsx        # Global app state
│   │   ├── AuthContext.jsx       # Firebase auth state, user profile
│   │   ├── NotificationContext.jsx # Toast/confirmation dialog provider
│   │   └── ThemeContext.jsx      # Light/dark theme toggle
│   │
│   ├── pages/
│   │   ├── AdminDashboard.jsx    # Admin: user/ride management panel
│   │   ├── BookingConfirmation.jsx
│   │   ├── BrowseRides.jsx       # Search & filter all available rides
│   │   ├── Chat.jsx              # Per-ride real-time group chat
│   │   ├── ConfirmedRide.jsx     # Confirmed booking summary
│   │   ├── Dashboard.jsx         # User home: active & upcoming rides
│   │   ├── EditProfile.jsx       # Profile photo & info editor
│   │   ├── ForgotPassword.jsx    # Password reset flow
│   │   ├── History.jsx           # Past & cancelled rides archive
│   │   ├── Home.jsx              # Public landing page
│   │   ├── Login.jsx             # Email + Google login
│   │   ├── Messages.jsx          # All conversations list
│   │   ├── MyJoinedRides.jsx     # Rides the user has joined as passenger
│   │   ├── MyPostedRides.jsx     # Rides the user has posted as host
│   │   ├── PostRide.jsx          # Create/publish a new ride
│   │   ├── Profile.jsx           # Own profile with stats & reviews
│   │   ├── PublicProfile.jsx     # Any user's public profile
│   │   ├── RateRide.jsx          # Post-ride mutual rating page
│   │   ├── RideDetails.jsx       # Full ride info, join request, chat link
│   │   ├── Settings.jsx          # Account settings & preferences
│   │   └── Signup.jsx            # New account registration
│   │
│   ├── utils/
│   │   └── formatters.js         # Date, time & string formatters
│   │
│   ├── App.jsx                   # Root component & all route definitions
│   ├── firebase.js               # Firebase SDK initialization
│   ├── index.css                 # Global styles & Tailwind base
│   └── main.jsx                  # React app entry point
│
├── index.html                    # HTML shell & font imports
├── tailwind.config.js            # Tailwind theme & plugin config
├── vite.config.js                # Vite bundler config
└── package.json                  # Dependencies & npm scripts
```

---

## ⚙️ Local Setup

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **Firebase project** with Authentication and Firestore enabled

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/CabsyncWhole.git
cd CabsyncWhole/CabSync-Website
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

The Firebase config is hardcoded in [`src/firebase.js`](src/firebase.js). If you fork this project for your own use, replace the `firebaseConfig` object with your own Firebase project credentials from the [Firebase Console](https://console.firebase.google.com/).

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚀 Deployment (Netlify)

The site is deployed automatically via Netlify's GitHub integration. Every push to the `main` branch triggers a new production deploy.

### Build Settings (in Netlify Dashboard)

| Setting | Value |
|---|---|
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |
| **Functions directory** | `netlify/functions` |

### Required Environment Variable

The push notification serverless function requires one secret to be set in **Netlify Dashboard → Site Settings → Environment Variables**:

| Key | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | The full JSON content of your Firebase Admin SDK service account private key |

> **How to get the service account key:**
> Firebase Console → Project Settings → Service Accounts → Generate new private key → Download JSON → paste the entire JSON as the value.

### SPA Routing

A [`public/_redirects`](public/_redirects) file is included to ensure Netlify correctly handles client-side React Router routes:

```
/*  /index.html  200
```

---

## 🔔 Push Notification Architecture

Push notifications are delivered without any paid third-party service, using only Firebase's free quota.

```
Passenger clicks "Request to Join"
         │
         ▼
  [Website / Android App]
  1. Writes request doc to Firestore
  2. Fetches host's FCM token from Firestore
  3. Gets own Firebase Auth ID token
  4. POST → https://cabsync.netlify.app/.netlify/functions/sendPush
         │
         ▼
  [Netlify Function: sendPush.js]
  1. Verifies the caller's Firebase Auth ID token
  2. Builds FCM message payload
  3. Sends notification via Firebase Admin SDK
         │
         ▼
  [Host's Android Device]
  Receives push notification: "X wants to join your ride"
```

---

## 🗄️ Firestore Data Model

| Collection | Key Fields |
|---|---|
| `users` | `uid`, `name`, `email`, `photoUrl`, `fcmToken`, `rating`, `isBanned` |
| `rides` | `hostId`, `pickup`, `destination`, `date`, `time`, `fare`, `seats`, `availableSeats`, `status`, `passengers[]` |
| `requests` | `rideId`, `passengerId`, `hostId`, `status` (`pending`/`approved`/`rejected`/`cancelled`) |
| `messages` | `rideId`, `senderId`, `senderName`, `text`, `timestamp` |
| `ratings` | `rideId`, `raterId`, `ratedUserId`, `score`, `review` |

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite development server with HMR |
| `npm run build` | Build the production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check for code issues |

---

## 🤝 Related Projects

This web platform is part of the **CabSync** monorepo:

| Project | Description |
|---|---|
| [`CabSync-Website`](.) | ← You are here (React/Vite web app) |
| [`Cabsync-App`](https://github.com/abhisheksingh995639/CabSync-App) | Android native app (Jetpack Compose + Kotlin) |

Both share the same Firebase project (Firestore, Auth, FCM).

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ for VIT Bhopal Students
