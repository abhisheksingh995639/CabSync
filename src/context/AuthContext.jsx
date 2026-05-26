import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import KineticDotsLoader from '../components/ui/kinetic-dots-loader';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(undefined);
  const [loading, setLoading] = useState(true);

  const googleProvider = new GoogleAuthProvider();

  // Helper function to check if email is a college email
  const isCollegeEmail = (email) => {
    if (!email) return false;
    const lower = email.toLowerCase();
    return lower.endsWith('.edu') || lower.endsWith('.ac.in');
  };

  // Sign in with Google
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      try {
        // Check if profile exists, if not create one
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) {
          const profileData = {
            name: user.displayName || '',
            phone: user.phoneNumber || '',
            email: user.email,
            photoUrl: user.photoURL || '',
            isVerified: isCollegeEmail(user.email),
            rating: 0,
            createdAt: new Date().toISOString()
          };
          await setDoc(profileRef, profileData);
          setUserProfile(profileData);
        } else {
          const data = profileSnap.data();
          if (!data.isVerified && isCollegeEmail(user.email)) {
            // Auto-verify existing college email users
            const updateData = { ...data, isVerified: true };
            await setDoc(profileRef, updateData, { merge: true });
            setUserProfile(updateData);
          } else {
            setUserProfile(data);
          }
        }
      } catch (firestoreError) {
        console.error("Firestore error during Google login:", firestoreError);
        // We still have the auth user, so we can proceed, 
        // but userProfile might be missing until they go online.
      }
      
      return result;
    } catch (authError) {
      console.error("Google Auth error:", authError);
      throw authError;
    }
  };

  // Sign up and create Firestore profile document
  const signup = async (email, password, additionalData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create the profile document in Firestore
    const profileRef = doc(db, 'users', user.uid);
    const profileData = {
      name: additionalData.name || '',
      phone: additionalData.phone || '',
      email: email,
      photoUrl: '',
      isVerified: isCollegeEmail(email),
      rating: 0,
      ratingCount: 0,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(profileRef, profileData);
    
    await sendEmailVerification(user);
    await signOut(auth);
    
    // We clear userProfile since we're signing them out immediately
    setUserProfile(null);
    
    return userCredential;
  };

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (!user.emailVerified) {
      await signOut(auth);
      throw new Error("unverified_email");
    }
    
    // Check if they need auto-verification upon login
    if (isCollegeEmail(user.email)) {
      try {
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          if (!data.isVerified) {
            await setDoc(profileRef, { isVerified: true }, { merge: true });
            setUserProfile({ ...data, isVerified: true });
          }
        }
      } catch (err) {
        console.error("Auto-verification error on login:", err);
      }
    }
    
    return userCredential;
  };

  const logout = () => {
    return signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Update profile data in Firestore
  const updateProfileData = async (data) => {
    if (!currentUser) return;
    const profileRef = doc(db, 'users', currentUser.uid);
    await setDoc(profileRef, data, { merge: true });
    setUserProfile(prev => ({ ...prev, ...data }));
  };

  useEffect(() => {
    let unsubscribeProfile = null;
    const startTime = Date.now();

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // Clear previous profile listener if any
      if (unsubscribeProfile) unsubscribeProfile();

      const finishLoading = () => {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 3000 - elapsed);
        setTimeout(() => setLoading(false), delay);
      };

      if (user) {
        // We have the auth user, show the app immediately
        finishLoading();
        
        // Use onSnapshot for instant cache access and real-time updates
        const profileRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(profileRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            let shouldUpdate = false;
            let updates = {};

            // Auto-reactivate if deactivated
            if (data.isDeactivated) {
              updates.isDeactivated = false;
              shouldUpdate = true;
            }
            
            // Auto-verify if college email
            if (!data.isVerified && isCollegeEmail(user.email)) {
              updates.isVerified = true;
              shouldUpdate = true;
            }

            if (shouldUpdate) {
              await setDoc(profileRef, updates, { merge: true });
              setUserProfile({ ...data, ...updates });
            } else {
              setUserProfile(data);
            }
          } else {
            // No profile yet (new user), allow them to see the app
            setUserProfile(null);
          }
        }, (error) => {
          console.error("Firestore Profile Error:", error);
          setUserProfile(null);
        });
      } else {
        setUserProfile(null);
        finishLoading();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateProfileData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="flex items-center justify-center min-h-screen bg-surface">
           <KineticDotsLoader />
        </div>
      )}
    </AuthContext.Provider>
  );
};
