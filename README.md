# CabSync

CabSync is a modern, responsive ride-sharing and carpooling web application built with React, Vite, Tailwind CSS, and Firebase. It connects people looking for rides with drivers heading in the same direction, making travel more affordable, social, and environmentally friendly.

<img width="1919" height="911" alt="image" src="https://github.com/user-attachments/assets/f33fbe3d-80b1-405d-8811-ce6c4bf56dc3" />
<img width="1919" height="910" alt="image" src="https://github.com/user-attachments/assets/d8206fea-c58a-4ba5-83dd-62d6342d8c5c" />


## 🚀 Features

- **User Authentication:** Secure signup, login, and password recovery using Firebase Authentication.
- **Dashboard:** A central hub to manage your upcoming rides, recent activity, and quick actions.
- **Post a Ride:** Drivers can easily publish their planned routes, departure times, and available seats.
- **Browse & Search Rides:** Passengers can search for available rides based on their destination and preferences.
- **Ride Management:** View detailed ride information, book seats, and manage your posted or joined rides.
- **Real-time Messaging:** In-app chat functionality to communicate with drivers or passengers before the trip.
- **Profile System:** User profiles with avatars, personal information, and ride history.
- **Rating System:** Rate and review users after a completed ride to build a trustworthy community.
- **Admin Dashboard:** A dedicated interface for platform administrators to monitor and manage activity.
- **Responsive Design:** A mobile-first approach ensuring a seamless experience across all devices.

## 🛠️ Tech Stack

- **Frontend Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with a custom "Sunflower Fields" design system.
- **UI Components:** [Material-UI (MUI)](https://mui.com/) & custom Tailwind components.
- **Icons:** [Lucide React](https://lucide.dev/)
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Auth, Firestore)

## 🎨 Design System

CabSync uses a custom design system called **"Sunflower Fields"**, following a strict 60-30-10 UI/UX rule to create a cohesive, modern light theme:

- **60% Dominant:** `#FFFFFF` (Primary Background) & `#D6D6D6` (Light Gray for borders/structural separation)
- **30% Secondary:** `#202020` (Primary Text) & `#333533` (Secondary Text)
- **10% Accent:** `#FFD100` (Deep Yellow/Gold for primary accents) & `#FFEE32` (Light Yellow for hover states)

Typography relies on the **Inter** font family for a clean, highly readable interface.

## ⚙️ Installation & Setup

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or yarn
- A Firebase project

### Steps

1. **Clone the repository (or download the source code):**
   ```bash
   git clone <your-repo-url>
   cd CabSync-Website
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Firebase configuration variables. 
   *(Note: Ensure you have Firebase set up in your Firebase Console)*
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

## 📜 Scripts

- `npm run dev`: Starts the local development server using Vite.
- `npm run build`: Bundles the app into static files for production.
- `npm run preview`: Bootstraps a local web server to preview the production build.
- `npm run lint`: Runs ESLint to analyze the code for potential errors.

## 📁 Project Structure

```
CabSync-Website/
├── public/               # Static assets
├── src/
│   ├── assets/           # Images, icons, etc.
│   ├── components/       # Reusable UI components (Navbar, Footer, ProtectedRoute, etc.)
│   ├── context/          # React Context providers (Auth, Theme, Notification)
│   ├── pages/            # Page components (Dashboard, Login, BrowseRides, etc.)
│   ├── utils/            # Helper functions and utilities
│   ├── App.jsx           # Main application component and routing setup
│   ├── firebase.js       # Firebase initialization and configuration
│   ├── main.jsx          # React application entry point
│   └── index.css         # Global CSS and Tailwind directives
├── index.html            # Main HTML template
├── tailwind.config.js    # Tailwind CSS configuration
├── vite.config.js        # Vite configuration
└── package.json          # Project metadata and dependencies
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/CabSync-Website/issues) if you want to contribute.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
